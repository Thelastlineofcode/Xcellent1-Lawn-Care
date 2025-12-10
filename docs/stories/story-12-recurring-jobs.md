---
title: Recurring Jobs & Schedules
id: story-12-recurring-jobs
epic: epic-06-scheduling
owner: dev
points: 5
related_frs: [FR-003]
---

Tasks
-----
- Add recurring job support to `jobs` table (e.g., recurrence_rule PB format or cron-like fields).
- API endpoint to create recurring job templates.
- Generate job instances for upcoming dates (cron or background worker).

Acceptance Criteria
-------------------
- API allows creation of a recurring job and generated instances appear in crew job lists and owner dashboard.
