# OLLM Product UI Architecture

Updated: 2026-09-03
Status: Production-track UI specification

## Canonical domains

- Marketing: `https://onegodian.org/ollm`
- Application: `https://llm.onegodian.org`

## Public application routes

- `/` — OLLM application landing page
- `/login` — sign in
- `/signup` — account creation
- `/forgot-password` — account recovery
- `/privacy` — privacy notice
- `/terms` — terms of service
- `/status` — public system status

## Protected application routes

- `/dashboard` — account overview and recent executions
- `/synthesis` — primary multi-model workspace
- `/history` — saved conversations and executions
- `/saved` — user-pinned outputs
- `/models` — available provider/model catalog and status
- `/usage` — usage metering and limits
- `/billing` — plan and billing controls
- `/settings` — account and product settings
- `/profile` — user profile

## Dashboard layout

### Left navigation
Dashboard, New Prompt, History, Saved, Models, Usage, Billing, Settings.

### Top bar
Current plan, runtime status, provider availability, account menu.

### Main dashboard cards
- New synthesis
- Recent conversations
- Usage this period
- Model/provider status
- Saved outputs
- Product notices

## Synthesis workspace

### Prompt panel
- prompt textarea
- optional system/context field where plan permits
- model selection
- run button
- estimated/actual usage feedback where supported

### Execution panel
Display each provider independently with status values such as queued, running, complete, timeout or failed. Never hide a provider failure inside the final result.

### Governed synthesis panel
Display OHI Governed Synthesis separately from raw provider responses. Include:
- execution ID
- overall status
- governance pipeline status
- warnings
- synthesis output
- save/export/copy actions

## Design language

Use the OneGodian technical product visual system: dark navy/obsidian foundation, restrained gold identity accents, blue runtime/data accents, high legibility, clear status color semantics, subtle motion and no decorative effect that obscures operational state.

## Accessibility

- WCAG-aware contrast
- keyboard operability
- visible focus states
- semantic labels
- screen-reader labels for execution status
- reduced-motion support
- mobile responsive layouts

## Claims discipline

The dashboard must display only providers and capabilities actually configured in the active environment. Mock provider cards, unavailable OAuth providers, unimplemented exports or planned enterprise controls must be identified as unavailable, preview or roadmap rather than represented as live.
