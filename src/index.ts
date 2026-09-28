import http, { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import { runtimeConfig } from './runtime/config';
import { backendConfigured, backendHealth, chatCompletion } from './runtime/backend';

const MAX_BODY_BYTES = 1024 * 1024;
const RATE_WINDOW_MS = 60_000;
const requestWindows = new Map<string, number[]>();

function json(res: ServerResponse, status: number, payload: unknown, requestId: string): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
    'x-request-id': requestId
  });
  res.end(body);
}

function constantTimeEqual(leftValue: string, rightValue: string): boolean {
  const left = Buffer.from(leftValue);
  const right = Buffer.from(rightValue);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function requestIdFor(req: IncomingMessage): string {
  const incoming = String(req.headers['x-request-id'] || '').trim();
  return /^[A-Za-z0-9._:-]{1,128}$/.test(incoming) ? incoming : crypto.randomUUID();
}

function clientKey(req: IncomingMessage): string {
  return String(req.socket.remoteAddress || 'unknown').slice(0, 128);
}

function withinRateLimit(req: IncomingMessage): boolean {
  const now = Date.now();
  const key = clientKey(req);
  const timestamps = (requestWindows.get(key) || []).filter((value) => now - value < RATE_WINDOW_MS);
  if (timestamps.length >= runtimeConfig.OLLM_RATE_LIMIT_PER_MINUTE) {
    requestWindows.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  requestWindows.set(key, timestamps);
  if (requestWindows.size > 10000) {
    for (const [candidate, values] of requestWindows) {
      if (!values.length || now - values[values.length - 1] >= RATE_WINDOW_MS) requestWindows.delete(candidate);
    }
  }
  return true;
}

function completionAuthorized(req: IncomingMessage): boolean {
  const requiredKey = runtimeConfig.OLLM_API_KEY.trim();
  if (!requiredKey) return runtimeConfig.NODE_ENV !== 'production';
  const direct = String(req.headers['x-ollm-key'] || '').trim();
  const authorization = String(req.headers.authorization || '').trim();
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || '';
  const presented = direct || bearer;
  return Boolean(presented) && constantTimeEqual(presented, requiredKey);
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) {
      const error = new Error('request_body_too_large');
      (error as Error & { status?: number }).status = 413;
      throw error;
    }
    chunks.push(buffer);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new Error('invalid_json');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validateCompletionInput(value: unknown): Record<string, unknown> {
  if (!isRecord(value) || !Array.isArray(value.messages) || value.messages.length === 0 || value.messages.length > 200) {
    throw new Error('messages_invalid');
  }
  for (const message of value.messages) {
    if (!isRecord(message) || typeof message.role !== 'string' || !['system', 'user', 'assistant', 'tool'].includes(message.role)) {
      throw new Error('messages_invalid');
    }
    if (typeof message.content !== 'string' || message.content.length > 64 * 1024) {
      throw new Error('messages_invalid');
    }
  }
  return value;
}

function publicError(code: string): { status: number; type: string; message: string } {
  if (code === 'request_body_too_large') return { status: 413, type: 'invalid_request_error', message: 'Request body is too large.' };
  if (code === 'invalid_json') return { status: 400, type: 'invalid_request_error', message: 'Request body must be valid JSON.' };
  if (code === 'messages_invalid') return { status: 400, type: 'invalid_request_error', message: 'messages must contain 1–200 text messages with valid roles.' };
  if (code === 'content_type_required') return { status: 415, type: 'invalid_request_error', message: 'Content-Type application/json is required.' };
  if (code === 'ollm_backend_not_configured') return { status: 503, type: 'service_unavailable', message: 'OLLM has no configured model backend.' };
  if (code.startsWith('ollm_backend_')) return { status: 502, type: 'upstream_error', message: 'The configured model backend could not complete the request.' };
  return { status: 500, type: 'ollm_runtime_error', message: 'OLLM could not complete the request.' };
}

function sendError(res: ServerResponse, requestId: string, code: string): void {
  const error = publicError(code);
  json(res, error.status, {
    error: { type: error.type, code, message: error.message, requestId }
  }, requestId);
}

const server = http.createServer(async (req, res) => {
  const requestId = requestIdFor(req);
  const method = req.method || 'GET';
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (method === 'GET' && url.pathname === '/health') {
    return json(res, 200, {
      status: 'ok',
      service: 'onegodian-llm',
      version: runtimeConfig.OLLM_VERSION,
      model: runtimeConfig.OLLM_MODEL_ID,
      environment: runtimeConfig.NODE_ENV,
      backendConfigured: backendConfigured(),
      completionAuthenticationRequired: Boolean(runtimeConfig.OLLM_API_KEY) || runtimeConfig.NODE_ENV === 'production',
      productionClaim: false,
      timestamp: new Date().toISOString()
    }, requestId);
  }

  if (method === 'GET' && (url.pathname === '/ready' || url.pathname === '/readyz')) {
    const backend = await backendHealth();
    return json(res, backend.ok ? 200 : 503, {
      status: backend.ok ? 'ready' : 'not_ready',
      service: 'onegodian-llm',
      version: runtimeConfig.OLLM_VERSION,
      backend,
      productionClaim: false,
      timestamp: new Date().toISOString()
    }, requestId);
  }

  if (method === 'GET' && url.pathname === '/v1/models') {
    return json(res, 200, {
      object: 'list',
      data: [{
        id: runtimeConfig.OLLM_MODEL_ID,
        object: 'model',
        owned_by: 'ONEGODIAN, LLC',
        ready: backendConfigured(),
        backendModel: runtimeConfig.OLLM_BACKEND_MODEL || null,
        verification: 'runtime_configured_not_factually_verified'
      }]
    }, requestId);
  }

  if (method === 'POST' && url.pathname === '/v1/chat/completions') {
    if (!completionAuthorized(req)) {
      return json(res, 401, {
        error: { type: 'authentication_error', code: 'unauthorized', message: 'Valid OLLM API authentication is required.', requestId }
      }, requestId);
    }
    if (!withinRateLimit(req)) {
      res.setHeader('retry-after', '60');
      return json(res, 429, {
        error: { type: 'rate_limit_error', code: 'rate_limited', message: 'Too many requests. Retry later.', requestId }
      }, requestId);
    }
    const contentType = String(req.headers['content-type'] || '').toLowerCase();
    if (!contentType.startsWith('application/json')) {
      return sendError(res, requestId, 'content_type_required');
    }
    if (!backendConfigured()) {
      return sendError(res, requestId, 'ollm_backend_not_configured');
    }
    try {
      const input = validateCompletionInput(await readJson(req));
      const result = await chatCompletion(input);
      return json(res, 200, result, requestId);
    } catch (error) {
      const code = error instanceof Error ? error.message : 'ollm_runtime_error';
      return sendError(res, requestId, code);
    }
  }

  return json(res, 404, { error: { type: 'not_found', code: 'route_not_found', message: 'Route not found', requestId } }, requestId);
});

server.requestTimeout = runtimeConfig.OLLM_REQUEST_TIMEOUT_MS + 5_000;
server.headersTimeout = runtimeConfig.OLLM_REQUEST_TIMEOUT_MS + 10_000;
server.keepAliveTimeout = 5_000;
server.on('error', (error) => {
  console.error(JSON.stringify({ event: 'ollm_server_error', code: error instanceof Error ? error.name : 'server_error' }));
  process.exitCode = 1;
});

server.listen(runtimeConfig.PORT, '0.0.0.0', () => {
  console.log(JSON.stringify({
    event: 'ollm_started',
    service: 'onegodian-llm',
    version: runtimeConfig.OLLM_VERSION,
    port: runtimeConfig.PORT,
    model: runtimeConfig.OLLM_MODEL_ID,
    backendConfigured: backendConfigured(),
    productionClaim: false
  }));
});

let shuttingDown = false;
function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(JSON.stringify({ event: 'ollm_shutdown', signal }));
  const timer = setTimeout(() => process.exit(1), 10000);
  timer.unref();
  server.close(() => {
    clearTimeout(timer);
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
