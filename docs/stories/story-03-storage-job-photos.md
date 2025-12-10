---
title: Configure Storage for Job Photos
id: story-03-storage-job-photos
epic: epic-01-foundation
owner: dev
points: 2
---

Tasks
-----
- Create a Supabase Storage bucket `job-photos`.
- Implement upload endpoint or client direct upload with signed URLs.
- Ensure access is restricted to job participants and owner/manager.
- Create a Supabase Storage bucket `job-photos` and document setup in `db/SETUP_SUPABASE_STORAGE.md`.
- Implemented server endpoint `POST /api/jobs/:id/photo/upload-target` that returns a storage path and publicUrl (or local fallback) for client-side uploads.
- Implemented `POST /api/jobs/:id/photo` to accept base64 uploads (server-side) and persist to Supabase or local storage.
- Add integration test `tests/storage_upload_test.ts` validating storage target behavior.

Acceptance Criteria
-------------------
- Photos uploaded during a job are stored and retrievable via the job detail API.
- Photos uploaded during a job are stored and retrievable via the job detail API.
- A storage upload target endpoint is present and returns a valid storagePath and publicUrl (or local dev fallback). Integration tests demonstrate expected behavior.
