# Deployment guide — Fly.io + Supabase

This document describes how to deploy the Xcellent1 Lawn Care app to Fly.io (application hosting) using Supabase as the Postgres backend.

High level

- Web UI / API: `web/server.ts` (Deno) — deploy to Fly.io as a service.
- Agents: run each agent (outbox worker, intake, invoice, etc.) as separate Fly apps or as jobs/workers.
- Database: Supabase Postgres — run the migration SQL in `bmad/db/migrations/0001_initial_schema.sql`.

Pre-requisites

- Fly CLI: https://fly.io/docs/hands-on/install-flyctl/
- Supabase project and a Postgres database (https://app.supabase.com)
- `psql` client or Supabase CLI to run migrations

1. Prepare Supabase

- From the Supabase dashboard, find the Database connection string (Postgres URL) and the Service Role key.
- Run the initial migration (you can run with `psql` against the database URL):

```bash
# Example, replace with your connection string
psql "postgres://postgres:password@db.host:5432/postgres" -f bmad/db/migrations/0001_initial_schema.sql
```

Alternatively, use the Supabase CLI or the SQL editor in the dashboard and paste the SQL file contents.

2. Configure Fly app and secrets

- Update `fly.toml` `app` field with your chosen Fly app name.
- Build and deploy using `flyctl`.

Set required secrets (replace values from Supabase and Perplexity):

```bash
fly secrets set SUPABASE_URL="https://your-project-ref.supabase.co"
fly secrets set SERVICE_ROLE_KEY="<your-service-role-key>"
fly secrets set PERPLEXITY_API_KEY="<your-perplexity-key>"
```

3. Deploy the web server

```bash
flyctl deploy
```

4. Running agents

- For reliability and separation of concerns, deploy agents as separate Fly apps (e.g., `xcellent1-outbox`, `xcellent1-intake`). Each app can use the same Dockerfile but run a different CMD, like `deno run --allow-net --allow-read --allow-write --allow-env bmad/agents/outbox/worker.ts`.
- Alternatively, run agents as Fly machines or background processes depending on scale.

5. Notes on environment and secrets

- Use Fly secrets (see step 2) to store SUPABASE_URL and SERVICE_ROLE_KEY. Ensure `SERVICE_ROLE_KEY` is kept secret (use Service Role key for server-side operations).
- For Perplexity, store `PERPLEXITY_API_KEY` as a secret.

6. CI / CD

- Add a GitHub Actions workflow to build and push to Fly on merges to `main`. Keep secrets in GitHub Secrets or supply via Fly deploy tokens.

Troubleshooting

- If the web server cannot connect to the DB, verify `SUPABASE_URL` and `SERVICE_ROLE_KEY` are correct. For PostgREST endpoints, ensure your Supabase project allows service role access from the given host.
- If outbox events are not being delivered, verify the agent processes are running and that `SENDGRID_API_KEY` / `TWILIO_AUTH_TOKEN` are set (or allow dev mode simulation if using the stub).
