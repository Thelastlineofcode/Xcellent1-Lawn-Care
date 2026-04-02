---
id: stripe-integration
title: Stripe Integration — xcellent1 Payment Platform
erc_phase: realize
owner: travone
created: 2026-04-01
tags: [stripe, payments, invoicing, subscriptions, connect, webhooks, erc]
---

# Stripe Integration — xcellent1 Payment Platform

This document covers every Stripe product and feature applicable to xcellent1 Lawn Care. It is the authoritative reference for the payment module in the Business Operations Webapp. All implementation must pass the ERC gate before code ships.

---

## ERC Status

| Phase | Status | Gate |
|---|---|---|
| Empathize | ✅ Complete | Problem validated (no payment layer wired) |
| Realize | 🟡 In Progress | Spec: this document |
| Conceptualize | ⬜ Pending | Architecture sign-off required |

---

## Payment Architecture Overview

xcellent1 uses **Stripe** as the single payment processor. The stack is:

```
Customer → Stripe Checkout / Payment Element
        → Stripe webhook → Supabase Edge Function
        → bookings/invoices table updated
        → Twilio SMS: "Payment received ✓"
```

All Stripe calls originate from Supabase Edge Functions (Deno). No Stripe SDK — raw `fetch` to the Stripe REST API using the secret key from env vars. This keeps the function portable and dependency-free.

**Env vars required:**
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Feature Coverage

### 1. Payment Intents — One-Time Service Payments

Used for: mowing, landscaping, one-off jobs.

A `PaymentIntent` is created server-side when a customer confirms a booking. The amount is calculated from the service type + square footage. The customer completes payment via **Stripe Payment Element** embedded in the Customer Portal.

**Flow:**
1. Customer submits booking form
2. Edge Function `create-payment-intent` calls `POST /v1/payment_intents`
3. `client_secret` returned to frontend
4. Stripe Payment Element mounts, customer pays
5. Webhook `payment_intent.succeeded` fires → booking marked `paid`

**Key params:**
```json
{
  "amount": 8500,
  "currency": "usd",
  "automatic_payment_methods": { "enabled": true },
  "metadata": { "booking_id": "uuid", "customer_id": "uuid" }
}
```

---

### 2. Stripe Checkout — Hosted Payment Page

Used for: quote-to-payment conversion, email invoice links.

When LaCardio sends a quote, the customer receives an SMS/email link to a **Stripe Checkout Session**. No frontend coding required — Stripe hosts the full payment UI.

**Flow:**
1. Owner approves quote → Edge Function `create-checkout-session`
2. Calls `POST /v1/checkout/sessions` with `mode: payment`
3. Returns `url` → SMS/email link sent to customer
4. `checkout.session.completed` webhook fires → booking paid

**Key params:**
```json
{
  "mode": "payment",
  "line_items": [{ "price_data": { ... }, "quantity": 1 }],
  "success_url": "https://xcellent1.com/paid?session_id={CHECKOUT_SESSION_ID}",
  "cancel_url": "https://xcellent1.com/quote/{booking_id}"
}
```

---

### 3. Invoicing — Stripe Invoices

Used for: recurring clients, net-terms billing, bulk jobs.

Stripe Invoices allow LaCardio to bill customers formally with itemized line items. Customers pay via a hosted invoice URL. Supports **auto-collection** (auto-charge saved card) or **send_invoice** (customer pays manually).

**Flow:**
1. Job completed → Edge Function `create-invoice`
2. Calls `POST /v1/invoices` with `customer` and `collection_method`
3. Add line items via `POST /v1/invoiceitems`
4. Finalize: `POST /v1/invoices/{id}/finalize`
5. Send: `POST /v1/invoices/{id}/send`
6. Webhook `invoice.paid` → booking status updated

**Useful fields:**
- `due_date` — net-30 billing for commercial clients
- `footer` — "Thank you for choosing xcellent1!"
- `metadata.booking_id` — always attach for traceability

---

### 4. Subscriptions — Recurring Maintenance Plans

Used for: weekly/bi-weekly mowing plans, seasonal contracts.

Stripe Subscriptions enable LaCardio to sell maintenance plans. Customer is charged automatically on a schedule without any manual intervention.

**Plans to model:**
| Plan | Price | Interval |
|---|---|---|
| Basic Mow | $75 | Weekly |
| Standard Maintain | $120 | Bi-weekly |
| Full Seasonal | $350 | Monthly |

**Flow:**
1. Customer selects plan on Customer Portal
2. Edge Function `create-subscription` calls `POST /v1/subscriptions`
3. `invoice.payment_succeeded` webhook fires each cycle → booking auto-created
4. Owner Command Center shows active subscription count + MRR

**Key params:**
```json
{
  "customer": "cus_...",
  "items": [{ "price": "price_..." }],
  "payment_behavior": "default_incomplete",
  "expand": ["latest_invoice.payment_intent"]
}
```

---

### 5. Stripe Connect — Crew / Contractor Payouts

Used for: paying 1099 gig workers after job completion.

Stripe Connect (Express accounts) allows xcellent1 to collect payment from customers and automatically split/pay out crew members. LaCardio never touches payroll manually.

**Model:** xcellent1 is the **platform**, crew members are **connected accounts**.

**Flow:**
1. Customer pays → funds land in xcellent1's Stripe balance
2. Job marked complete → Edge Function `payout-crew`
3. Calls `POST /v1/transfers` to crew's connected account
4. Crew gets payout to their bank within 2 business days

