Here’s a production-ready, lean architecture for Xcellent 1’s web app and agent system, aligned to BMAD standards and excluding the innovation roadmap content.

## One‑sentence overview
A lightweight, serverless, agent‑ready platform using Deno Deploy for APIs/agents, Supabase for auth/data, Twilio/SendGrid/Stripe for comms and payments, and a static PWA frontend—optimized for low cost, low ops, and fast iteration under BMAD guidelines.[1][2][3][4]

## System goals
- Centralize customers, jobs, crews, invoicing, and owner updates with minimal operational overhead and cost.[1]
- Enable AI agents to handle intake, dispatch, billing, weekly digests, and compliance alerts through stable APIs and event hooks.[1]
- Prioritize small-footprint hosting (Deno Deploy + static PWA) and pay‑per‑use services for SMS/email/payments to keep TCO low.[2][3][4]

## Architecture summary
- Frontend: Static PWA (HTML/TS + Tailwind) on Netlify/Cloudflare Pages; no image optimization layer to avoid dynamic image costs.[4][1]
- Backend/API: Deno Deploy functions (Hono/Fresh) for REST + signed webhook endpoints, with cron for weekly digests and retries.[2][1]
- Database: Supabase (PostgreSQL + Row Level Security + Auth + Storage) with real‑time channels for job/crew updates.[1]
- Messaging: Twilio SMS webhooks for intake, reminders, and owner alerts.[1]
- Email: SendGrid transactional for invoices, quotes, digests, and review requests.[1]
- Payments: Stripe Checkout + Webhooks for one‑off and recurring invoices.[1]
- Optional compute: Railway/Render or Fly.io for a long‑running worker if a persistent queue is ever needed.[3][5]

## Component responsibilities
- PWA: Booking, schedule views, crew mobile views, payments, and owner dashboard; offline cache for day routes.[1]
- API: CRUD for customers/jobs/invoices/crews; quote/pricing helpers; event emission; idempotent webhooks.[2][1]
- Agents: Stateless functions (LangChain runtime) orchestrating SMS/email flows, quotes, scheduling, and post‑job review invites.[2][1]
- Data: Single Postgres with logical schemas (core, ops, billing), RLS per tenant, and policy‑driven access.[1]
- Integrations: Twilio receive/send, SendGrid send, Stripe checkout + invoice webhooks, Supabase auth.[1]

## Logical diagram (text)
- Client (PWA) → REST API (Deno Deploy) → Supabase (Auth/DB/Storage) → Events (Supabase Realtime) → Agents/Workers (Deno Deploy cron + functions) → Twilio/SendGrid/Stripe webhooks back into API.[2][1]

## Data model (core tables)
- customers: id, name, phone, email, address, neighborhood, property_size_sqft, notes, status, created_at.[1]
- crews: id, name, phone, role, status, pay_rate, hired_at.[1]
- jobs: id, customer_id, crew_id, service_type, date, time_window, status, notes, before_photos[], after_photos[], duration_min, rating, completed_at.[1]
- invoices: id, customer_id, job_id, amount_cents, description, issued_at, due_at, status, payment_link, paid_at.[1]
- schedules_recurring: id, customer_id, service_type, frequency, day_of_week, start_date, is_active.[1]
- events_outbox: id, type, ref_id, payload, status, attempts, next_attempt_at.[1]
- owner_prefs: id, phone, email, weekly_sms_time, weekly_email_time, alert_critical_only.[1]

Notes:
- Use Supabase RLS with policies per role (owner, crew, read‑only customer portal).[1]
- Store photos in Supabase Storage with signed URLs; frontend renders direct URLs (no image optimization layer).[4][1]

## API contracts (v1)
Base: /api/v1.[1]

- POST /leads/intake
  - req: { name, phone, email?, address, service_type, lawn_size?, notes? }[1]
  - resp: { lead_id, status: "received", next_steps: "quote_pending" }[1]

