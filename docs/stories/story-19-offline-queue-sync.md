---
title: Offline Queue & Sync for Crew Photos
id: story-19-offline-queue-sync
epic: epic-08-offline
owner: dev
points: 5
---

## Tasks

- Implement offline queue for photo uploads and job status changes using local
  storage or indexedDB.
- Create background sync logic to retry uploads and attach them to job records
  when online.

## Acceptance Criteria

- Crew can capture photos offline; photos upload and link correctly once
  connection is resumed.
