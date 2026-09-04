# OLLM Authentication & Identity Plan

Updated: 2026-09-03
Status: Launch requirement

## Required launch methods

1. Email authentication — passwordless magic link or email/password, depending on selected identity provider.
2. Google OAuth — supported launch method.
3. OpenAI account login — optional only if a supported and contractually appropriate OpenAI identity/OAuth mechanism is available for this product. It is not a v1 launch blocker.

Do not present an API-key connection flow as "Sign in with OpenAI." Provider API credentials and user identity authentication are separate concerns.

## Session requirements

- secure HTTP-only cookies where applicable
- CSRF protection where applicable
- session expiration and rotation
- account recovery
- logout/revocation
- role and plan entitlements
- audit events for login, logout, entitlement changes and security-relevant account actions

## Roles

- `user` — standard authenticated account
- `business_user` — business entitlement
- `admin` — product administration
- `operator` — runtime/operations access without unnecessary billing or identity authority

## Account record minimum

```ts
export type OLLMAccount = {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  authProvider: "email" | "google" | "other";
  plan: "free" | "professional" | "business";
  role: "user" | "business_user" | "operator" | "admin";
  createdAt: string;
  updatedAt: string;
};
```

## Security boundary

User authentication secrets, provider API secrets and billing credentials must never be exposed to the browser or persisted in conversation content. Provider adapters execute server-side.

## Product boundary

Authentication establishes an OLLM software account only. It does not establish religious membership, legal status, governance status or any other organizational classification outside the software product.
