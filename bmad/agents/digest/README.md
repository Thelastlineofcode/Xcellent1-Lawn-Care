# Digest Agent

Weekly owner digest agent aggregates KPIs and writes owner email/SMS events to outbox. Current `handler.ts` is a stub.

Next steps:

1. Implement KPI queries in Supabase.
2. Compose templated digest and enqueue to outbox.
