import http, { IncomingMessage, ServerResponse } from 'http';
import { runtimeConfig } from './runtime/config';
import { backendConfigured, backendHealth, chatCompletion } from './runtime/backend';

const MAX_BODY_BYTES = 1024 * 1024;

function json(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store'
  });
  res.end(body);
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) throw new Error('request_body_too_large');
    chunks.push(buffer);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('invalid_json'); }
}

const server = http.createServer(async (req, res) => {
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
      productionClaim: false,
      timestamp: new Date().toISOString()
    });
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
    });
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
    });
  }

  if (method === 'POST' && url.pathname === '/v1/chat/completions') {
    if (!backendConfigured()) {
      return json(res, 503, {
        error: {
          type: 'service_unavailable',
          code: 'ollm_backend_not_configured',
          message: 'OLLM has no configured model backend. No completion was generated.'
        }
      });
    }
    try {
      const input = await readJson(req);
      if (!Array.isArray(input.messages)) {
        return json(res, 400, { error: { type: 'invalid_request_error', code: 'messages_required', message: 'messages must be an array' } });
      }
      const result = await chatCompletion(input);
      return json(res, 200, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message === 'invalid_json' || message === 'request_body_too_large' ? 400 : 502;
      return json(res, status, { error: { type: 'ollm_runtime_error', code: message, message } });
    }
  }

  return json(res, 404, { error: { type: 'not_found', code: 'route_not_found', message: 'Route not found' } });
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

function shutdown(signal: string): void {
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
