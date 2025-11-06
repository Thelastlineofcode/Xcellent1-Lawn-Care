BMAD Agent Implementation TODOs

The repository contains agent scaffolds under `bmad/agents/` for the following:

- intake
- quote
- scheduler
- invoice
- outbox
- digest
- review

Next implementation steps (recommended order):

1. Implement Supabase client helper (lib/supabase.ts) with env-based keys.
2. Wire intake and quote agents: intake writes leads, quote reads leads and writes job suggestions.
3. Implement outbox worker to dispatch SendGrid/Twilio messages reliably.
4. Implement invoice agent with Stripe integration and webhook idempotency.
5. Add CI checks: `deno lint` and simple unit tests for pricing and outbox logic.

If you want, I can implement items 1–3 now.
