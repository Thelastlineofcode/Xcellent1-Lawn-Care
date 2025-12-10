---
title: Landing Page Implementation
id: story-04-landing-page
epic: epic-02-customer-acquisition
owner: design
points: 2
---

Tasks
-----
- Build a responsive landing page using existing static assets.
- Include clear CTA and trust signals (logo, simple copy).
- Add responsive CSS `web/static/landing.css` and client-side JS `web/static/landing.js` to handle the lead form submit.
- Wire lead form to `/api/leads` and add integration test `tests/lead_form_integration_test.ts`.

Acceptance Criteria
-------------------
- Landing page accessible at `/` and displays correctly on mobile.
- The lead form submits to the waitlist API and returns a success message; integration test validates the route.
