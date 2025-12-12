Agent Implementation Status

- Scaffolds created for agents: intake, quote, scheduler, invoice, outbox, digest, review
- Supabase client stub added for local testing: `bmad/agents/supabase_client_stub.ts`
- Orchestration workflow and templates added under `bmad/workflows/agents-orchestration`

- LangChain agents prototypes: `bmad/agents/langchain-integration/` — **ARCHIVED** (AI features paused). Set `ENABLE_AI_TESTS=true` to enable prototype tests temporarily.

Next recommended steps:

1. Implement real Supabase client and store secrets in environment / Deno Deploy secrets.
2. Wire Twilio/SendGrid/Stripe integrations with idempotent processing and retries.
3. Add CI: deno lint + unit tests for price heuristics and outbox logic.
