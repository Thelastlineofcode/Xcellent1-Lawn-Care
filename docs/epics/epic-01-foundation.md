---
title: Foundation - Supabase Core
id: epic-01-foundation
owner: product
priority: high
points: 8
---

## Summary

Create the core backend foundation: Supabase schema, authentication, Row Level
Security (RLS), basic API endpoints and storage configuration for photos.

## Acceptance Criteria

- Supabase project schema created and committed as `db/schema.sql` or migration
  files.
- Auth flows for Owner, Manager, Crew work with RLS policies enforcing
  isolation.
- Supabase Storage bucket configured for `job-photos` and accessible by
  authorized crew only.
- Basic API endpoints (jobs, users, invoices) implemented and tests exist.

## Initial Stories

- `story-01-setup-supabase.md`
- `story-02-auth-and-roles.md`
- `story-03-storage-job-photos.md`
