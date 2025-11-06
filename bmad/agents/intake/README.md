# Intake Agent

This agent listens for inbound Twilio webhooks and PWA lead submissions. It validates payloads, writes leads to Supabase, and enqueues quote events in `events_outbox`.

Files:

- `agent.yaml` — agent manifest
- `handler.ts` — Deno handler stub

Next steps to implement:

1. Add Twilio signature verification
2. Implement Supabase insert logic for leads and outbox
3. Add unit tests for payload parsing and idempotency
