---
title: Ad-Hoc Code Review: Landing & Waitlist
  date: "2025-12-10"
  author: "Automated Review (AI)"
  scope: [
    "web/static/home.html",
    "web/static/app.js",
    "tests/waitlist_integration_test.ts",
    "web/tests/frontend_static_test.ts",
    "server.ts",
    "api-endpoints.ts",
  ]
---

# Summary

This ad-hoc review covers the landing page and waitlist flow changes (landing UI
and waitlist endpoint). The main findings below focus on functional alignment,
duplicated endpoints, UX consistency, test coverage, and suggested fixes.

Outcome: CHANGES REQUESTED (recommended fixes before approving full merge)

---

## Acceptance Criteria Coverage (story: `story-05-waitlist-form`)

- AC: Submissions create lead/waitlist records and trigger confirmation email in
  dev/test — PARTIALLY MET
  - Evidence: `tests/waitlist_integration_test.ts` posts to `/api/waitlist` and
    asserts 201 and id returned (integration test exists).
    (tests/waitlist_integration_test.ts)
  - Gap: The server-side implementation handling the waitlist currently differs
    in two locations (`server.ts` vs `api-endpoints.ts`); the main runtime
    `server.ts` does not send confirmation emails, whereas `api-endpoints.ts`
    does. This means the acceptance criterion (confirmation email) may not be
    reliably exercised during runtime. (Evidence: `server.ts` waitlist handler
    returns 201 and does not call `sendEmail`; `api-endpoints.ts` waitlist
    handler calls `sendEmail`).

---

## Key Findings & Evidence

1. Duplicate / Divergent Waitlist Implementations (HIGH Severity)

- `api-endpoints.ts` defines a waitlist handler (requires phone & address +
  sends confirmation email). See: `api-endpoints.ts` lines ~190–260.
  - Example: `api-endpoints.ts` validates `phone` and `address` and calls
    `sendEmail` on success.
- `server.ts` also contains a waitlist handler (minimal validation: name & email
  only, no email shipping). See: `server.ts` lines ~1128–1320.
  - Example: `server.ts` sets `phone` & `property_address` to empty strings when
    inserting into DB and returns 201.

Why it matters: Duplicate implementations introduce the risk of divergence
(different validations, behaviors and side-effects). CI, runtime, and automated
testing could use different code paths causing production behavior to differ
from developer expectations.

Action items:

- [ ] [High] Consolidate waitlist endpoint to a single implementation — prefer
      the `server.ts` main router or extract a single module so behavior and
      validations are consistent. (owner: alex)

2. Inconsistent Form / Server Field Mapping (MEDIUM Severity)

- The canonical home page `web/static/home.html` `waitlist-form` (multi-step)
  includes `name`, `email`, and `service` but not `phone` or `address` (which
  may be required by some handler implementations). (Evidence: `home.html` lines
  ~249–307).
- The `server.ts` waitlist handler accepts and inserts `phone` and
  `property_address` as blank defaults, so it is permissive. `api-endpoints.ts`
  expects these fields and will return a 400 if these are missing.

Why it matters: If the runtime uses the api-endpoints style handler (that
requires `phone`/`address`) the waitlist form on the landing page will generate
400 errors for valid users; conversely if the runtime uses the permissive
handler the site collects less info than expected. Either way mismatch is risky.

Action items:

- [ ] [High] Standardize field names and requirements: decide on required fields
      for the waitlist flow (at minimum: name & email; ideally: phone & property
      address). If requiring address/phone, update the multi-step form to
      collect them. If not, relax validation and set fields as optional in the
      API impl. (owner: pat)
- [ ] [Med] For 'service' name mismatch: choose a canonical field name —
      `preferred_service_plan` (DB) vs `service` (form) — ensure server accepts
      the client `service` field or the form submits `preferred_service_plan`
      instead. (owner: pat)

3. UX Consistency: Inline 'alert' usage vs site toast/notification (LOW–MEDIUM)

