# OLLM Production Architecture

Status: Q3 2026 production upgrade

## 1. Product boundaries

OLLM is one product with three clearly separated surfaces:

- `onegodian.org/ollm` — public marketing, education, pricing, conversion, FAQ, terms links, and launch messaging.
- `llm.onegodian.org` — authenticated OLLM application and dashboard.
- OHI/QOHI runtime services — governed orchestration, policy enforcement, synthesis, logging, and execution controls.

The marketing site must not contain private runtime secrets or provider credentials. The authenticated app must not duplicate long-form marketing content. Runtime services should remain API-driven and independently observable.

## 2. v1.0 request lifecycle

1. Authenticate user.
2. Resolve subscription/entitlement.
3. Validate prompt and model selection.
4. Create execution ID.
5. Dispatch to selected providers through adapters.
6. Capture provider result, latency, token/usage metadata, and failure state.
7. Compare model outputs.
8. Filter unsupported, redundant, unstable, or policy-incompatible material.
9. Normalize surviving signal into the governed output schema.
10. Return the final OHI-governed synthesis.
11. Persist execution/session history.
12. Meter usage and emit auditable operational logs.

## 3. Core service contracts

### Auth service

Required capabilities:
- email sign-in
- Google OAuth
- session issuance and revocation
- password reset or passwordless recovery
- user profile
- role and subscription entitlement

OpenAI-branded account sign-in is optional and must only be exposed if a supported OAuth/identity integration is actually available. OLLM v1.0 does not depend on it.

### Provider adapter

Each model provider adapter must expose one normalized contract:

```ts
interface ProviderRequest {
  executionId: string;
  prompt: string;
  model: string;
  systemContext?: string;
  timeoutMs?: number;
}

interface ProviderResult {
  provider: string;
  model: string;
  status: "success" | "error" | "timeout";
  content?: string;
  latencyMs: number;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
  errorCode?: string;
}
```

Provider-specific payloads must not leak into the synthesis layer.

### Governed output

```ts
interface OLLMOutput {
  executionId: string;
  createdAt: string;
  sourceModels: Array<{ provider: string; model: string; status: string }>;
  method: "compare-filter-normalize-output";
  result: string;
  confidence?: number;
  warnings?: string[];
  audit: {
    policyVersion: string;
    synthesisVersion: string;
  };
}
```

## 4. Application routes

Minimum production UI routes:

- `/` — authenticated workspace/dashboard
- `/login`
- `/signup`
- `/forgot-password`
- `/history`
- `/history/:id`
- `/usage`
- `/billing`
- `/settings`
- `/status` or internal status surface

## 5. Dashboard requirements

The primary screen must contain:
- new prompt composer
- model/provider selection
- run button
- live execution state
- individual source-model result panels
- governed OHI result panel
- execution metadata
- save/copy/export controls where supported

The dashboard should make the distinction between raw provider responses and the final governed output visually explicit.

## 6. Data model

Minimum entities:
- User
- AuthIdentity
- Subscription
- Entitlement
- Conversation
- Execution
- ProviderRun
- GovernedOutput
- UsageEvent
- AuditEvent

No provider API key may be stored in a user-readable table or client bundle.

## 7. Security baseline

Before v1.0 Production:
- server-side secret storage
- rate limiting
- input-size limits
- authenticated API routes
- authorization on history and billing objects
- CSRF/state protection for OAuth flows
- secure cookies/session storage
- redaction of secrets from logs
- provider key rotation procedure
- abuse controls
- dependency scanning
- production CORS policy

## 8. Observability

Every execution should have one stable execution ID propagated through:
- inbound request
- provider calls
- synthesis
- persistence
- usage metering
- error logs

Track at minimum:
- request count
- successful executions
- provider error rate
- timeout rate
- p50/p95 latency
- synthesis failures
- cost/usage by provider and plan

## 9. Monetization contract

Initial product ladder:

### Free
- account required
- constrained monthly usage
- core OLLM experience

### Professional
- recurring subscription
- higher usage limits
- expanded model access where economically viable
- longer history and export features

### Business
- higher limits
- team/account controls
- priority execution
- API-oriented usage as separately activated

Exact prices are business configuration and should not be hard-coded into orchestration logic.

## 10. Repository responsibilities

### `ohi-stack/onegodian-llm`
Owns:
- orchestration engine
- provider abstraction
- scoring/comparison
- synthesis
- governed output schema
- runtime contracts
- OLLM-specific documentation

### `ohi-stack/onegodian-org`
Owns:
- `onegodian.org/ollm` marketing-page source/content package
- public product explanation
- pricing presentation
- conversion links into `llm.onegodian.org`

### `ohi-stack/ohi-control-plane`
Owns shared governance/runtime policy, environment-level control, health and operational coordination when used by OLLM.

## 11. Production gate

OLLM v1.0 is prohibited from being represented as complete until authentication, real provider execution, synthesis, persistence, metering, security controls, observability, CI validation, deployment, and rollback are demonstrably operational and repeatable.
