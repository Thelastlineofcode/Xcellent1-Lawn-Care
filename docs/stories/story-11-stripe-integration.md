---
title: Stripe Checkout Integration
id: story-11-stripe-integration
epic: epic-05-payments-invoicing
owner: dev
points: 5
---

Tasks
-----
- Configure Stripe test keys in env and implement checkout session creation.
- Provide a secure webhook endpoint to receive payment confirmation and update invoices.
- Add basic retry/error handling for webhook processing.

Acceptance Criteria
-------------------
- Payments can be completed in Stripe test mode and webhook updates invoice status.
