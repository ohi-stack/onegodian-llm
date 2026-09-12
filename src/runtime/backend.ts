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

async function backendRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), runtimeConfig.OLLM_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(endpoint(path), { ...init, headers: { ...headers(), ...(init.headers || {}) }, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export function backendConfigured(): boolean {
  return Boolean(runtimeConfig.OLLM_BACKEND_URL && runtimeConfig.OLLM_BACKEND_MODEL);
}

export async function backendHealth(): Promise<{ ok: boolean; state: string; latencyMs: number; model: string | null; error?: string }> {
  const started = Date.now();
  if (!backendConfigured()) return { ok: false, state: 'not_configured', latencyMs: 0, model: null };
  try {
    const response = await backendRequest('/v1/models', { method: 'GET' });
    if (!response.ok) return { ok: false, state: `http_${response.status}`, latencyMs: Date.now() - started, model: runtimeConfig.OLLM_BACKEND_MODEL || null };
    await response.json();
    return { ok: true, state: 'reachable', latencyMs: Date.now() - started, model: runtimeConfig.OLLM_BACKEND_MODEL || null };
  } catch (error) {
    return { ok: false, state: 'unreachable', latencyMs: Date.now() - started, model: runtimeConfig.OLLM_BACKEND_MODEL || null, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function chatCompletion(input: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (!backendConfigured()) throw new Error('ollm_backend_not_configured');
  const response = await backendRequest('/v1/chat/completions', {
    method: 'POST',
    body: JSON.stringify({ ...input, model: runtimeConfig.OLLM_BACKEND_MODEL })
  });

  let payload: any;
  try { payload = await response.json(); }
  catch { throw new Error(`ollm_backend_invalid_json_${response.status}`); }
  if (!response.ok) {
    const error = new Error(`ollm_backend_http_${response.status}`);
    (error as any).status = response.status;
    (error as any).payload = payload;
    throw error;
  }

  const upstreamModel = payload?.model || runtimeConfig.OLLM_BACKEND_MODEL;
  return {
    ...payload,
    model: runtimeConfig.OLLM_MODEL_ID,
    ollm: {
      runtime: 'onegodian-llm',
      runtimeVersion: runtimeConfig.OLLM_VERSION,
      backendModel: upstreamModel,
      verification: 'unverified_model_output',
      humanReviewRequiredForConsequentialUse: true
    }
  };
}
