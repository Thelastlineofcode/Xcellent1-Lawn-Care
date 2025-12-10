# Xcellent1 Lawn Care - Product Requirements Document

**Author:** The Last Line of Code
**Date:** 2025-12-09
**Version:** 1.0

---

## Executive Summary

Xcellent1 is a one-stop shop web app for small lawn care businesses: it enables owners (your cousin) to manage customers, bookings, invoices and payments, while managers and crew use a mobile-first interface to view jobs, upload photos, and mark work complete. The product focuses on fast booking, simple mobile workflows for crew, and an owner dashboard with revenue and operational analytics.

### What Makes This Special

Practical, focused toolchain for a lawn care business combining easy waitlist/booking, mobile-first crew workflows (photo evidence + job completion), and a lightweight owner dashboard that automates recurring admin tasks so small teams can scale without heavy overhead.

---

## Project Classification

**Technical Type:** Web + Deno backend (Supabase)
**Domain:** Local services (lawn care)
**Complexity:** Medium (brownfield enhancements to an existing codebase)

Existing artifacts (used as input): `docs/epics.md`, `docs/STORIES.md`, `docs/xcellent1-custom-webapp-spec.md`.

---

## Success Criteria

- 100 weekly active customers (or 100 weekly lead interactions) within 3 months of local launch
- 95% on-time service completion rate for scheduled jobs
- Reduce owner manual admin time by 50% within 3 months (invoicing, scheduling)

These metrics can be refined with owner input but provide concrete targets for MVP validation.

---

## Product Scope

### MVP - Minimum Viable Product

- Supabase backend with core schema and Row Level Security for owners/crew
- Landing page with waitlist/booking form and contact capture
- Crew mobile interface (job list, job details, photo upload, mark complete)
- Basic Owner dashboard: daily/weekly revenue, completed jobs, pending invoices
- Simple invoicing + Stripe Checkout integration for payments

### Growth Features (Post-MVP)

- Advanced scheduling and recurring jobs
- SMS/email notifications (Twilio/SendGrid) and owner weekly summary
- Offline support for crew (service worker / local cache)
- Enhanced analytics and export (CSV/PDF)

### Vision (Future)

Turn Xcellent1 into a lightweight local-operations platform that can be configured for multiple small service businesses (plumbers, cleaners) with plug-in modules for payments, hiring, and analytics.

---

## Domain-Specific Requirements

- Data privacy: customer contact details should be stored securely (Supabase auth + RLS)
- Payment compliance: Stripe Checkout recommended for PCI compliance
- Local regulatory: capture address and service area; validate service availability by geocode

---

## Functional Requirements (High-level)
1. User Management (FR-001)
   - Owner and manager accounts
   - Crew accounts with limited permissions
   - Authentication via Supabase

_Acceptance Criteria (FR-001)_

- Owners, managers, and crew roles defined with role-based access control in Supabase RLS.
- Account creation, login, password reset, and email verification implemented.
- Permissions prevent crew from viewing owner-only data.

2. Landing Page & Waitlist (FR-002)
   - Mobile-responsive landing page
   - Waitlist form storing leads in Supabase
   - Email confirmation for signups

_Acceptance Criteria (FR-002)_

- Landing page captures name, email, phone, address, service requested, and preferred date (optional).
- Frontend validates required fields and shows inline errors for missing data.
- Backend `/api/waitlist` accepts submissions and returns 201 with an id; owner outbox event queued.

3. Job Management & Scheduling (FR-003)
   - Create job entries (customer, address, service type, date/time)
   - Assign job to crew
   - Crew can view assigned jobs on mobile

_Acceptance Criteria (FR-003)_

- Jobs can be created/updated via API with customer, address, service type, and date/time.
- Jobs can be assigned to crew members and updated with status (scheduled, in-progress, completed).
- Scheduling conflicts flagged, and time slot management API available.

4. Crew Mobile Workflow (FR-004)
   - Job list with details
   - Mark job as in-progress / complete
   - Upload photos tied to job records (Supabase Storage)

_Acceptance Criteria (FR-004)_

- Crew can see assigned jobs, mark them in-progress/complete, and upload photos tied to the job record.
- Photo uploads stored in Supabase Storage and linked to job records.
- Offline queued uploads synchronize when online.

5. Invoicing & Payments (FR-005)
   - Generate simple invoice on job completion
   - Stripe Checkout links sent to customers
   - Webhook for payment confirmation to update invoice status

_Acceptance Criteria (FR-005)_

- Invoices auto-generated after job completion with job details and photos.
- Stripe Checkout links created and sent; webhook updates invoice status to paid when completed.
- Owner dashboard shows real-time revenue and invoice status updates.

6. Owner Dashboard (FR-006)
   - Revenue summary, jobs completed, crew performance
   - Pending invoices and quick actions (send reminder, mark paid)

_Acceptance Criteria (FR-006)_

- Dashboard displays revenue metrics, completed jobs, crew performance metrics, and pending invoices with filtering.
- Data exports (CSV) available for revenue reports.
- Realtime updates via Supabase real-time (if enabled).

7. Notifications (FR-007)
   _Acceptance Criteria (FR-007)_

   - Waitlist and booking confirmation emails sent to customers (SendGrid/Resend). SMS via Twilio (optional) send on opt-in.
   - Owner receives notifications for waitlist signup and important events via email/SMS.
   - Notification templates are branded and traceable.
   - Email confirmations, owner notifications for waitlist and payments

8. Deploy & Operations
   - Deployable to Fly.io
   - Health checks and simple logging

Each functional requirement must include clear acceptance criteria in epic/story breakdowns.

---

## Non-Functional Requirements

- Performance: Page load < 2s for landing page on mobile (3G simulated) where feasible
- Security: Use Supabase auth and Row Level Security to isolate owner data
- Availability: Basic recovery and backup strategy for Supabase data
- Accessibility: Forms accessible on mobile screens

If particular NFRs become critical (scale, regulatory), add targeted design and test coverage.

---

## Implementation Planning

### Epic Breakdown Required

Requirements must be decomposed into epics and stories. Recommended next step: run `workflow create-epics-and-stories` to produce `docs/epics/` and `docs/stories/` files and generate `docs/sprint-status.yaml`.

### Recommended Initial Epics (from `docs/epics.md`)
- Foundation: Supabase schema, auth, RLS, basic endpoints
- Customer Acquisition: Landing page and waitlist form
- Crew Mobile Dashboard: job list, photo uploads
- Owner Dashboard & Analytics
- Payments & Invoicing

---

## References

- `docs/epics.md`
- `docs/STORIES.md`
- `docs/xcellent1-custom-webapp-spec.md`

---

## Next Steps

1. Review this PRD and confirm the MVP list and primary success metrics.
2. Run: `workflow create-epics-and-stories` to break requirements into epics and stories.
3. Run: `workflow sprint-planning` (SM) to generate `docs/sprint-status.yaml` and start Phase 4 tracking.

---

_Draft created collaboratively with The Last Line of Code on 2025-12-09._