- POST /quotes/estimate
  - req: { address, service_type, lawn_size?, frequency }[1]
  - resp: { price_low_cents, price_high_cents, notes, valid_until }[1]

- POST /jobs
  - req: { customer_id, service_type, date, time_window, crew_id?, notes? }[1]
  - resp: { job_id, status: "scheduled" }[1]

- PATCH /jobs/:id/complete
  - req: { before_photos[], after_photos[], duration_min, rating?, notes? }[1]
  - resp: { invoice_id, invoice_status, review_link }[1]

- POST /invoices/:id/paylink
  - resp: { url }[1]

- POST /webhooks/twilio
  - req: Twilio payload (SMS in)[1]
  - resp: 200 OK[1]

- POST /webhooks/stripe
  - req: Stripe event (checkout.session.completed/payment_intent.succeeded)[1]
  - resp: 200 OK; idempotent handling[1]

- POST /webhooks/sendgrid
  - req: email delivered/bounced events[1]
  - resp: 200 OK[1]

- GET /owner/weekly-digest
  - resp: { revenue_week, revenue_mtd, jobs_completed, jobs_next_week, complaints, reviews_new, alerts }[1]

Versioning:
- Prefix with /api/v1 and use x-api-version header for forwards compatibility.[1]

## Event flows (key sequences)
- Lead→Quote→Schedule
  - Twilio SMS or PWA form → /leads/intake → agent quotes via /quotes/estimate → two slot options returned → /jobs create → SendGrid confirmation + Twilio reminder.[2][1]
- Job completion→Invoice→Payment
  - Crew uploads photos via PWA → /jobs/:id/complete → invoice created → Stripe checkout link → /webhooks/stripe marks paid → agent triggers review SMS.[1]
- Owner weekly digest
  - Deno cron Sunday 6pm aggregates KPIs from Supabase → SendGrid email + Twilio SMS short summary.[2][1]

## Non‑functional design
- Availability: Multi‑region edge compute via Deno Deploy; stateless functions with retries; idempotent webhooks for Stripe/Twilio.[2][1]
- Scalability: Read‑heavy via static PWA + realtime supabase; write paths isolated; outbox + retry backoff for third‑party calls.[1]
- Cost efficiency: Free/low tiers for Deno/Supabase; avoid serverful nodes unless queue saturation requires Railway/Render; no image optimization layer.[3][4][2]
- Observability: Request logging with correlation IDs; webhook receipts; error tracking via Sentry SDK; uptime via UptimeRobot.[1]

## Security & auth
- Auth: Supabase Auth (email/password + magic link) with RLS enforcing role‑bound access.[1]
- Secrets: Deno Deploy project secrets + scoped service keys for Supabase; no secrets in client.[2][1]
- Webhooks: Verify Twilio/Stripe signatures; idempotent keys per event; store last processed event id.[1]
- PII: Encrypt at rest via Postgres and storage provider; limit selection to fields needed per role; audit logs for admin actions.[1]

## Deployment topology
- Frontend: Netlify/Cloudflare Pages static deploy from main branch; cache headers tuned; offline manifest for PWA.[4][1]
- Backend: Deno Deploy per environment (dev/stage/prod) with environment‑scoped secrets and separate Supabase projects.[2][1]
- Database: Supabase free/pro projects per env; daily backups; migration scripts versioned in repo.[1]
- Worker/Cron: Deno cron for weekly/monthly digests and requeue of outbox failures.[2][1]

## CI/CD
- GitHub Actions: lint/test → build → preview deployments → promote to prod on tag; DB migration step gated with backup confirmation.[1]
- Canary: Route 5% of API traffic to canary function per release for smoke signals.[1]

## DevX & patterns
- Framework: Hono/Fresh for Deno HTTP router; typed request/response DTOs in TS; zod validation.[1]
- Patterns: Outbox + idempotent consumers; repository pattern for DB; service layer for business logic; DTO mappers at edges.[1]
- Version pinning: Lock Deno runtime version and library versions in deno.json; pin Supabase CLI version.[1]

