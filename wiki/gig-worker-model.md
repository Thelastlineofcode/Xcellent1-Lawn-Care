---
id: gig-worker-model
title: 1099 Gig Worker Platform — Amazon Flex for Lawn Care
erc_phase: empathize
owner: travone
created: 2026-04-01
tags: [gig, 1099, workers, scale, amazon-flex, operations, sop]
---

# Feature: 1099 Gig Worker Platform (Amazon Flex Model)

## Problem Statement
LaCardio currently relies on a fixed crew. There is no mechanism to scale labor up on demand, no way for new workers to discover and join Xcellent1 as independent contractors, and no structured onboarding that allows an unfamiliar worker to execute jobs to standard on day one. This caps revenue at crew capacity and creates single points of failure when crew members are unavailable.

## Pain Data
- Owner manages crew operationally via direct communication — no app-mediated dispatch
- No worker acquisition funnel — hiring is reactive, not systematic
- Amazon Flex model proves gig labor works at scale: workers download app, select available “blocks” (jobs), execute, earn [web:99]
- Gig platforms attract contractors primarily through scheduling flexibility and self-determined income [web:102]
- Xcellent1 already has SOPs (SOP.md) — the operational knowledge exists but isn’t packaged for self-serve onboarding

## Root Cause
The business operates as a traditional employer-managed crew. The infrastructure for independent contractor dispatch (job block marketplace, worker profile, background check gate, SOP delivery at onboarding, performance scoring) does not exist.

## The Model

### How It Works
1. Worker downloads/opens the xcellent1 web app, creates a contractor profile
2. Passes a qualification gate: background check, equipment verification, SOP quiz
3. Sees available “job blocks” in their area (lawn mowing, fertilization, aeration, etc.)
4. Claims a block, gets client address + instructions + checklist
5. Completes job, uploads photo proof, marks complete
6. Gets paid per job (1099 contractor — no employment overhead for LaCardio)
7. Performance tracked — red/yellow/green rating (aligns with issue #23)
8. High-performers get priority access to better-paying blocks

### Dual Channel for LaCardio
- **Operational scaling:** surge capacity on busy weeks without payroll risk
- **Worker acquisition funnel:** market the platform as “start your own lawn care gig” — attracting Houston-area operators who want flexible income
- **Brand extension:** Xcellent1 becomes a platform, not just a service company

### Revenue Model Options
- LaCardio keeps margin between client price and contractor payout (standard gig model)
- Could white-label the platform to other Houston service businesses (plumbing, pressure washing, etc.) at $500/mo — aligns with issue #21 agency play

## Acceptance Criteria (to move to REALIZE)
- [ ] HITL Gate 1 meeting notes filed — LaCardio must confirm interest in gig model before any build
- [ ] Legal review: 1099 contractor classification rules for Texas
- [ ] Job block data model defined (job type, location, time window, payout, skill requirements)
- [ ] Worker qualification gate defined (what checks, what SOP quiz questions)
- [ ] Payment flow defined (how/when contractors get paid — Stripe Connect or similar)
- [ ] Distinction between “existing crew” and “gig workers” in the data model

## References
- Amazon Flex model: https://flex.amazon.com
- Gig platform mechanics: https://dev.training.dealerinspire.com/other-apps-like-amazon-flex/
- Existing SOPs: SOP.md
- Related: Issue #21 (autoresearch loop / agency play)
