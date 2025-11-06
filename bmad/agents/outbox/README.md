# Outbox Agent

Reliable delivery worker that should read from `events_outbox` and dispatch messages via SendGrid/Twilio. Current `worker.ts` is a local stub.

Next steps:

1. Implement Supabase queries and send logic.
2. Implement exponential backoff and idempotency keys.