**Onboarding:** Crew signs up via Stripe Connect Express OAuth link → bank account verified → ready to receive transfers.

**Key params:**
```json
{
  "amount": 5500,
  "currency": "usd",
  "destination": "acct_...",
  "transfer_group": "booking_{id}"
}
```

> **Cost note:** Stripe Connect Express: 0.25% + $0.25 per payout, capped at $2. For a $55 crew payout, fee = $0.39.

---

### 6. Webhooks — Event-Driven Payment Triggers

All Stripe events are received by a single Edge Function `stripe-webhook` that verifies the signature and routes to handlers.

**Webhook endpoint:** `https://{project}.supabase.co/functions/v1/stripe-webhook`

**Events to handle:**

| Event | Action |
|---|---|
| `payment_intent.succeeded` | Mark booking paid, fire SMS confirmation |
| `payment_intent.payment_failed` | Alert owner, SMS customer re: retry |
| `checkout.session.completed` | Mark booking paid |
| `invoice.paid` | Mark invoice settled, log to `payments` table |
| `invoice.payment_failed` | Alert owner, retry or escalate |
| `customer.subscription.created` | Create recurring booking schedule |
| `customer.subscription.deleted` | Cancel recurring schedule, notify customer |
| `account.updated` (Connect) | Crew onboarding status change |

**Signature verification (critical — always do this):**
```typescript
const sig = req.headers.get('stripe-signature')!;
const event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
```

---

### 7. Customer Portal — Stripe Billing Portal

Used for: letting customers manage their own subscriptions, payment methods, and invoices without owner involvement.

Stripe's hosted **Billing Portal** gives customers a self-service UI to:
- Update credit card
- Cancel/modify subscriptions
- Download past invoices

**Flow:**
1. Customer clicks "Manage Billing" in Customer Portal
2. Edge Function `create-portal-session` calls `POST /v1/billing_portal/sessions`
3. Returns `url` → redirect customer

```json
{
  "customer": "cus_...",
  "return_url": "https://xcellent1.com/account"
}
```

---

### 8. Payment Links — Zero-Code Payment Pages

Used for: quick one-off payments, upsells, ad-hoc services.

Stripe Payment Links create a shareable URL that accepts payment — no code required. LaCardio can generate these from the Stripe Dashboard for edge cases (e.g., "pay for the extra mulch").

**How to use:**
1. Stripe Dashboard → Payment Links → Create
2. Set product name, price, quantity
3. Copy link → paste into SMS/email to customer

No API integration needed. Payments still fire webhooks to the system.

---

### 9. Radar — Fraud Detection

Stripe Radar runs automatically on all payments. No configuration needed at launch. For xcellent1's volume, the default Radar rules are sufficient.

If a payment is flagged:
- `payment_intent.payment_failed` fires with `outcome.type: blocked`
- Owner is alerted via the Command Center
- Customer receives SMS to contact xcellent1 directly

---

### 10. Financial Reporting — Stripe Dashboard + API

LaCardio can view all revenue, payouts, and refunds in the Stripe Dashboard. The Owner Command Center also pulls key metrics via the Stripe API:

```
GET /v1/balance — current available + pending balance
GET /v1/charges?limit=100 — recent charges
GET /v1/payouts — payout history to LaCardio's bank
```

**Revenue metrics surfaced in Owner Command Center:**
- Daily revenue (sum of `payment_intent.succeeded` amounts)
- Monthly MRR (sum of active subscription amounts)
- Outstanding invoices
- Crew payout total (sum of transfers this month)

---

## Database Schema — Payments

```sql
-- payments table
create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id),
  customer_id uuid references customers(id),
  stripe_payment_intent_id text,
  stripe_invoice_id text,
  stripe_subscription_id text,
  amount_cents integer not null,
  currency text default 'usd',
  status text check (status in ('pending', 'paid', 'failed', 'refunded')),
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- crew_payouts table
create table crew_payouts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id),
  crew_id uuid references crew(id),
  stripe_transfer_id text,
  stripe_connect_account_id text,
  amount_cents integer not null,
  status text check (status in ('pending', 'transferred', 'failed')),
  transferred_at timestamptz,
  created_at timestamptz default now()
);
```

---

## Acceptance Criteria (Realize Gate)

- [ ] PaymentIntent flow implemented for one-time bookings
- [ ] Stripe Checkout flow implemented for quote-to-pay links
- [ ] Invoice creation + send flow implemented
- [ ] Subscription plans created in Stripe Dashboard (3 tiers)
- [ ] Stripe Connect onboarding flow for crew implemented
- [ ] `stripe-webhook` Edge Function handles all 8 critical events
- [ ] Billing Portal session endpoint implemented
- [ ] `payments` and `crew_payouts` migration files created
- [ ] All Stripe calls use env vars — no hardcoded keys
- [ ] Webhook signature verification enforced on every request

---

## References

- `docs/epics/epic-07-notifications.md`
- `docs/stories/story-16-sms-integration.md`
- `wiki/erc-flow.md`
- `wiki/gig-worker-model.md`
- `.env.example`
- Stripe API docs: https://stripe.com/docs/api
- Stripe Connect Express: https://stripe.com/docs/connect/express-accounts
- Stripe Webhooks: https://stripe.com/docs/webhooks
