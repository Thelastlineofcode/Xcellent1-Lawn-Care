---
title: Landing Page Implementation
id: story-04-landing-page
epic: epic-02-customer-acquisition
owner: design
points: 2
---

Tasks
-----
- Integrate the responsive landing UI into the existing `home.html` which already includes GSAP animations and the multi-step waitlist form.
- Ensure `styles.clean.css` has the necessary styles for `.waitlist-form` and `home.html` uses the site's existing JS handlers.
- Avoid creating a redundant skeleton page; remove `web/static/landing-skeleton.html` and archive/merge any useful CSS/JS into the canonical files.
- Wire the waitlist form to `/api/leads` and add/update an integration test `tests/lead_form_integration_test.ts` to validate the flow.

Acceptance Criteria
-------------------
- The existing `home.html` (landing page) remains the canonical homepage and shows GSAP animations and evacuation of skeletons.
- The waitlist form submits to the waitlist API and returns a success message; integration test validates the route.
- The project includes no duplicate or outdated skeleton landing page files under `web/static/`.