- The `home.html` inline `handleWaitlistSubmit` uses `alert()` for success and
  even shows success text on client-side exceptions to gracefully degrade. This
  is inconsistent with the shared `app.js` UI message styling (`showMessage`)
  used in other flows.
  - Evidence: `home.html` `handleWaitlistSubmit` function present at lines
    ~1036–1076 (shows success alert and a catch that shows a success fallback
    message on exception). `app.js` shows `showMessage` utility.

Action items:

- [ ] [Med] Remove inline `alert()` usage and migrate `handleWaitlistSubmit`
      into `web/static/app.js` so the message display is consistent across the
      UI. Replace `alert()` with `showMessage()` calls. (owner: alex)

4. Test Coverage: E2E test gap for the DOM-level waitlist form (MEDIUM)

- Current tests include `tests/waitlist_integration_test.ts` (API integration)
  and `web/tests/frontend_static_test.ts` (static presence). There is no
  DOM-driven E2E test to ensure the `waitlist-form` multi-step UI collects the
  required fields, constructs correct payload, and submits as the server
  expects.

Action items:

- [ ] [Med] Add a simple E2E test that uses Playwright or a Deno-friendly
      browser automation to complete the waitlist multi-step form and validate
      the posted JSON payload contains the expected fields (name, email, service
      or `preferred_service_plan`, phone/address if required). (owner: sam)

5. Logging / Outbox for subsequent owners & email dispatch (LOW)

- The `server.ts` file-backed fallback writes to `bmad/agents/dev_db.json` and
  creates an outbox event; this is good for local dev. Email sending happens in
  `api-endpoints.ts`. If consolidated to `server.ts`, prefer queuing the email
  into outbox (and have worker send it) to avoid blocking response on
  third-party services or returning inconsistent status on failures.

Action items:

- [ ] [Low] When consolidating, ensure email dispatch is queued (outbox event)
      so the HTTP response is issued promptly and errors in sending do not turn
      into 500s. (owner: alex)

---

## Suggested Next Steps (Priority-ordered)

1. Consolidate waitlist routes to a single canonical handler (server-side) and
   migrate behavior, including whether or not to send an email vs queue as
   outbox. (High)
2. Standardize payload field names (prefer `preferred_service_plan` for DB,
   accept `service` from client). (High)
3. Update the multi-step `waitlist-form` to collect `phone` and
   `property_address` if required. Otherwise, mark fields optional and update
   docs. (High)
4. Migrate inline home `handleWaitlistSubmit` handler into `web/static/app.js`
   and unify UX messaging via `showMessage`. (Medium)
5. Add an E2E DOM test to validate the waitlist flow with the landing page and
   the backend (Medium). (owner: sam)
6. Remove or archive `api-endpoints.ts`'s duplicate waitlist logic or refactor
   to share a single module to avoid divergence (Medium–High). (owner: alex)

---

## Test Coverage and Gaps

- Present:
  - `tests/waitlist_integration_test.ts` (integration test posting required
    fields to `/api/waitlist`, asserts 201)
  - `web/tests/frontend_static_test.ts` (ensures `home.html` has
    `waitlist-form`)
- Missing:
  - DOM-driven test that simulates the multistep waitlist UI and validates the
    submitted payload (recommended).
  - Explicit test asserting the confirmation email was queued/sent when dev
    email service configured (mocking `sendEmail`).

---

## Security Observations

- The public waitlist path accepts input and inserts into DB. It uses
  parameterized inserts via the DB client — good protection against SQL
  injection.
- Rate-limiting is present in the `api-endpoints.ts` implementation
  (`checkRateLimit` call) and in some routes in `server.ts`; verify the behavior
  is consistent across both implementations. (owner: pat)

---

## Final Note

This is a focused ad-hoc review for the landing/waitlist flow. The key action is
consolidating the waitlist logic to a single canonical handler, then aligning UI
/ API behavior and adding an E2E DOM test. After those changes are in place I
recommend re-running the test suite and re-running a story-based review
(option 2) if you'd like a full acceptance validation.

---

Document generated by: Automated review on 2025-12-10
