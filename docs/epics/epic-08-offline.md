---
title: Offline Support & Mobile UX
id: epic-08-offline
owner: product
priority: low
points: 6
---

## Summary

Implement progressive web app (PWA) features such as offline caching, service
worker, and sync for the crew mobile UI so job details and photo uploads work in
low connectivity.

## Acceptance Criteria

- Service worker caches key assets and job data.
- Photo uploads are queued while offline and retried when connection restored.
- Crew app can mark jobs complete while offline and sync events after
  reconnection.

## Initial Stories

- `story-18-service-worker.md`
- `story-19-offline-queue-sync.md`