## Cost profile (small → medium scale)
- Small (≤100 customers, 2‑3 crews): ~$30‑60/mo infra (Deno free, Supabase free, Twilio 2K SMS, SendGrid free, Stripe per‑txn only).[3][2]
- Medium (~250 customers, 4‑6 crews): $150‑200/mo infra (Deno Pro $20, Supabase Pro $25, SendGrid $15, Twilio $40, optional Railway $15).[3][2]
- Frontend hosting: $0 on Netlify/Cloudflare Pages for static PWA.[4]

## Risks & mitigations
- Webhook duplicates or drops: Idempotency keys + outbox replays with exponential backoff.[1]
- SMS deliverability: Fall back to email; throttle retries; status callbacks tracked.[1]
- Vendor limits on free tiers: Feature flags to swap DB plan; soft alarms when nearing quotas.[2][1]
- Data consistency: Unit of work per request; transactional writes; compensating actions for third‑party failures.[1]

## Minimal file‑level plan (high level)
- /frontend: Static PWA (index.html, app.ts, styles.css, manifest.json, service-worker.ts).[1]
- /api/routes: leads.ts, quotes.ts, jobs.ts, invoices.ts, owner.ts, webhooks/twilio.ts, webhooks/stripe.ts, webhooks/sendgrid.ts.[1]
- /api/services: pricing.ts, scheduling.ts, invoicing.ts, digest.ts, notifications.ts.[1]
- /api/repos: customers.repo.ts, jobs.repo.ts, invoices.repo.ts, crews.repo.ts, outbox.repo.ts.[1]
- /api/lib: supabase.ts, auth.ts, validation.ts, idempotency.ts, logger.ts.[1]
- /infra: deno.json, supabase/migrations, github/workflows/deploy.yml.[1]

## Sample endpoint snippets (pseudo‑code)
- POST /leads/intake
  - validate → write lead → enqueue outbox event("LEAD_CREATED") → return {lead_id, status}.[1]
- POST /webhooks/stripe
  - verify sig → check idempotency table → update invoice → emit("INVOICE_PAID") → 200.[1]

## Backlog phases
- Phase 1: Core CRUD (customers, jobs, invoices), SMS intake, Stripe checkout, weekly digest cron.[1]
- Phase 2: Recurring schedules, crew mobile PWA, review request automation, owner dashboard widgets.[1]
- Phase 3: Route density metrics, simple route suggestions, HOA/commercial proposal templates.[1]

## Why this stack
- Deno Deploy: global edge, free → pro tiers, no cold‑start pain typical of legacy serverless, and perfect for stateless agent functions.[2]
- Supabase: Postgres + Auth + Storage in one service, strong fit for CRUD + realtime UI without bespoke infra.[1]
- Railway/Render/Fly.io: predictable low‑cost serverful option if/when a long‑running queue is required.[5][6][3]
- Static PWA on Netlify/Cloudflare Pages: $0 hosting and no dynamic image pipeline cost.[4]

This delivers a lean, low‑ops, low‑cost, and agent‑ready architecture tailored to Xcellent 1’s size and growth path while adhering to BMAD architectural rigor.[3][4][2][1]

[1](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_de13251f-e051-47d9-95dd-1682499d6cdc/2af50348-e82c-48ac-8522-5630de2be279/team-fullstack.txt)
[2](https://deno.com/deploy/pricing?subhosting)
[3](https://getdeploying.com/railway-vs-render)
[4](https://jhakim.com/blog/vercel-vs-cloudflare-vs-flyio-pricing-performance-developer-experience)
[5](https://ritza.co/articles/gen-articles/cloud-hosting-providers/fly-io-vs-vercel/)
[6](https://uibakery.io/blog/fly-io-vs-vercel)