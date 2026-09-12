# OLLM Production Readiness

**Service:** OneGodian LLM (OLLM)  
**Target version:** 0.2.0  
**Role:** Provider-neutral inference runtime for OMOS  
**Current maturity:** Functional service boundary / production-readiness candidate  
**Production status:** Not certified by this document

## What changed

The previous repository entrypoint executed a fixed strategy-agent demo and the internal `LLMService` returned an echo response. That behavior is not production inference and must not be represented as such.

Version 0.2.0 introduces an explicit HTTP runtime with:

- `GET /health` — process liveness and runtime identity;
- `GET /ready` — live backend reachability/readiness;
- `GET /v1/models` — OLLM model identity and backend configuration state;
- `POST /v1/chat/completions` — provider-neutral OpenAI-compatible completion contract;
- explicit `503 ollm_backend_not_configured` behavior when no model backend exists;
- backend-model provenance in successful completion responses;
- explicit `unverified_model_output` status and human-review boundary for consequential use;
- request size and backend timeout limits;
- graceful shutdown;
- build, smoke, and production-preflight CI gates.

## Production invariants

Production may be claimed only after all of the following pass for one exact deployed revision:

1. `npm run check` passes.
2. `npm run build` produces `dist/index.js`.
3. `npm run test:smoke` passes using the compiled runtime and an OpenAI-compatible mock backend.
4. `npm run preflight:production` passes with protected environment configuration.
5. `NODE_ENV=production`, `OLLM_VERSION=0.2.0`, and the canonical OLLM model ID are explicitly configured.
6. `OLLM_BACKEND_URL` and `OLLM_BACKEND_MODEL` reference a real authorized backend.
7. `/ready` proves that backend reachable after deployment.
8. A controlled live completion records OLLM model identity, actual backend model provenance, latency/usage where the backend supplies it, and the exact deployed SHA.
9. Restart/redeploy preserves runtime configuration and returns to ready state.
10. OMOS Model Gateway consumes OLLM through the same normalized provider contract used for other models.
11. Consequential external actions remain governed by OMOS/ACC Human Gate; OLLM output alone does not authorize execution.

## Verification boundary

A successful model response is not factual verification. OLLM runtime success proves only that the configured backend produced a response through the OLLM contract. Evidence verification, Council review, Decision Records, and human authority remain OMOS responsibilities.

## Backend boundary

This slice targets an OpenAI-compatible backend protocol so OLLM can front an authorized local or hosted model without hard-coding OMOS to one model vendor. Backend credentials are environment-only and are not returned by runtime endpoints.

The legacy strategy-agent demonstration remains available as `npm run demo:strategy -- "<task>"`; it is no longer the production entrypoint.
