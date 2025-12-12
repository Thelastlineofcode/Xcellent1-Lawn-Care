---
title: Notifications & Communications
id: epic-07-notifications
owner: product
priority: medium
points: 8
---

## Summary

Implement notification and communication channels: emails, SMS, in-app
notifications, and debug-friendly agent outbox for sending notifications on
events like job creation, completions, and invoices.

## Acceptance Criteria

- Emails (SendGrid) and SMS (Twilio) integration add-ons work in test mode.
- Outbox events are processed and result in notifications being queued and sent.
- Owner has toggle controls for notifications per event type.

## Initial Stories

- `story-15-email-integration.md`
- `story-16-sms-integration.md`
- `story-17-in-app-notifications.md`
