import { runtimeConfig } from './config';

function endpoint(path: string): string {
  if (!runtimeConfig.OLLM_BACKEND_URL) throw new Error('ollm_backend_not_configured');
  return `${runtimeConfig.OLLM_BACKEND_URL.replace(/\/$/, '')}${path}`;
}

function headers(): Record<string, string> {
  const result: Record<string, string> = { 'content-type': 'application/json', accept: 'application/json' };
  if (runtimeConfig.OLLM_BACKEND_API_KEY) result.authorization = `Bearer ${runtimeConfig.OLLM_BACKEND_API_KEY}`;
  return result;
}

async function backendJson(path: string, init: RequestInit = {}): Promise<{ response: Response; payload: any; latencyMs: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), runtimeConfig.OLLM_REQUEST_TIMEOUT_MS);
  const started = Date.now();
  try {
    const response = await fetch(endpoint(path), {
      ...init,
      headers: { ...headers(), ...(init.headers || {}) },
      signal: controller.signal
    });
    let payload: any;
    try { payload = await response.json(); }
    catch (error) {
      if (controller.signal.aborted) throw new Error('ollm_backend_timeout');
      throw new Error(`ollm_backend_invalid_json_${response.status}`);
    }
    return { response, payload, latencyMs: Date.now() - started };
  } catch (error) {
    if (controller.signal.aborted && !(error instanceof Error && error.message === 'ollm_backend_timeout')) {
      throw new Error('ollm_backend_timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function backendConfigured(): boolean {
  return Boolean(runtimeConfig.OLLM_BACKEND_URL && runtimeConfig.OLLM_BACKEND_MODEL);
}

export async function backendHealth(): Promise<{ ok: boolean; state: string; latencyMs: number; model: string | null; error?: string }> {
  if (!backendConfigured()) return { ok: false, state: 'not_configured', latencyMs: 0, model: null };
  try {
    const { response, latencyMs } = await backendJson('/v1/models', { method: 'GET' });
    if (!response.ok) return { ok: false, state: `http_${response.status}`, latencyMs, model: runtimeConfig.OLLM_BACKEND_MODEL || null };
    return { ok: true, state: 'reachable', latencyMs, model: runtimeConfig.OLLM_BACKEND_MODEL || null };
  } catch (error) {
    return { ok: false, state: error instanceof Error && error.message === 'ollm_backend_timeout' ? 'timeout' : 'unreachable', latencyMs: runtimeConfig.OLLM_REQUEST_TIMEOUT_MS, model: runtimeConfig.OLLM_BACKEND_MODEL || null, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function chatCompletion(input: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (!backendConfigured()) throw new Error('ollm_backend_not_configured');
  const { response, payload, latencyMs } = await backendJson('/v1/chat/completions', {
    method: 'POST',
    body: JSON.stringify({ ...input, model: runtimeConfig.OLLM_BACKEND_MODEL })
  });

  if (!response.ok) {
    const error = new Error(`ollm_backend_http_${response.status}`);
    (error as any).status = response.status;
    (error as any).payload = payload;
    throw error;
  }
  if (!payload || !Array.isArray(payload.choices)) throw new Error('ollm_backend_invalid_completion_contract');

  const upstreamModel = payload.model || runtimeConfig.OLLM_BACKEND_MODEL;
  const upstreamRequestId = response.headers.get('x-request-id') || response.headers.get('request-id') || null;
  return {
    ...payload,
    model: runtimeConfig.OLLM_MODEL_ID,
    ollm: {
      runtime: 'onegodian-llm',
      runtimeVersion: runtimeConfig.OLLM_VERSION,
      backendModel: upstreamModel,
      upstreamResponseId: payload.id || null,
      upstreamRequestId,
      latencyMs,
      usage: payload.usage || null,
      verification: 'unverified_model_output',
      humanReviewRequiredForConsequentialUse: true
    }
  };
}
