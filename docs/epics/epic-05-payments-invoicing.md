---
title: Payments & Invoicing
id: epic-05-payments-invoicing
owner: product
priority: medium
points: 5
---

## Summary

Simple invoicing and payment flow: generate invoice on job completion, send
Stripe Checkout link, reconcile payments via webhook.

## Acceptance Criteria

- Invoice created and viewable in Owner dashboard.
- Stripe Checkout integration implemented and verified in test mode.
- Payment webhook updates invoice status automatically.

## Initial Stories

- `story-10-invoice-generation.md`
- `story-11-stripe-integration.md`
