---
title: Email Integration (SendGrid)
id: story-15-email-integration
epic: epic-07-notifications
owner: dev
points: 3
---

## Tasks

- Implement email outbox processor that sends emails via SendGrid.
- Add template for owner invitation and lead confirmations.
- Add test mode to callback to outbox events rather than sending real emails.

## Acceptance Criteria

- Emails generated are pushed to SendGrid in test mode or saved to file in local
  dev.
