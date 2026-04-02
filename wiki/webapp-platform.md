---
id: webapp-platform
title: Xcellent1 Business Operations Webapp
erc_phase: conceptualize
erc_score: 95
owner: travone
created: 2026-04-01
last_updated: 2026-04-02
signoff: true
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
- ServiceTitan and LawnPro solve this at enterprise for $200–400/mo SaaS; Xcellent1 builds it natively

## Root Cause

Phases 1–3 built the data layer. Phases 4–5 add the intelligence layer — event-driven triggers, push notifications, and the training/licensure system. `outbox_events` table already exists in `db/schema.sql`. SendGrid and Twilio are in `requirements.txt` but wired to no trigger events.

---

## Architecture Decision

### Pattern: Outbox Event Bus → Deno Worker → Notification Dispatch

The `outbox_events` table in `db/schema.sql` is the backbone. Every state-changing action in the system inserts a row into `outbox_events`. A Deno worker polls `outbox_events` for `status = 'pending'` rows, dispatches to Twilio (SMS), SendGrid (email), or Supabase Realtime (in-app), then marks `status = 'processed'`.

This pattern:
- Requires **zero new infrastructure** — Fly.io, Supabase, and Deno are all already deployed
- Is idempotent and retryable (failed events stay in `pending`, worker retries)
- Is auditable — every notification has a permanent record
- Avoids Supabase webhook complexity for MVP

### New Database Objects Required

```sql
-- 1. Add clock_in / clock_out to jobs table
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS clocked_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clocked_out_at TIMESTAMPTZ;

-- 2. SOP checklist items per job (M3)
CREATE TABLE IF NOT EXISTS job_checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sop_id TEXT NOT NULL,          -- e.g. 'SOP-003' matches staff/lacardio/SOPs_ERC_v1.1.md
  item_text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_checklist_job ON job_checklist_items(job_id);

-- 3. Lead scoring on clients table
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS lead_score INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lead_source TEXT,
  ADD COLUMN IF NOT EXISTS lot_size_sqft INT,
  ADD COLUMN IF NOT EXISTS parish TEXT;         -- St. John / St. Charles / St. James

-- 4. Notification log
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outbox_event_id UUID REFERENCES outbox_events(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'in_app')),
  recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_phone TEXT,
  recipient_email TEXT,
  message_body TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'delivered')),
  provider_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_log_event ON notification_log(outbox_event_id);
CREATE INDEX IF NOT EXISTS idx_notif_log_recipient ON notification_log(recipient_id);

-- 5. crew_licenses table (Module 5 — empathize, schema here for reference)
CREATE TABLE IF NOT EXISTS crew_licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_type TEXT NOT NULL,    -- 'pesticide_applicator' | 'irrigation' | 'fertilizer' | 'arborist' | 'contractor'
  issuing_body TEXT NOT NULL,    -- 'LDAF' | 'LA_Plumbing_Board' | 'LA_Horticulture_Commission' | 'LSLBC'
  license_number TEXT,
  issued_date DATE,
  expiry_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'suspended')),
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crew_licenses_crew ON crew_licenses(crew_id);
CREATE INDEX IF NOT EXISTS idx_crew_licenses_status ON crew_licenses(status);
ALTER TABLE crew_licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage licenses" ON crew_licenses FOR ALL USING (auth.user_role() = 'owner');
CREATE POLICY "Crew can view own licenses" ON crew_licenses FOR SELECT
  USING (crew_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));
```

### New Files To Create

| File | Purpose |
|---|---|
| `src/workers/notification-worker.ts` | Deno cron worker — polls `outbox_events`, dispatches SMS/email/in-app |
| `src/services/twilio.ts` | Twilio SMS client wrapper |
| `src/services/sendgrid.ts` | SendGrid email client wrapper (extend `email-service.ts`) |
| `src/services/weather.ts` | NWS API client — River Parishes forecast |
| `src/lib/event-bus.ts` | Helper: `emitEvent(type, ref_id, payload)` — inserts to `outbox_events` |
| `src/lib/lead-scorer.ts` | Lead scoring formula — lot size + service type + parish proximity |
| `src/lib/sop-checklists.ts` | Static SOP checklist data keyed by service type — source of truth for M3 |
| `db/migrations/001_phase4_additions.sql` | All schema additions above as a single migration |
| `web/static/partials/checklist.html` | Crew job checklist UI component |
| `web/static/partials/performance-badge.html` | Green/yellow/red crew performance indicator |

### Files To Modify

