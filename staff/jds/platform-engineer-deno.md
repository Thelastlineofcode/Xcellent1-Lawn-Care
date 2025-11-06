# Job Description: Platform Engineer — Deno / Supabase

Hiring priority: P0

## Role summary

The Platform Engineer builds and maintains the Deno Deploy API surface, cron jobs, webhook receivers, outbox worker, CI/CD pipelines, and Supabase schema/migrations. This role ensures reliability, security, and low-cost operations for the platform.

## Responsibilities

- Implement and maintain Deno Deploy functions (Hono/Fresh patterns), webhook endpoints, and cron jobs.
- Manage Supabase schema, migrations, RLS policies, and backups.
- Build the outbox worker and idempotent webhook processors for Stripe/Twilio/SendGrid.
- Configure GitHub Actions for linting, tests, and preview deploys; manage secrets for environments.
- Observe and tune costs, implement retries, correlation IDs, and Sentry integrations.

## Required skills & experience

- Strong TypeScript experience; production Deno experience preferred.
- Familiarity with Supabase/Postgres (migrations, RLS, SQL).
- Experience with webhook security (Stripe/Twilio signature verification) and idempotency.
- CI/CD knowledge (GitHub Actions) and basic infra as code patterns.
- Comfortable with observability (Sentry, logging) and monitoring costs.

## KPIs

- Uptime and error rate for API endpoints
- Mean time to recover (MTTR) for incidents
- Deploy frequency and lead time
- Cost per customer and alerts on quota thresholds

## Interview checklist

1. Describe a webhook integration you implemented and how you ensured idempotency.
2. Explain how you'd design an outbox worker for retry/backoff and safe delivery.
3. Show a short SQL migration example and how you'd apply it via CI.

## Onboarding (first 2 weeks)

1. Gain access to Deno Deploy project and Supabase dev instance.
2. Run migrations locally and deploy a test function to Deno.
3. Implement a small health-check and webhook test harness.
