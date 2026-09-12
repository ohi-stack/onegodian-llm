import http from 'node:http';
import { spawn } from 'node:child_process';

function listen(server) {
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server.address())));
}

const upstream = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/v1/models') {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ object: 'list', data: [{ id: 'mock-backend-model', object: 'model' }] }));
    return;
  }
  if (req.method === 'POST' && req.url === '/v1/chat/completions') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const request = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    res.setHeader('content-type', 'application/json');
    res.setHeader('x-request-id', 'upstream-request-smoke');
    res.end(JSON.stringify({
      id: 'chatcmpl-smoke',
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: request.model,
      choices: [{ index: 0, message: { role: 'assistant', content: 'smoke-ok' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 }
    }));
    return;
  }
  res.statusCode = 404;
  res.end();
});

const upstreamAddress = await listen(upstream);
const runtimePort = Number(process.env.OLLM_SMOKE_PORT || 3299);
const apiKey = 'ollm-smoke-api-key-000000000001';
const runtime = spawn(process.execPath, ['dist/index.js'], {
  env: {
    ...process.env,
    NODE_ENV: 'test',
    PORT: String(runtimePort),
    OLLM_VERSION: '0.2.0',
    OLLM_MODEL_ID: 'onegodian-llm-smoke',
    OLLM_API_KEY: apiKey,
    OLLM_BACKEND_URL: `http://127.0.0.1:${upstreamAddress.port}`,
    OLLM_BACKEND_MODEL: 'mock-backend-model',
    OLLM_REQUEST_TIMEOUT_MS: '5000'
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

let runtimeOutput = '';
runtime.stdout.on('data', chunk => { runtimeOutput += chunk.toString(); });
runtime.stderr.on('data', chunk => { runtimeOutput += chunk.toString(); });

const base = `http://127.0.0.1:${runtimePort}`;

async function waitJson(path, expected = 200) {
  let last;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${base}${path}`);
      if (response.status === expected) return response.json();
      last = new Error(`${path} returned ${response.status}`);
    } catch (error) {
      last = error;
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw last || new Error(`timeout waiting for ${path}`);
}

try {
  const health = await waitJson('/health');
  if (health.service !== 'onegodian-llm' || health.version !== '0.2.0') throw new Error('health identity/version mismatch');
  if (health.completionAuthenticationRequired !== true) throw new Error('completion authentication boundary missing');

  const ready = await waitJson('/ready');
  if (ready.status !== 'ready' || ready.backend?.state !== 'reachable') throw new Error('backend readiness was not proven');

  const models = await waitJson('/v1/models');
  if (models.data?.[0]?.id !== 'onegodian-llm-smoke') throw new Error('model registry mismatch');

  const unauthorized = await fetch(`${base}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'blocked' }] })
  });
  if (unauthorized.status !== 401) throw new Error(`unauthenticated completion returned ${unauthorized.status}, expected 401`);

  const response = await fetch(`${base}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'smoke' }] })
  });
  if (response.status !== 200) throw new Error(`completion returned ${response.status}`);
  const completion = await response.json();
  if (completion.choices?.[0]?.message?.content !== 'smoke-ok') throw new Error('completion payload mismatch');
  if (completion.model !== 'onegodian-llm-smoke') throw new Error('OLLM model identity was not preserved');
  if (completion.ollm?.backendModel !== 'mock-backend-model') throw new Error('backend model provenance missing');
  if (completion.ollm?.upstreamRequestId !== 'upstream-request-smoke') throw new Error('upstream request provenance missing');
  if (completion.ollm?.upstreamResponseId !== 'chatcmpl-smoke') throw new Error('upstream response provenance missing');
  if (completion.ollm?.usage?.total_tokens !== 2) throw new Error('usage provenance missing');
  if (completion.ollm?.verification !== 'unverified_model_output') throw new Error('verification boundary missing');

  console.log(JSON.stringify({
    status: 'PASS',
    service: 'onegodian-llm',
    version: health.version,
    readiness: ready.status,
    authentication: 'PASS',
    completionContract: 'PASS',
    backendProvenance: completion.ollm.backendModel,
    requestProvenance: completion.ollm.upstreamRequestId,
    productionClaim: false
  }, null, 2));
} catch (error) {
  console.error(runtimeOutput);
  console.error(`OLLM smoke FAILED: ${error.message}`);
  process.exitCode = 1;
} finally {
  runtime.kill('SIGTERM');
  upstream.close();
  await new Promise(resolve => setTimeout(resolve, 250));
}