| File | Change |
|---|---|
| `server.ts` | Wire `emitEvent()` calls on job status changes, quote submissions, photo uploads, Stripe webhook |
| `web/static/owner.html` | Add real-time job board via Supabase Realtime subscription; weather widget; alert feed |
| `web/static/crew.html` | Add SOP checklist per job, clock in/out buttons, performance badge, route order |
| `web/static/client.html` | Add job status tracker, ETA display, review request CTA |
| `fly.toml` | Add cron process entry for `notification-worker.ts` |

---

## Ordered Implementation Plan

### Step 1 — Database Migration
**File:** `db/migrations/001_phase4_additions.sql`  
**What:** Run the 5 schema additions above in Supabase SQL Editor.  
**Depends on:** Nothing — runs against existing schema.  
**Effort:** 30 min

### Step 2 — Event Bus Library
**File:** `src/lib/event-bus.ts`  
**What:** Export `emitEvent(eventType: string, refId: string, payload: object)` — single Supabase insert to `outbox_events`. All event emission in the codebase goes through this function.  
**Effort:** 1 hr

### Step 3 — Twilio + SendGrid Wrappers
**Files:** `src/services/twilio.ts`, `src/services/sendgrid.ts`  
**What:** Thin typed wrappers around Twilio REST API and SendGrid API. `sendSMS(to: string, body: string)` and `sendEmail(to: string, subject: string, html: string)`.  
**Env vars needed:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `SENDGRID_API_KEY`  
**Effort:** 2 hr

### Step 4 — Notification Worker
**File:** `src/workers/notification-worker.ts`  
**What:** Deno cron (every 30 seconds). Query `outbox_events WHERE status = 'pending' LIMIT 10`. For each event, match `event_type` to dispatch logic, call Twilio/SendGrid/Supabase Realtime, insert to `notification_log`, mark `outbox_events.status = 'processed'`. On failure: mark `status = 'failed'`, log error.  
**Event dispatch map:**

```
job.completed      → SMS(owner) + SMS(client) + in_app(owner)
job.started        → SMS(client)
job.photo_uploaded → in_app(owner)
quote.submitted    → SMS(owner) + in_app(owner)
quote.scored_high  → SMS(owner)
invoice.paid       → email(client)
invoice.overdue    → SMS(client)
job.reminder       → SMS(client)
job.review_request → SMS(client)
worker.applied     → SMS(owner) + in_app(owner)
```

**Effort:** 4 hr

### Step 5 — Wire emitEvent() into server.ts
**File:** `server.ts`  
**What:** Add `emitEvent()` calls at these 7 locations:
1. `POST /api/crew/jobs/:id/complete` → emit `job.completed`
2. `POST /api/crew/jobs/:id/start` (clock-in) → emit `job.started`
3. `POST /api/crew/jobs/:id/photos` → emit `job.photo_uploaded`
4. `POST /api/client/quotes` → emit `quote.submitted`, run lead scorer, conditionally emit `quote.scored_high`
5. Stripe webhook `payment_intent.succeeded` → emit `invoice.paid`
6. Daily cron check: invoices 7+ days overdue → emit `invoice.overdue`
7. Daily cron check: jobs scheduled tomorrow → emit `job.reminder`

**Review request:** Schedule `job.review_request` 24hr after `job.completed` via `outbox_events` with `process_after` timestamp field.  
**Effort:** 3 hr

### Step 6 — Lead Scorer
**File:** `src/lib/lead-scorer.ts`  
**What:** `scoreLeadFn(lotSizeSqft, serviceType, parish): number (1–10)`.  
**Scoring logic:**
- Lot size ≥10k sqft: +3
- Service type = sod/planting/mulch (high margin): +3
- Parish = St. John or St. Charles (core corridor): +2
- Recurring plan requested: +2  

**Effort:** 1 hr

### Step 7 — SOP Checklist Data + Crew UI
**Files:** `src/lib/sop-checklists.ts`, `web/static/crew.html`, `web/static/partials/checklist.html`  
**What:** Static map of `serviceType → checklist[]` sourced from `staff/lacardio/SOPs_ERC_v1.1.md`. API endpoint `POST /api/crew/jobs/:id/checklist` saves completion state to `job_checklist_items`. Crew UI renders checklist per job, clock-in/out buttons, performance badge.  
**Performance badge logic:** green = clocked in on time + all checklist items + photo uploaded; yellow = missing 1 item; red = no clock-in or no photo after completed status.  
**Effort:** 4 hr

### Step 8 — Owner Dashboard Real-Time + Weather
**Files:** `web/static/owner.html`, `src/services/weather.ts`  
**What:** Supabase Realtime subscription on `jobs` table — job card updates live without page refresh. Weather widget calls NWS `https://api.weather.gov/gridpoints/LIX/{x},{y}/forecast` (LIX = New Orleans/Baton Rouge office covers River Parishes — free, no API key).  
**Effort:** 3 hr

