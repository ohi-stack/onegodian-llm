# OMOS Integration Status — 2026-09-15

## Repository role

`ohi-stack/onegodian-llm` owns the dedicated OLLM / OneGodian model-intelligence product track. OLLM is not the OMOS runtime itself.

The canonical OMOS runtime/site source is `ohi-stack/omos-site/main` and the production target is `https://omos.onegodian.com`.

## Integration contract

OLLM should participate as a first-class provider through the OMOS Model Gateway only after it exposes versioned model identity, health, invocation, provenance, evaluation, latency/error behavior, and capability declarations compatible with the normalized OMOS provider contract.

OMOS remains responsible for orchestration, Council state, governed synthesis, Human Gate, Decision Records, persistence, audit/history, and source-of-record boundaries.

## Current OMOS target

The canonical OMOS repository targets runtime `1.1.0` and includes normalized OpenAI, Anthropic, Gemini, and xAI adapter contracts; strict production preflight; durable PostgreSQL Decision Records; owner isolation; audit chaining; MCP authorization hardening; and OMOS-REF-0001 production verification tooling.

## OLLM production gate

OLLM must not be represented as a live native OMOS provider merely because architecture or UI exists. Production activation requires:

1. successful live inference against the intended model/version;
2. normalized provider response/provenance fields;
3. health and failure-mode tests;
4. latency/usage telemetry;
5. OMOS Council integration tests;
6. human-review compatibility;
7. deployed runtime evidence.

## Production boundary

As of September 15, the canonical OMOS host was still observed on runtime `1.0.1` while the repository target is `1.1.0`; OLLM integration should therefore target the current canonical source contract rather than the older deployed runtime behavior.
