---
id: webapp-platform-realize
title: Xcellent1 Business Operations Webapp — Realize Spec
erc_phase: realize
linked_issue: 27
owner: travone
created: 2026-04-01
tags: [webapp, crm, crew, notifications, supabase, twilio, sendgrid, deno]
---

# Realize Spec — Xcellent1 Business Operations Webapp

**Linked Issue:** #27  
**Wiki Spec:** `wiki/webapp-platform.md`  
**Gate 1 Notes:** `wiki/hitl/empathize-webapp-platform-2026-04-01.md` ✅  
**Peer Reviewer:** Travone Butler  
**Gate 2 required before implementation:** `wiki/hitl/realize-webapp-platform-<date>.md`

---

## Architecture Decision

Build on top of the existing Deno + Fly.io + Supabase + Cloudflare stack. No new infrastructure. Event-driven architecture: Supabase DB triggers → Deno edge functions → Twilio (SMS) / SendGrid (email) / WebSocket (real-time dashboard).

```
Client Action (job complete, booking, form submit)
        │
        ▼
Supabase DB row insert/update
        │
        ▼ (Supabase Realtime + DB webhook)
Deno Edge Function (event handler)
        │
        ├──▼ Twilio — SMS to owner / crew / customer
        ├──▼ SendGrid — email to customer / owner
        └──▼ Supabase Realtime — push to owner dashboard WebSocket
```

---

## Event Map — What Triggers What

| Event | DB Table | Owner Alert | Crew Alert | Customer Alert |
|---|---|---|---|---|
| Job marked complete | `jobs` | SMS + dashboard | — | SMS + Email (completion + photo) |
| New quote request submitted | `leads` | SMS (high-score) | — | Email (confirmation) |
| New worker application | `worker_applications` | SMS | — | — |
| Job scheduled | `jobs` | — | SMS | SMS + Email (confirmation) |
| 24hrs before job | `jobs` (cron) | — | SMS reminder | SMS reminder |
| Crew en route | `jobs` | — | — | SMS (ETA) |
| Invoice overdue 7 days | `invoices` (cron) | Dashboard flag | — | Email reminder |
| Invoice overdue 14 days | `invoices` (cron) | SMS alert | — | Email escalation |
| 3 days post-completion | `jobs` (cron) | — | — | SMS review request |
| Crew red status | `performance` | SMS | SMS (self-view) | — |

---

## Supabase Schema Additions

```sql
-- New tables required

CREATE TABLE worker_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  equipment_owned JSONB,
  availability JSONB,
  service_areas TEXT[],
  status TEXT DEFAULT 'pending', -- pending | approved | rejected
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE performance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES auth.users(id),
  period_start DATE,
  period_end DATE,
  jobs_completed INT DEFAULT 0,
  jobs_on_time INT DEFAULT 0,
  quality_score DECIMAL(4,2), -- avg client rating
  status TEXT DEFAULT 'green', -- green | yellow | red
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_type TEXT, -- owner | crew | customer
  recipient_id UUID,
  channel TEXT, -- sms | email | push
  event_type TEXT,
  payload JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent' -- sent | failed | bounced
);

-- Extend existing jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completion_photo_url TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS crew_en_route_at TIMESTAMPTZ;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
```

---

## Module Shipping Order (LaCardio’s priority)

1. **Module 1 + 3** (Owner Command Center + Crew Self-Service) — addresses immediate crew management pain
2. **Module 2** (Customer Portal) — automated comms + booking
3. **Module 4** (Lead + Hire Intelligence) — ships with gig platform feature (#28)

---

## Acceptance Criteria (Gate 2 — all must pass before implementation)

- [ ] HITL Gate 2 meeting notes filed: `wiki/hitl/realize-webapp-platform-<date>.md`
- [ ] Event map reviewed and approved by LaCardio
- [ ] Supabase schema additions reviewed — no conflicts with existing schema
- [ ] Twilio account confirmed active with valid credentials in `.env`
- [ ] SendGrid account confirmed active with valid credentials in `.env`
- [ ] Supabase Realtime confirmed enabled on `jobs` and `leads` tables
- [ ] All 10 event types have a corresponding Deno edge function stub created
- [ ] Tests defined for each event type before implementation begins

## Tests

Path: `tests/notifications/` and `tests/dashboard/`

```typescript
// tests/notifications/job-complete.test.ts
// Test: job marked complete → owner receives SMS within 60s
// Test: job marked complete → customer receives SMS + email with photo
// Test: no duplicate notifications for same job_id

// tests/notifications/lead-alert.test.ts  
// Test: new lead with score > 70 → owner SMS within 60s
// Test: new lead with score < 70 → no owner SMS (queued for daily digest)

// tests/dashboard/realtime.test.ts
// Test: job status update → owner dashboard reflects change within 3s
// Test: WebSocket connection survives 60s idle

// tests/crew/performance.test.ts
// Test: worker with <80% on-time over 30 days → status = red
// Test: red status → owner SMS alert triggered
// Test: crew self-view returns correct status for authenticated worker
```

---

## Effort Estimate

| Module | Owner | Est. Time |
|---|---|---|
| Supabase schema additions | IDE Agent | 1 hr |
| Deno edge function stubs (10 events) | IDE Agent | 2 hrs |
| Twilio/SendGrid wiring per event | IDE Agent | 4 hrs |
| Owner dashboard real-time updates | IDE Agent | 3 hrs |
| Crew self-service performance view | IDE Agent | 2 hrs |
| Customer comms sequence | IDE Agent | 2 hrs |
| Tests | IDE Agent | 2 hrs |

**Total: ~16 hrs agent work across 2-3 sessions post Gate 2 approval**