### Step 9 — Client Portal Comms
**File:** `web/static/client.html`  
**What:** Job status tracker (assigned → in progress → complete), ETA field display, completion photo visible post-job, review request CTA 24hr after completion.  
**Effort:** 2 hr

### Step 10 — Fly.io Worker Process
**File:** `fly.toml`  
**What:** Add `[processes]` block for `notification-worker` so it runs alongside the web server as a separate Fly process. Free tier: 2 shared-cpu-1x VMs — web + worker fits within free allowance.  
**Effort:** 30 min

---

## Total Effort Estimate

| Step | File(s) | Effort |
|---|---|---|
| 1 — DB Migration | `db/migrations/001_phase4_additions.sql` | 30 min |
| 2 — Event Bus | `src/lib/event-bus.ts` | 1 hr |
| 3 — Twilio/SendGrid | `src/services/twilio.ts`, `sendgrid.ts` | 2 hr |
| 4 — Notification Worker | `src/workers/notification-worker.ts` | 4 hr |
| 5 — Wire server.ts | `server.ts` | 3 hr |
| 6 — Lead Scorer | `src/lib/lead-scorer.ts` | 1 hr |
| 7 — Checklist UI | `sop-checklists.ts`, `crew.html`, partials | 4 hr |
| 8 — Owner RT + Weather | `owner.html`, `weather.ts` | 3 hr |
| 9 — Client Portal | `client.html` | 2 hr |
| 10 — Fly Worker | `fly.toml` | 30 min |
| **Total** | | **~21 hr** |

---

## Module Specifications

### Module 1 — Owner Command Center
**ERC Phase:** Conceptualize | **Priority:** P0

**Acceptance Criteria:**
- [ ] Job status updates in <5 seconds of crew action (Supabase Realtime)
- [ ] Push alert delivered to owner within 30 seconds of trigger event
- [ ] Revenue metrics accurate to `invoices` and `payments` tables
- [ ] Weather alert surfaces on dashboard by 6 AM day-of (NWS API, River Parishes grid)
- [ ] All alerts navigable from mobile at 375px viewport

**Files:** `web/static/owner.html`, `src/services/weather.ts`, Steps 5+8

---

### Module 2 — Customer Portal
**ERC Phase:** Conceptualize | **Priority:** P0

**Communication Sequence (channel decisions resolved):**

| Step | Trigger | Channel | Notes |
|---|---|---|---|
| 1 | Booking confirmed | Email + SMS | Email = receipt; SMS = quick confirm |
| 2 | Day-before reminder | SMS only | High open rate; no email needed |
| 3 | Crew en route | SMS only | Time-sensitive |
| 4 | Job complete | SMS + photo link | Link to client portal photo view |
| 5 | 24hr post-job | SMS only | Google review link for River Parishes GMB |

**Acceptance Criteria:**
- [ ] All 5 messages fire on correct trigger without manual action
- [ ] Client can view invoice and pay from mobile in <3 taps
- [ ] Completion photo visible to client within 2 minutes of crew upload
- [ ] Review request includes direct Google Maps / Facebook link
- [ ] All flows at 375px viewport

**Files:** `web/static/client.html`, `email-service.ts`, `src/services/twilio.ts`, Steps 5+9

---

### Module 3 — Crew Self-Service
**ERC Phase:** Conceptualize | **Priority:** P0

**SOP Checklist Data Model:**
```typescript
// src/lib/sop-checklists.ts
type ChecklistItem = { id: string; text: string; sort_order: number };
type SOPChecklist = { sop_id: string; service_type: string; items: ChecklistItem[] };

// Keyed by services[] values from jobs table
const CHECKLISTS: Record<string, SOPChecklist> = {
  'Mowing':   { sop_id: 'SOP-003', ... },
  'Edging':   { sop_id: 'SOP-004', ... },
  'Trimming': { sop_id: 'SOP-005', ... },
  'Blowing':  { sop_id: 'SOP-006', ... },
  'Mulch':    { sop_id: 'SOP-007', ... },
  'Planting': { sop_id: 'SOP-008', ... },
  'Sod':      { sop_id: 'SOP-009', ... },
  'Cleanup':  { sop_id: 'SOP-010', ... },
};
```
Checklist items are seeded from `staff/lacardio/SOPs_ERC_v1.1.md` — each SOP checklist section maps 1:1.

**Acceptance Criteria:**
- [ ] Crew completes full job flow in <5 taps
- [ ] Correct SOP checklist auto-loads for each service type on job card
- [ ] Photos upload on iOS Safari + Android Chrome at low bandwidth (progressive upload, <5MB limit per photo)
- [ ] Clock in/out timestamps logged to `jobs.clocked_in_at` / `clocked_out_at`
- [ ] Performance badge visible on crew home screen
- [ ] All UI at 375px, buttons thumb-reachable

