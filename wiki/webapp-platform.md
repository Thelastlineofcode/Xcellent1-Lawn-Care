---
id: webapp-platform
title: Xcellent1 Business Operations Webapp
erc_phase: empathize
owner: travone
created: 2026-04-01
tags: [webapp, crm, crew, operations, alerts, customer-comms, hiring]
---

# Feature: Xcellent1 Business Operations Webapp

## Problem Statement
LaCardio currently runs his business through manual communication, no centralized dashboard for real-time crew status, no automated customer communication, and no system that surfaces hiring leads or new client opportunities proactively. The existing crew and owner dashboards are functional but reactive — LaCardio has to check in rather than being pushed actionable signals.

## Pain Data
- Owner stated: “I get notified immediately and I maybe check the job out that day” — mental model is push, not pull (issue #24)
- Crew performance is invisible to crew members — owner must manually communicate accountability (issue #23)
- No automated customer comms (booking confirmations, job updates, completion notifications, review requests)
- No hiring pipeline — LaCardio has no system to identify or convert potential 1099 workers
- No inbound lead alert system — new quote requests require manual dashboard checks
- ServiceTitan and LawnPro both solve this for enterprise — opportunity is to build it natively in xcellent1’s existing stack (Deno + Fly.io + Supabase + Cloudflare) rather than pay $200-400/mo SaaS [web:103]

## Root Cause
The site was built phase by phase (phases 1-3 complete per PHASES_1-3_COMPLETE.md). Phases 4-5 (notifications, CRM communications, automation) are architecturally planned (SendGrid/Twilio in requirements.txt) but not wired to any event-driven trigger system.

## Scope of the Webapp Platform

### Module 1 — Owner Command Center
- Real-time job status board (crew location, job in progress, completed)
- Push alerts: job complete, new lead, new hire applicant, customer issue
- Revenue metrics: daily/weekly/monthly, by crew, by service type
- One-tap crew communication

### Module 2 — Customer Portal
- Booking / quote request
- Job status tracking (GPS crew location, ETA)
- Invoice + payment history
- Automated comms: booking confirmation, day-before reminder, job-start notification, completion + photo, review request

### Module 3 — Crew Self-Service
- Today’s jobs, route, client notes
- Performance self-view (red/yellow/green — issue #23)
- Photo upload on job completion
- Clock in/out

### Module 4 — Hire + Lead Intelligence
- Alert when inbound form submission matches “high-value” lead score
- Alert when a worker application is submitted
- Lead scoring rules (see issue #21 autoresearch loop)

## Acceptance Criteria (to move to REALIZE)
- [ ] HITL Gate 1 meeting notes filed for this feature
- [ ] Module priority order approved by LaCardio
- [ ] Event-driven architecture spec written (what events trigger what notifications)
- [ ] Customer comms flow diagrammed (what message, when, via what channel)
- [ ] Existing Twilio/SendGrid wiring audited against new event list

## References
- Existing dashboard: web/static/crew.html, web/static/owner.html
- ServiceTitan feature reference: https://www.servicetitan.com/industries/lawn-care-software
- Issue #23 (crew performance), Issue #24 (push notifications)
