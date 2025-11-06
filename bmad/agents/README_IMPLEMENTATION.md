# How to implement BMAD agents (quick start)

1. Create a secrets file or use Deno Deploy secrets for SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_KEY, SENDGRID_API_KEY, TWILIO_AUTH_TOKEN.
2. Replace `supabase_client_stub.ts` with a proper Supabase client in `bmad/agents/lib/supabase.ts` and import it from agents.
3. Implement idempotency: processed_events table or idempotency_key fields on invoices/outbox events.
4. Add unit tests in `bmad/agents/tests/` for pricing logic and outbox retry behavior.

Want me to implement steps 1–3 (supabase lib + wiring intake & quote + outbox worker)? Reply: "implement items 1-3".
