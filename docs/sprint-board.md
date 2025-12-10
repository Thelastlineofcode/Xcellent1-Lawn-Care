# Sprint 1 Board - Foundation & Core Flows

This lightweight sprint board tracks active stories and owner assignments for Sprint 1 (2025-12-09 to 2025-12-23).

## Sprint Goal
Deliver core Supabase foundation, auth/roles, storage for job photos, and initial customer acquisition pages so the owner can onboard first customers and crew can start using mobile workflows.

## Team
- Product Owner: The Last Line of Code
- Developers: alex, pat, sam

## Board (Top-level Stories)

- [Done] story-01-setup-supabase — Assignee: alex — Tasks: create schema/migrations, seed data, CI schema apply (done 2025-12-10)
- [Done] story-02-auth-and-roles — Assignee: pat — Tasks: Supabase Auth setup, RLS policies, role metadata (done 2025-12-10)
- [Done] story-03-storage-job-photos — Assignee: sam — Tasks: configure storage bucket, signed uploads (done 2025-12-10)
- [In-Progress] story-04-landing-page — Assignee: alex — Tasks: responsive landing page, CTA
- [In-Progress] story-05-waitlist-form — Assignee: pat — Tasks: form and API integration, confirmation email
- [In-Progress] story-06-crew-job-list — Assignee: sam — Tasks: crew job list UI and endpoint
- [In-Progress] story-07-job-photo-upload — Assignee: sam — Tasks: upload UI + storage link

## Workflow
1. Assign owner to the story and set status to `in-progress`.
2. Developer opens a branch `sprint-1/<story-id>` and implements code + tests.
3. Open a PR, link to story file and sprint board.
4. After PR merge, update story status to `done` and add commit link.

## Links
- Sprint status: `docs/sprint-status.yaml`
- Stories: `docs/stories/`
- Epics: `docs/epics/`
