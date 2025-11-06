# Invoice Agent

Creates invoice records from completed jobs and requests Stripe paylinks. Current `handler.ts` contains a stub returning a mock paylink.

Next steps:

1. Wire to Stripe SDK/HTTP API with secret management.
2. Implement idempotent checks using invoice state and a processed_events table.
