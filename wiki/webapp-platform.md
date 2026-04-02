---
id: webapp-platform
title: Xcellent1 Business Operations Webapp
erc_phase: realize
erc_score: 75
owner: travone
created: 2026-04-01
last_updated: 2026-04-02
tags: [webapp, crm, crew, operations, alerts, customer-comms, hiring, training, river-parishes]
---

# Feature: Xcellent1 Business Operations Webapp

## Problem Statement

Lacardio currently runs his River Parish lawn care operation through manual communication with no centralized dashboard, no automated customer notifications, no crew training system, and no proactive lead or hire alerts. The existing owner and crew dashboards (Phases 1–3) are functional but reactive — Lacardio must manually check rather than being pushed actionable signals. As a solo operator scaling into multi-crew, every manual process is a revenue ceiling.

## Pain Data

- Owner stated: "I get notified immediately and I maybe check the job out that day" — mental model is push, not pull (issue #24)
- Crew performance is invisible to crew members — owner must manually communicate accountability (issue #23)
- No automated customer comms: no booking confirmations, no job-start notifications, no completion photos pushed to clients, no review requests
- No hiring pipeline — no system to identify or convert potential 1099 workers
- No inbound lead alert — new quote requests require manual dashboard checks
- No in-app training system — Lacardio has no structured path to earn new service licenses (LDAF pesticide, LA irrigation, arborist)
- ServiceTitan and LawnPro both solve this at enterprise scale for $200–400/mo SaaS; Xcellent1 builds it natively in existing stack (Deno + Fly.io + Supabase + Cloudflare)

## Root Cause

Phases 1–3 built the data layer (clients, jobs, invoices, payments, photos). Phases 4–5 add the intelligence layer — event-driven triggers, push notifications, and the training/licensure system that allows Lacardio to expand his service scope over time. SendGrid and Twilio are already in `requirements.txt` but wired to no trigger events.

---

## Module Specifications

### Module 1 — Owner Command Center

**ERC Phase:** Realize | **Priority:** P0

**What it does:** Gives Lacardio a single real-time view of all jobs, crew, revenue, and alerts — push-first, not pull.

**Features:**
- Real-time job status board: pending → in-progress → complete, with crew assignment
- Push alerts (in-app + SMS via Twilio): job complete, new lead submitted, new hire applicant, client issue flagged
- Revenue dashboard: daily / weekly / monthly totals, by service type
- One-tap crew message from job card
- Weather alert integration: flag days with >50% rain probability for River Parishes (use National Weather Service API — free)

**Acceptance Criteria:**
- [ ] Job status updates in <5 seconds of crew action
- [ ] Push alert delivered to owner within 30 seconds of trigger event
- [ ] Revenue metrics accurate to current Supabase `invoices` and `payments` tables
- [ ] Weather alert surfaces on dashboard by 6 AM day-of
- [ ] All alerts navigable from mobile at 375px viewport

**References:** `web/static/owner.html`, `api-endpoints.ts /api/owner/*`, `db/schema.sql` (jobs, invoices, payments tables)

---

### Module 2 — Customer Portal

**ERC Phase:** Realize | **Priority:** P0

**What it does:** Automates the full client communication lifecycle so Lacardio never has to manually send a status update.

**Features:**
- Booking / quote request form with service type selector
- Job status tracking: shows assigned crew, ETA (manual entry by crew), completion status
- Invoice history + Stripe payment portal (existing Stripe integration)
- Automated communication sequence:
  1. Booking confirmed → email + SMS
  2. Day-before reminder → SMS
  3. Crew en route → SMS
  4. Job complete → SMS + completion photo
  5. 24hr post-completion → review request SMS (Google or Facebook link)

**Acceptance Criteria:**
- [ ] All 5 automated messages fire on correct trigger without manual action
- [ ] Client can view invoice and pay from mobile in <3 taps
- [ ] Completion photo visible to client within 2 minutes of crew upload
- [ ] Review request includes direct link (not homepage)
- [ ] All flows tested at 375px viewport

**References:** `web/static/client.html`, `api-endpoints.ts /api/client/*`, `email-service.ts`, `requirements.txt` (SendGrid, Twilio)

---

### Module 3 — Crew Self-Service

**ERC Phase:** Realize | **Priority:** P0

**What it does:** Gives Lacardio (and future crew) everything needed to execute a day's work from a phone — route, job details, checklists, photo upload, clock in/out.

**Features:**
- Today's jobs in optimized route order (River Parishes corridor: LaPlace → Reserve → Lutcher → Gramercy → Destrehan)
- Per-job detail: client name, address, service type, notes, gate code
- SOP checklist per service type (linked to `staff/lacardio/SOPs_ERC_v1.1.md` — each SOP becomes an interactive checklist)
- Before/after photo upload per job (existing Supabase Storage bucket)
- Clock in / clock out per job (logs to `jobs` table)
- Performance self-view: green (on-time, photos complete) / yellow (late or missing photo) / red (no-show or complaint) — issue #23

**Acceptance Criteria:**
- [ ] Crew can complete full job flow (start → checklist → photos → complete) in <5 taps
- [ ] SOP checklist displays correct steps for each service type
- [ ] Photos upload successfully on iOS Safari and Android Chrome at low bandwidth
- [ ] Clock in/out timestamps accurate to within 60 seconds
- [ ] Performance indicator visible on crew home screen
- [ ] All UI functional at 375px, buttons thumb-reachable

**References:** `web/static/crew.html`, `api-endpoints.ts /api/crew/*`, `staff/lacardio/SOPs_ERC_v1.1.md`, `db/schema.sql` (jobs, photos tables)

---

### Module 4 — Hire + Lead Intelligence

**ERC Phase:** Realize | **Priority:** P1

**What it does:** Surfaces high-value leads and hire applicants to Lacardio instantly, with scoring so he prioritizes the right follow-ups.

**Features:**
- Inbound quote request scoring: lot size + service type + zip code proximity to LaPlace = lead score 1–10
- Push alert when lead score ≥7
- Worker application form (1099 contractor interest form on site)
- Push alert when new worker application submitted
- Lead and applicant queue in owner dashboard with one-tap contact

**Acceptance Criteria:**
- [ ] Lead score calculated on form submission, stored in `clients` or `leads` table
- [ ] High-value lead alert delivered to owner within 60 seconds
- [ ] Worker application stored and surfaced in owner dashboard
- [ ] Alert not triggered for leads scoring <7 (noise reduction)

**References:** `web/static/owner.html`, issue #21 (autoresearch loop), `api-endpoints.ts /api/owner/*`

---

### Module 5 — In-App Training & Licensure System

**ERC Phase:** Empathize | **Priority:** P1

**What it does:** Provides Lacardio a structured, in-app path to study for and earn new Louisiana service licenses, unlocking additional service modules in the app as he passes each exam.

**Features:**
- Training module library: one module per locked SOP (TM-01 through TM-05)
- Each module contains: study content, practice quiz, progress tracker, exam registration link
- License status field per crew member in Supabase (`crew_licenses` table)
- Service type unlock: when license status = `active`, corresponding SOP checklist and service types become available in crew view
- Locked services visually indicated in crew and owner dashboards with "Earn License" CTA

**Training Modules (locked pending license):**

| Module | Service Unlocked | License | Louisiana Issuing Body |
|---|---|---|---|
| TM-01 | Pesticide/Herbicide Application | Commercial Pesticide Applicator | LDAF |
| TM-02 | Irrigation Install & Repair | Irrigation Contractor | LA State Plumbing Board |
| TM-03 | Commercial Fertilizer Application | Restricted-Use Applicator | LDAF |
| TM-04 | Tree Removal & Climbing | Licensed Horticulturist / Arborist | LA Horticulture Commission |
| TM-05 | Drainage/Grading (major) | Contractor License | LSLBC |

**Acceptance Criteria (to move to REALIZE):**
- [ ] `crew_licenses` schema designed and approved
- [ ] Training content outline written for TM-01 (LDAF pesticide) as pilot
- [ ] License unlock logic spec written (what field, what check, what UI state changes)
- [ ] Lacardio reviews and approves module structure

**References:** `staff/lacardio/SOPs_ERC_v1.1.md` (Training Modules section), `db/schema.sql`

---

## Event-Driven Architecture Spec

All notifications flow through a central event bus. Every trigger event maps to one or more notification actions.

| Event | Trigger | Channels | Recipients |
|---|---|---|---|
| `job.completed` | Crew marks job complete | SMS + in-app | Owner + Client |
| `job.started` | Crew clocks in on job | SMS | Client |
| `job.photo_uploaded` | Photo saved to Storage | in-app | Owner |
| `quote.submitted` | Client submits quote form | SMS + in-app | Owner |
| `quote.scored_high` | Lead score ≥7 | SMS + push | Owner |
| `invoice.paid` | Stripe webhook `payment_intent.succeeded` | Email | Client |
| `invoice.overdue` | 7 days past due date | SMS | Client |
| `job.reminder` | 24hr before scheduled job | SMS | Client |
| `job.review_request` | 24hr after `job.completed` | SMS | Client |
| `worker.applied` | Worker application form submitted | SMS + in-app | Owner |

**Implementation:** Supabase Database Webhooks → Deno edge function → Twilio (SMS) / SendGrid (email) / Supabase Realtime (in-app)

---

## Tech Stack Constraints

All modules must be implemented within the existing stack. No new SaaS dependencies without Travone approval.

| Layer | Technology | Notes |
|---|---|---|
| Server | Deno + TypeScript | `server.ts` — existing |
| Database | Supabase PostgreSQL | RLS enforced on all new tables |
| Auth | Supabase Auth + JWT | Existing role model: owner / crew / client |
| Storage | Supabase Storage | `job-photos` bucket — existing |
| SMS | Twilio | In `requirements.txt`, not yet wired |
| Email | SendGrid | In `requirements.txt`, not yet wired |
| Hosting | Fly.io | `fly.toml` — existing |
| CDN/Edge | Cloudflare | `wrangler.toml` — existing |
| Frontend | Static HTML + vanilla JS | Mobile-first, 375px minimum |

---

## ERC Gate Status

| Module | ERC Phase | Gate Score | Blocker |
|---|---|---|---|
| M1 — Owner Command Center | Realize | 75/100 | Event architecture needs Twilio wiring spec |
| M2 — Customer Portal | Realize | 75/100 | Comms sequence needs channel decision (SMS vs email per step) |
| M3 — Crew Self-Service | Realize | 75/100 | SOP checklist data model needs spec |
| M4 — Lead Intelligence | Realize | 65/100 | Lead scoring formula needs owner input |
| M5 — Training System | Empathize | — | Schema and content outline needed |

**Next gate action:** All M1–M4 blockers resolved → score to ≥90 → Conceptualize sign-off → implementation begins.

---

## Peer Review

- Spec author: @travone
- Peer reviewer: @travone (architecture sign-off required before Conceptualize)
- Business owner review: required for M2 (customer comms copy) and M5 (training module content)

---

## References

- `web/static/crew.html`, `web/static/owner.html`, `web/static/client.html`
- `api-endpoints.ts` — all existing REST endpoints
- `email-service.ts` — existing SendGrid wiring
- `db/schema.sql` — full PostgreSQL schema
- `staff/lacardio/SOPs_ERC_v1.1.md` — field SOPs feeding Module 3 and Module 5
- `wiki/erc-flow.md` — gate scoring rubric
- Issue #21 (lead intelligence), Issue #23 (crew performance), Issue #24 (push notifications)
- ServiceTitan feature reference: https://www.servicetitan.com/industries/lawn-care-software
