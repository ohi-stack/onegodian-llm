# OMOS Phase I Integration Contract

**Software authority:** OneGodian LLM Synthesis Engine™ / OLLM™  
**Canonical source repository:** ohi-stack/onegodian-llm  
**OMOS documentation/integration node:** https://omos.onegodian.com  
**Shared platform API backbone:** https://api.onegodian.org

## Purpose

This contract defines how the OneGodian LLM Synthesis Engine integrates into OMOS without transferring source-of-truth authority to a model provider, WordPress site, or presentation layer.

## Authority Chain

Human authority
→ ACC authorization / action governance
→ O-H-I / OMOS evaluation and governed synthesis
→ OneGodian LLM Synthesis Engine provider coordination
→ api.OneGodian.org authorized execution backbone
→ approved tools, plugins, registries, and services
→ verification / audit / human review

## OMOS Phase I Routes

- /onegodian-llm — primary public architecture page
- /llm — public alias
- /architecture — portable intelligence / OIPS architecture
- /algorithm — OneGodian Algorithm reference
- /frequency-standard — OneGodian Frequency Standard reference
- /founder-framework — founder and enterprise operating framework
- /ollm — operational OLLM workspace/runtime surface
- /ohi-output-pipeline — governed synthesis visualization
- /models — provider/model connector state

## WordPress Bridge

The shared OneGodian Platform Plugin exposes OMOS content through these canonical shortcodes:

- [omos_manifest]
- [omos_runtime_status]
- [omos_bridge_builder]
- [omos_tool_grid]
- [omos_docs_grid]
- [omos_ohi_pipeline]
- [omos_about_llm]
- [omos_algorithm_summary]
- [omos_frequency_standard]
- [omos_founder_perspective]

The WordPress bridge is a presentation/integration client. It does not duplicate the Synthesis Engine runtime.

## Portability Contract

The Synthesis Engine should continue to separate:

1. Instructions / Rules
2. Knowledge / RAG
3. Skills
4. Tools / Actions
5. Tests / Verification

Provider-specific APIs are adapters to this architecture, not the canonical architecture itself.

## Production Discipline

- A configured provider is not automatically a verified-live provider.
- Model agreement is not factual verification.
- Repository code is not deployment proof.
- A public route is not evidence that every referenced backend capability is production-ready.
- Human approval remains required wherever the governing workflow, law, policy, or system contract requires it.

## Current Status

Phase I adds the public OMOS intelligence documentation and WordPress integration layer. The Synthesis Engine retains its own separate v1.0 production Definition of Done in this repository.
