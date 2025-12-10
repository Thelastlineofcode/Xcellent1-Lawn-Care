# AI & Agent Features: Suspended / Future Roadmap

As of 2025-12-10, all experimental AI/agent-related work in this repository has been temporarily suspended and archived. The project focuses on delivering a stable MVP without AI-driven automation.

Key decisions:
- AI and agent prototypes in `bmad/agents/langchain-integration/` are archived and no longer executed in CI by default.
- The Perplexity research skill in `src/skills/perplexity/` is archived and no longer used by runtime components.
- CI job for Python LangChain prototype tests is gated behind `ENABLE_AI_TESTS` environment variable and is disabled by default.
 - TypeScript/Deno prototypes (e.g., `src/skills/perplexity/skill.ts`) are also guarded by `ENABLE_AI_PROTOTYPES` and will throw at runtime unless set to `true`.

Future Plan (TTS simple agent):
- Implement a small TTS-enabled helper agent for owner notifications in a later phase.
- The TTS agent will be a light-weight feature, implemented with minimal dependencies and run as an opt-in worker or service. It will not replace manual workflows.

TTS Implementation - Future Notes:
- Prototype: A single TTS worker that pulls events from the `outbox_events` table and converts specific templates to audio files (public URL via Supabase Storage) and optionally attaches to owner notifications.
- Minimal Dependencies: Use a provider with a straightforward HTTP API (e.g., Google Cloud Text-to-Speech, Polly, or open-source TTS) and a lightweight worker. Ensure rate-limiting and cost controls are applied.
- Opt-in: Owner/tenant toggles TTS feature in their dashboard; worker only processes events for enabled accounts.
- Audit: All TTS actions must be recorded in `agent_audit` or `outbox_events` with a processed flag and filesystem path/URL for the audio file.

How to re-enable temporarily:
1. Set `ENABLE_AI_TESTS=true` in CI or your local environment.
2. For TypeScript/Deno prototypes, set `ENABLE_AI_PROTOTYPES=true` in your environment and run tests with `--allow-env`.
2. Run the prototype test suite under `bmad/agents/langchain-integration/tests` only after refactoring and adding safeguards (outbox, idempotency, rate limits).

If you need me to resurrect a specific agent prototype (e.g., QuoteAgent), I can scaffold a clean, production-ready module and a step-by-step migration plan. For now, AI work remains deferred.
