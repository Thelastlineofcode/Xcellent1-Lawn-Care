# Epics and User Stories — Xcellent1 Lawn Care

This document converts the architecture and supporting docs into epics and user stories. Each epic contains an overview, a set of stories with acceptance criteria, priority, estimates, and assigned roles. Roles: PM (product manager), FE (frontend engineer), BE (backend engineer), DEVOPS, QA, DESIGN, BMAD (architecture/compliance reviewer).

---

## Epic 1 — Platform Core & Auth

Overview: Establish the baseline platform: Supabase-backed Postgres + Auth, RLS skeleton, basic Deno API project structure, and a health check.
Priority: P0
Estimate: 8-13 pts
Roles assigned: PM, BE, DEVOPS, QA, BMAD

Stories:

- Story 1.1 — Initialize repository & Deno project
  - Description: Create `deno.json`, basic Hono app, `api/routes/health.ts`, and a `README.md` entry for local dev.
  - Acceptance Criteria: `deno run --allow-net` starts a dev server and GET `/api/v1/health` returns 200 with `{status: "ok"}`.
  - Estimate: 2 pts
  - Roles: BE, DEVOPS, BMAD

- Story 1.2 — Supabase schema + migrations for core tables
  - Description: Add SQL migrations for `customers`, `crews`, `jobs`, `invoices`, `schedules_recurring`, `events_outbox`, `owner_prefs` and initial RLS policy skeletons.
  - Acceptance Criteria: Migrations apply successfully against a local Supabase instance; tables exist and a README documents how to apply migrations.
  - Estimate: 3 pts
  - Roles: BE, DEVOPS, BMAD

- Story 1.3 — Supabase Auth integration & RLS policy basics
  - Description: Wire Supabase Auth into the Deno app (service role key for server) and add example RLS policies for `customers` and `jobs`.
  - Acceptance Criteria: Auth-enabled endpoints reject unauthenticated requests; an authenticated test user can access permitted records per RLS.
  - Estimate: 3 pts
  - Roles: BE, QA, BMAD

---

## Epic 2 — Leads & Intake

Overview: SMS and PWA lead intake, store leads, and trigger quote flow.
Priority: P0
Estimate: 8-13 pts
Roles assigned: PM, BE, FE, QA, BMAD

Stories:

- Story 2.1 — POST `/leads/intake` endpoint
  - Description: Implement validation and persistence for incoming leads from PWA and SMS webhook consumer.
  - Acceptance Criteria: Valid lead payload persists to `customers` or `leads` table and returns `{lead_id, status: "received"}`. Invalid payload returns 400 with validation errors.
  - Estimate: 3 pts
  - Roles: BE, QA, BMAD

- Story 2.2 — Twilio webhook receiver (stub)
  - Description: Endpoint `/webhooks/twilio` to accept Twilio inbound SMS and convert into lead records or replies to existing flows.
  - Acceptance Criteria: Twilio payloads are accepted, signature verification placeholder exists, and events are inserted into `events_outbox`.
  - Estimate: 3 pts
  - Roles: BE, FE, BMAD

- Story 2.3 — Basic front-end lead form (PWA)
  - Description: Simple lead capture form in `frontend/` that POSTs to `/api/v1/leads/intake` and shows a thank-you state.
  - Acceptance Criteria: Form validates client-side, POSTs successfully, and shows server response. Works offline to cache submission and retry when online (basic service-worker stub).
  - Estimate: 3 pts
  - Roles: FE, DESIGN, QA

---

## Epic 3 — Quotes & Pricing Engine

Overview: Implement estimate endpoint and simple pricing logic heuristics for quick quotes.
Priority: P1
Estimate: 5-8 pts
Roles assigned: PM, BE, FE, BMAD

Stories:

- Story 3.1 — POST `/quotes/estimate` (pricing stub)
  - Description: Implement a stateless pricing helper that returns `price_low_cents` and `price_high_cents` with notes and `valid_until`.
  - Acceptance Criteria: Endpoint returns price ranges for inputs (service_type, lawn_size, frequency); unit tests for pricing logic exist.
  - Estimate: 3 pts
  - Roles: BE, PM, BMAD

