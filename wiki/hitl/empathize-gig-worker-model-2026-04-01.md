# HITL Review — Empathize Sign-Off
**Feature:** 1099 Gig Worker Platform (Amazon Flex Model)
**Date:** 2026-04-01
**Attendees:** Travone Butler, LaCardio (owner)
**Gate:** empathize

## What Was Reviewed
The Amazon Flex-style gig worker platform concept: workers claim job blocks via app, execute to SOP standard, get paid per job as 1099 contractors. LaCardio is currently experiencing active pain managing crews. The platform solves the immediate crew management problem AND creates a scalable labor marketplace. Reviewed the dual value: surge capacity + worker acquisition funnel. Also reviewed the agency play (white-labeling to other local service businesses in LaPlace, Norco, Destrehan, Metairie, and beyond).

## Decisions Made
- LaCardio confirmed this directly addresses his current crew management pain
- Gig model is approved for development
- Legal/T&C work required before build: Texas (and Louisiana) 1099 contractor classification, platform terms of service, worker agreement
- Scale plan: start with LaPlace/Norco/Destrehan area, expand to greater New Orleans metro
- Agency white-label plan approved in principle — package the platform for other local service businesses
- SOPs must be digitized and packaged for self-serve gig worker onboarding before platform launches
- Innovation additions: AI job routing, dynamic pricing by demand, gig worker performance scoring, surge block pricing

## Outstanding Legal Items (MUST resolve before Realize gate)
- [ ] Louisiana 1099 contractor classification rules (not Texas — LaCardio is in LaPlace, LA)
- [ ] Platform terms of service and worker independent contractor agreement drafted
- [ ] Client-facing terms updated to reflect gig worker delivery model
- [ ] Background check compliance (FCRA requirements for gig platforms)
- [ ] Payment platform compliance (Stripe Connect 1099-K reporting thresholds)

## Approval
- [x] Approved as-is (pending legal items above before Realize)

**Approved by:** LaCardio (owner), Travone Butler
**Signature:** 2026-04-01 @Thelastlineofcode

## Next Step
Resolve legal items above. Then advance to `erc:realize` — job block data model, worker qualification gate, payment flow, Supabase schema.
