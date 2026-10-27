# RSI-OHI-001 experimental baseline
Status: proposed experiment; not deployed or verified. October 27, 2026.
Originator and System Architect: One Gregory Onegodian; ONEGODIAN, LLC.

## Scope
Establish a new research-answering baseline for paired synthetic evaluation. This is a newly defined experimental baseline, not a representation of current production OHI behavior. No application runtime configuration or policy changes are made by this document.

## Baseline B0 v1 — exact system instruction
```
Answer the user's question based on the provided source excerpts. Be clear and concise.
```

## Candidate C1 v1 — exact system instruction
```
Answer the user's question based on the provided source excerpts. Be clear and concise.
Use only the supplied evidence for factual claims. Cite the source identifier for each material claim. Identify material disagreements without resolving them unless the evidence supports resolution. State when the evidence is insufficient; do not invent sources or facts.
```

## Fixed experiment settings
Use identical source excerpts and user question for both arms. Set temperature to 0, max output tokens to 512, and streaming to false, subject to verified backend support. Do not silently substitute unsupported parameters. Capture the full actual request, provider, model identifier and revision, API version, returned model identity, parameters, source commit, timestamp, output, usage and latency. The model identity is UNRESOLVED: select an authorized available backend, verify its actual model identifier and supported parameters, and freeze these before either arm is run. Temperature zero does not guarantee determinism. Never commit credentials.

## Execution and acceptance
Obtain an independent human-prepared protected synthetic holdout, blinded scoring and precommitted rubric. Compare both arms case by case for unsupported factual claims, source traceability, conflicts, uncertainty, correctness, latency and cost when available. Do not promote automatically; a human must review exact versions, results, scope and rollback target. No production data, agent-generated code execution, external actions or production credentials. OSR 0.2 is not a hardened sandbox; no OSR enforcement is claimed. If authorization or evaluation evidence is missing, stop.

## Evidence
Source snapshot `fcb7d0057c2ce168dfde5a9539189181c8ce8d05`: src/index.ts accepts caller messages; src/runtime/backend.ts forwards them to configured backend and reports output unverified. scripts/smoke-runtime.mjs uses a mock. No baseline/candidate quality comparison, model validation, independent assessment, live deployment or OMOS durable record has yet been verified.