- Story 3.2 — Integrate estimate UI
  - Description: Add a simple modal in the PWA to request an estimate and display results with two slot options.
  - Acceptance Criteria: UI calls `/quotes/estimate` and renders the two returned slot options.
  - Estimate: 2 pts
  - Roles: FE, DESIGN, QA

---

## Epic 4 — Scheduling & Jobs

Overview: Job creation, scheduling UI, crew assignment, and job lifecycle endpoints.
Priority: P0
Estimate: 13-20 pts
Roles assigned: PM, BE, FE, QA, BMAD

Stories:

- Story 4.1 — POST `/jobs` create job API
  - Description: Create job records, validate availability, and emit `JOB_SCHEDULED` to `events_outbox`.
  - Acceptance Criteria: Job persists with `status: "scheduled"` and an outbox event is created; API returns `{job_id, status: "scheduled"}`.
  - Estimate: 3 pts
  - Roles: BE, QA, BMAD

- Story 4.2 — GET `/jobs/:id` and basic job view
  - Description: Return job details including customer, crew, time_window, and photos URLs.
  - Acceptance Criteria: Endpoint returns job object with signed URLs for photos (or placeholders) and respects RLS for crew vs owner views.
  - Estimate: 2 pts
  - Roles: BE, FE, BMAD

- Story 4.3 — PATCH `/jobs/:id/complete` (crew completes job)
  - Description: Accept before/after photos, duration, and rating; create invoice row and emit `JOB_COMPLETED` event.
  - Acceptance Criteria: Invoice created and stored in `invoices` table, `events_outbox` contains `JOB_COMPLETED` with invoice id, and response contains `{invoice_id, invoice_status, review_link}`.
  - Estimate: 5 pts
  - Roles: BE, FE (photo upload UI), QA, BMAD

- Story 4.4 — Crew mobile view (basic)
  - Description: Mobile-friendly route list and job detail view for crews to mark completion and upload photos.
  - Acceptance Criteria: Crew can view assigned jobs for the day and upload photos to the job complete endpoint.
  - Estimate: 3 pts
  - Roles: FE, QA, BMAD

---

## Epic 5 — Invoicing & Payments

Overview: Invoice generation, Stripe Checkout links, and payment webhook handling.
Priority: P0
Estimate: 8-13 pts
Roles assigned: PM, BE, DEVOPS, QA, BMAD

Stories:

- Story 5.1 — Invoice model + invoice paylink endpoint
  - Description: Create `POST /invoices/:id/paylink` that returns a Stripe checkout URL (or placeholder in dev).
  - Acceptance Criteria: Endpoint returns `{url}`; dev mode returns a dummy URL. Invoice `status` updates when payment occurs via webhook.
  - Estimate: 3 pts
  - Roles: BE, DEVOPS, BMAD

- Story 5.2 — Webhook `/webhooks/stripe` (idempotent)
  - Description: Implement Stripe webhook receiver with signature verification and idempotent handling to mark invoices paid and emit `INVOICE_PAID`.
  - Acceptance Criteria: Webhook verifies signature, ignores duplicates, updates invoice `paid_at` and `status` reliably, and writes processed event id to a `processed_events` table or similar.
  - Estimate: 5 pts
  - Roles: BE, QA, BMAD

---

## Epic 6 — Integrations & Notification System

Overview: Twilio, SendGrid, outbox worker, and notification templates for reminders, receipts, and owner alerts.
Priority: P0
Estimate: 8-13 pts
Roles assigned: PM, BE, DEVOPS, QA, BMAD

Stories:

- Story 6.1 — Outbox table + replay worker
  - Description: Implement `events_outbox` processing worker (stateless function or small worker) that retries on failure and marks attempts.
  - Acceptance Criteria: Worker reads `events_outbox`, sends to third-party stubs (Twilio/SendGrid), and marks success/failure with exponential backoff.
  - Estimate: 5 pts
  - Roles: BE, DEVOPS, BMAD

- Story 6.2 — SendGrid integration (transactional)
  - Description: Send invoice emails, weekly digests, and confirmations through SendGrid with templated content placeholders.
  - Acceptance Criteria: Email templates render with placeholders; dev mode logs messages instead of sending.
  - Estimate: 3 pts
  - Roles: BE, PM, BMAD

