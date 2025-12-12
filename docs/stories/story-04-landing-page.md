---
title: Landing Page Implementation
id: story-04-landing-page
epic: epic-02-customer-acquisition
owner: design
points: 2
related_frs: [FR-002]
---

## Tasks

- Integrate the responsive landing UI into the existing `home.html` which
  already includes GSAP animations and the multi-step waitlist form.
- Ensure `styles.clean.css` has the necessary styles for `.waitlist-form` and
  `home.html` uses the site's existing JS handlers.
- Avoid creating a redundant skeleton page; remove
  `web/static/landing-skeleton.html` and archive/merge any useful CSS/JS into
  the canonical files.
- Wire the waitlist form to `/api/leads` and add/update an integration test
  `web/tests/waitlist_e2e_test.ts` to validate the flow by posting to `/api/waitlist`.

### Review Follow-ups (AI)
- [ ] [High] Remove `web/static/landing-skeleton.html` from `web/static/` or move it into `web/static/archive/` [file: web/static/landing-skeleton.html]
- [ ] [Med] Clarify endpoint intent & update tasks: either wire waitlist form to `/api/leads` or update the task to reference `/api/waitlist` (AC matches current UI). Update tests accordingly.
- [ ] [Low] Add test coverage asserting GSAP `gsap.from` call exists or verifying the animation script loads on the page.

## Acceptance Criteria

- The existing `home.html` (landing page) remains the canonical homepage and
  shows GSAP animations and evacuation of skeletons.
- The waitlist form submits to the waitlist API and returns a success message;
  integration test validates the route.
- The project includes no duplicate or outdated skeleton landing page files
  under `web/static/`.


## Senior Developer Review (AI)

**Reviewer:** The Last Line of Code
**Date:** 2025-12-11
**Outcome:** Changes Requested

### Summary
Landing page implementation is largely correct: the canonical `home.html` integrates the responsive landing UI, includes GSAP animations, the multi-step waitlist form is wired to the waitlist API and tests exist. A small number of tasks are incomplete or inconsistent with the story: the obsolete `web/static/landing-skeleton.html` still exists in the project root (should be removed or moved to archive), and one task references wiring to `/api/leads` while implementation uses `/api/waitlist` (AC indicates waitlist API behavior). These are medium-severity issues requiring follow-up.

### Acceptance Criteria Coverage
- AC1: Canonical `home.html` remains the canonical home page and shows GSAP animations and evacuation of skeletons — IMPLEMENTED
  - Evidence:
    - `web/static/home.html` [home.html#L44-L44] includes `styles.clean.css` for canonical styles. 
    - `web/static/home.html` [home.html#L108-L109] includes GSAP scripts.
    - `web/static/home.html` [home.html#L1281-L1287] registers and animates `.waitlist-form` via GSAP.

- AC2: Waitlist form submits to the waitlist API and returns a success message; integration test validates the route — IMPLEMENTED
  - Evidence:
    - `web/static/app.js` [app.js#L160-L180] submits payload to `/api/waitlist` with `fetchJSON(`${API_BASE}/api/waitlist`, ...)`.
    - `server.ts` [server.ts#L1238-L1246] contains a `POST /api/waitlist` handler that validates input and returns `ok: true` with a 201 status.
    - `web/tests/waitlist_e2e_test.ts` [web/tests/waitlist_e2e_test.ts#L1-L55] verifies posting to `/api/waitlist` returns `201` and a response `id`.

- AC3: No duplicate or outdated skeleton landing page files under `web/static/` — PARTIAL / MISSING
  - Evidence:
    - `web/static/landing-skeleton.html` exists and is a redirect file to `home.html`: `web/static/landing-skeleton.html` [landing-skeleton.html#L1-L8].
    - There is an archived copy at `web/static/archive/landing-skeleton.html` which is the expected location for reference material. The presence of a deprecated redirect file in `web/static/` should be removed to avoid confusion.

### Tasks / Subtasks Validation
- Integrate landing UI into `home.html` — VERIFIED
  - Evidence: `web/static/home.html` [home.html#L244-L262] contains the waitlist form, hero, and integrated UI.

- Ensure `styles.clean.css` includes `.waitlist-form` styles — VERIFIED
  - Evidence: `web/static/styles.clean.css` [styles.clean.css#L274-L280] includes `.waitlist-form` styling.

- Remove redundant skeleton page `web/static/landing-skeleton.html` — NOT DONE
  - Evidence: `web/static/landing-skeleton.html` still present with redirect to `home.html` [landing-skeleton.html#L1-L8].

- Wire the waitlist form to `/api/leads` and add/update `tests/lead_form_integration_test.ts` — PARTIAL/AMBIGUOUS
  - Evidence: The application wires the waitlist form to `/api/waitlist` (client: `web/static/app.js` [app.js#L160-L180], server: `server.ts` [server.ts#L1238-L1328]). A `tests/lead_form_integration_test.ts` exists but targets `/api/leads` (career leads), not `/api/waitlist`. Clarify intent: if the waitlist should post to `/api/leads`, update implementation or update task to match AC/UI.

### Quality, Security and Risk Findings
- [MED] Duplicate skeleton file present: `web/static/landing-skeleton.html` (causes confusion; remove or archive)
- [MED] Task/AC inconsistency: Task references `/api/leads` while UI and AC use `/api/waitlist` — clarify and correct
- [LOW] Consider explicitly setting `API_BASE` in `web/static/app.js` when building for production.
- [LOW] The `api-endpoints.ts` file contains a note about being an archive/legacy set; prefer using `server.ts` for runtime handlers and remove duplication.

### Action Items (Follow-ups)
- [ ] [High] Remove `web/static/landing-skeleton.html` from `web/static/` (move to `web/static/archive` or delete) [file: web/static/landing-skeleton.html]
- [ ] [Med] Clarify and reconcile the task that requests wiring the waitlist to `/api/leads` (task vs AC mismatch). Options:
  - If the design requires `waitlist` to be a separate route, update the story task to reference `/api/waitlist`.
  - If the design requires a unified endpoint, refactor the UI to post to `/api/leads` and ensure both tests and server support it.
- [ ] [Med] Update `docs/stories/story-04-landing-page.md` tasks section to add the two follow-up checkboxes above under `Review Follow-ups (AI)`.
- [ ] [Low] Consider adding a small DOM-driven test that confirms GSAP animations are present (e.g., verifying that `gsap` script loads or that `gsap.from` is inlined in `home.html`), if this is important for AC1.

### Test Coverage Notes
- `web/tests/waitlist_e2e_test.ts` covers the waitlist endpoint and confirms 201/response `id` — GOOD
- `tests/lead_form_integration_test.ts` covers `/api/leads` — NOTE: unrelated to waitlist if `waitlist` remains an independent endpoint

### Recommended Next Steps
1. Remove or archive the `web/static/landing-skeleton.html` file and commit a PR.
2. Update story tasks to reflect actual endpoints and confirm if `/api/leads` is required for the waitlist flow. Implement changes accordingly.
3. Re-run E2E tests and validate: `deno test --allow-net --allow-env web/tests/waitlist_e2e_test.ts` and `deno test --allow-net --allow-env tests/lead_form_integration_test.ts`.
4. When follow-ups are complete, re-run the review.

