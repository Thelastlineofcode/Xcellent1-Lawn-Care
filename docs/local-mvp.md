# Local MVP — Run agents entirely offline

This document explains how to run the BMAD agents locally without external services. The repo includes a file-backed dev DB so agents can persist leads, outbox events, and invoices to `bmad/agents/dev_db.json`.

Quickstart

1. Ensure you have Deno installed (https://deno.land).
2. Reset the local dev DB (optional):

```bash
deno run --allow-read --allow-write bmad/agents/dev_db.ts
# or run the reset helper inside the REPL (see API)
```

3. Start the intake agent (accepts POSTs):

```bash
deno run --allow-net --allow-read --allow-write --allow-env bmad/agents/intake/handler.ts
```

4. Start the quote agent:

```bash
deno run --allow-net --allow-read --allow-write --allow-env bmad/agents/quote/handler.ts
```

5. Start the outbox worker (polls and dispatches events):

```bash
deno run --allow-net --allow-read --allow-write --allow-env bmad/agents/outbox/worker.ts
```

6. To test flow:

```bash
curl -X POST http://localhost:8000 -d 'name=Test&phone=+15551234&notes=hello'

curl -X POST http://localhost:8000 -H "Content-Type: application/json" -d '{"service_type":"mowing","lawn_size_sqft":1500}' http://localhost:8000
```

Notes

- All agents fallback to the file-backed dev DB if SUPABASE_URL is not set.
- No external API keys are required for local MVP; SendGrid/Twilio/Stripe integration points are simulated.
- The dev DB file is at `bmad/agents/dev_db.json` and is safe to inspect / commit if desired (contains test data).