- Story 6.3 — Twilio SMS reminders and receive path
  - Description: Implement SMS reminders for upcoming jobs and parse inbound replies for simple interactions.
  - Acceptance Criteria: SMS reminders scheduled via outbox; inbound messages create lead updates or route to existing flow.
  - Estimate: 3 pts
  - Roles: BE, QA, BMAD

---

## Epic 7 — Agents & Automation

Overview: Stateless agent functions for quotes, review invites, and weekly owner digests (Deno cron jobs + agent runtime hooks).
Priority: P1
Estimate: 8-13 pts
Roles assigned: PM, BE, BMAD, DEVOPS

Stories:

- Story 7.1 — Weekly owner digest cron job
  - Description: Deno cron aggregates KPIs for revenue_week, revenue_mtd, jobs_completed, and alerts, and enqueue email/SMS via outbox.
  - Acceptance Criteria: Cron job compiles KPIs and creates outbox events for SendGrid/Twilio; runs correctly in dev (manual trigger script).
  - Estimate: 3 pts
  - Roles: BE, DEVOPS, BMAD

- Story 7.2 — Quote automation agent (stateless)
  - Description: Agent that consumes `LEAD_CREATED` events and attempts to provide a price estimate and two slot options; writes back to job suggestions.
  - Acceptance Criteria: Agent produces consistent estimates and enqueues suggested job creation options into outbox; logs decisions for audit.
  - Estimate: 5 pts
  - Roles: BE, PM, BMAD

- Story 7.3 — Review invitation flow
  - Description: Agent triggers SMS/email after `INVOICE_PAID` to request customer reviews and captures responses.
  - Acceptance Criteria: After payment, a template review email and SMS are enqueued; responses are captured into a `reviews` table.
  - Estimate: 3 pts
  - Roles: BE, PM, BMAD

### Implementation note

AI agent scaffolds were created in the repo under `bmad/agents/` for intake, quote, scheduler, invoice, outbox, digest, and review. Each scaffold includes an `agent.yaml` manifest and a Deno `handler.ts` or `worker.ts` stub. These stubs use a local Supabase client stub (`bmad/agents/supabase_client_stub.ts`) for safe local testing. Integrations and idempotency patterns still need implementation.

Note: AI BMAD agent scaffolds have been created in the repository under `bmad/agents/` for the following agents: intake, quote, scheduler, invoice, outbox, digest, and review. Each contains an `agent.yaml` manifest and a minimal Deno `handler.ts` or `worker.ts` stub. Implementations still need Supabase, Twilio, SendGrid and Stripe wiring and tests.

---

## Epic 8 — Observability, Security & CI/CD

Overview: Add logging, Sentry, webhook signature verification, CI pipeline, and deployment setup for Deno Deploy + static frontend.
Priority: P0
Estimate: 5-8 pts
Roles assigned: DEVOPS, BE, QA, BMAD, PM

Stories:

- Story 8.1 — CI: lint, test, and preview deploy
  - Description: GitHub Actions workflow that runs `deno lint`, unit tests, and deploy previews for frontend and API on branch pushes.
  - Acceptance Criteria: PRs show CI status and preview deploy links; lint errors fail builds.
  - Estimate: 3 pts
  - Roles: DEVOPS, BE, BMAD

- Story 8.2 — Webhook security & idempotency patterns
  - Description: Standardize webhook verification utilities and idempotent processing helpers; tests included.
  - Acceptance Criteria: Utility functions with unit tests and one integration test for duplicate events.
  - Estimate: 2 pts
  - Roles: BE, QA, BMAD

---

## Backlog / Future Epics

- Recurring schedules & billing automation (phase 2)
- Route optimization & crew route suggestions
- Owner dashboard advanced widgets and analytics
- Advanced agent orchestration for SLA-sensitive actions

---

## How to use this document

- PM: review priorities and adjust scope for the next sprint.
- BMAD: review assigned architecture/compliance items and mark acceptance.
- Engineers: pick stories, update estimates, and move to implementation.
- To export: this file can be converted to CSV/JIRA import format on request.

_Generated from `Architecture.md` and workspace docs on 2025-11-06._
