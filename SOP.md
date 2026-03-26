# xcellent1 — Standard Operating Procedures
**Version:** 1.0 | **Date:** 2026-03-25
**Domain:** Lawn care & landscaping business website
**Stakeholders:** Family business — non-technical decision makers involved

---

## 1. Project Context
xcellent1 is a customer-facing lawn care business site.
Non-technical stakeholders (family) are affected by every visible change.
Simplicity and reliability over cleverness. Mobile is primary viewport.
Business owner sign-off required on any change that touches customer-facing flows.

---

## 2. Issue PRD Template

```markdown
## Overview
[1-3 sentences in plain English. No jargon.
Include: what the user sees today vs. what they will see after this change.]

## Problem Statement
[What is broken or missing from the customer's perspective.
Describe the user impact — not the technical cause.]

## Scope
Files to read:
Files to modify:
Files to create:

## Implementation
[Step-by-step. Enough for implementation without questions.]

## User Flow (Before / After)
Before: [Describe what a customer does today]
After: [Describe what a customer does after this change]

## Checklist
- [ ] Mobile viewport tested (375px minimum)
- [ ] Pricing/scheduling/contact form changes reviewed by business owner
- [ ] No broken links introduced
- [ ] Page load time not degraded (check Lighthouse score)
- [ ] Failure path tested (form submit fails, etc.)

## Acceptance Criteria
[Plain English. What does a non-technical reviewer confirm to approve this?
e.g. "Customer can submit a quote request and receives a confirmation message."]

## Reviewers
- [ ] Travone (technical sign-off)
- [ ] Business Owner (required for pricing, scheduling, contact changes)
```

---

## 3. Business Owner Sign-Off Rule

The following changes ALWAYS require business owner review before merge:
- Pricing display or pricing logic
- Scheduling or booking flows
- Contact forms or phone/email info
- Service descriptions
- Any copy that makes a business claim

## 4. Mobile First Rule

xcellent1 customers are primarily on mobile.
Every issue checklist must include:
- [ ] Tested at 375px (iPhone SE)
- [ ] Tested at 414px (larger Android)
- [ ] CTA buttons are thumb-reachable
- [ ] Forms are usable on mobile keyboard

## 5. Performance Rule

Customer sites lose conversions on slow loads.
Every PR must not degrade Lighthouse performance score below 90.
Run before requesting review:
```bash
npx lighthouse [url] --output=json --quiet | jq '.categories.performance.score'
```

## 6. Copy & Content Rule

All customer-visible text must be:
- Reviewed by business owner if it describes services or pricing
- Free of technical jargon
- Consistent with existing brand voice

## 7. Merge Criteria

A PR cannot merge until:
- [ ] Mobile viewport confirmed at 375px
- [ ] Lighthouse performance score ≥ 90
- [ ] Business owner sign-off (if applicable)
- [ ] No broken links
- [ ] Travone technical sign-off