**Files:** `src/lib/sop-checklists.ts`, `web/static/crew.html`, `web/static/partials/checklist.html`, Steps 7

---

### Module 4 — Hire + Lead Intelligence
**ERC Phase:** Conceptualize | **Priority:** P1

**Lead Scoring Formula (owner-reviewed):**

| Signal | Points |
|---|---|
| Lot size ≥10k sqft | +3 |
| Service = sod / planting / mulch (high margin) | +3 |
| Parish = St. John or St. Charles (core corridor) | +2 |
| Recurring plan requested | +2 |
| **Max score** | **10** |

Alert threshold: score ≥7 → `quote.scored_high` event → SMS to owner.

**Acceptance Criteria:**
- [ ] Lead score calculated on quote submission, stored in `clients.lead_score`
- [ ] SMS alert to owner within 60 seconds for score ≥7
- [ ] Worker applications surfaced in owner dashboard with one-tap call/text
- [ ] No alert for score <7

**Files:** `src/lib/lead-scorer.ts`, `web/static/owner.html`, Steps 5+6

---

### Module 5 — In-App Training & Licensure System
**ERC Phase:** Empathize → moving to Realize next sprint

**Schema:** `crew_licenses` table defined above (included in `db/migrations/001_phase4_additions.sql`).

**Blocked on:** Training content outline for TM-01 (LDAF Pesticide Applicator) — next deliverable after M1–M4 ship.

---

## ERC Gate Status

| Module | ERC Phase | Score | Status |
|---|---|---|---|
| M1 — Owner Command Center | Conceptualize | 95/100 | ✅ Ready to build |
| M2 — Customer Portal | Conceptualize | 95/100 | ✅ Ready to build |
| M3 — Crew Self-Service | Conceptualize | 95/100 | ✅ Ready to build |
| M4 — Lead Intelligence | Conceptualize | 90/100 | ✅ Ready to build |
| M5 — Training System | Empathize | — | ⏳ Next sprint |

**Sign-off:** @travone — 2026-04-02 ✅

---

## Environment Variables Required

```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=          # Twilio purchased number
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=         # Verified sender
NWS_GRID_X=                  # River Parishes NWS grid X (LIX office)
NWS_GRID_Y=                  # River Parishes NWS grid Y
```

Add to `.env.example` and Fly.io secrets (`fly secrets set KEY=VALUE`).

---

## IDE Agent Prompt (Copy-Paste Ready)

```
You are implementing Phase 4 of the Xcellent1 Lawn Care platform.
Repository: github.com/Thelastlineofcode/Xcellent1-Lawn-Care
Spec: wiki/webapp-platform.md (erc:conceptualize, score 95, signed off)
Database schema: db/schema.sql
Field SOPs: staff/lacardio/SOPs_ERC_v1.1.md

Implement in this exact order:
1. db/migrations/001_phase4_additions.sql — run schema additions
2. src/lib/event-bus.ts — emitEvent() helper
3. src/services/twilio.ts — SMS wrapper
4. src/services/sendgrid.ts — email wrapper (extend email-service.ts)
5. src/workers/notification-worker.ts — outbox poll + dispatch
6. server.ts — wire emitEvent() at 7 trigger points (see Step 5 in spec)
7. src/lib/lead-scorer.ts — scoring formula
8. src/lib/sop-checklists.ts — checklist data from SOPs_ERC_v1.1.md
9. web/static/crew.html — checklist UI, clock in/out, performance badge
10. web/static/owner.html — Supabase Realtime job board, weather widget
11. web/static/client.html — job status tracker, review CTA
12. fly.toml — add notification-worker process

Constraints:
- Deno + TypeScript only. No new npm packages without approval.
- All new DB tables need RLS policies matching the pattern in db/schema.sql.
- Mobile-first: all UI must work at 375px. Buttons must be thumb-reachable.
- Notification worker: poll every 30s, process 10 events per cycle, mark failed on error.
- Weather API: NWS free tier, endpoint https://api.weather.gov/gridpoints/LIX/{x},{y}/forecast
- Do not modify existing RLS policies — only add new ones.
- Do not touch Stripe integration — it is already wired.
```

---

## References

- `db/schema.sql` — full schema (outbox_events already exists)
- `web/static/crew.html`, `owner.html`, `client.html` — existing dashboards
- `api-endpoints.ts` — all existing REST endpoints
- `email-service.ts` — existing SendGrid stub
- `staff/lacardio/SOPs_ERC_v1.1.md` — SOP checklists source
- `wiki/erc-flow.md` — gate scoring rubric
- Issue #21 (lead intelligence), #23 (crew performance), #24 (push notifications)
