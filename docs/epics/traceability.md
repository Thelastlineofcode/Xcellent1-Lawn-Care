---
title: FR → Epic → Story Traceability Matrix
date: 2025-12-10
---

# Traceability Matrix

This table maps Functional Requirements (FR-###) to the Epics and Story IDs in
`docs/epics.md` and `docs/STORIES.md`.

| FR ID  | FR Title                    | Epic # | Epic Name                         | Stories (IDs)                                                      |
| ------ | --------------------------- | ------ | --------------------------------- | ------------------------------------------------------------------ |
| FR-001 | User Management             | 1      | Foundation                        | STORY-1, STORY-2, STORY-4                                          |
| FR-002 | Landing Page & Waitlist     | 2      | Customer Waitlist                 | STORY-3, STORY-4, STORY-5, STORY-6, STORY-7                        |
| FR-003 | Job Management & Scheduling | 3,6    | Crew Mobile Dashboard; Scheduling | STORY-8, STORY-9, STORY-10, STORY-11, STORY-12, STORY-13, STORY-14 |
| FR-004 | Crew Mobile Workflow        | 3      | Crew Mobile Dashboard             | STORY-8, STORY-9, STORY-10, STORY-11, STORY-12                     |
| FR-005 | Invoicing & Payments        | 5      | Payment Processing                | STORY-18, STORY-19, STORY-20, STORY-21, STORY-22                   |
| FR-006 | Owner Dashboard             | 4      | Owner Dashboard & Analytics       | STORY-13, STORY-14, STORY-15, STORY-16, STORY-17                   |
| FR-007 | Notifications               | 9      | Notifications & Alerts            | STORY-35, STORY-36, STORY-37, STORY-38                             |

Notes:

- The Story IDs above match how the `docs/epics.md` file lists stories inside
  each epic. If story ID naming changes or becomes canonical, update this matrix
  accordingly.
- FR-003 maps to multiple epics (Crew Mobile and Scheduling) because job
  management spans both areas.
