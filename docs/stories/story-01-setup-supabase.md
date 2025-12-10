---
title: Setup Supabase Project & Schema
id: story-01-setup-supabase
epic: epic-01-foundation
owner: dev
points: 3
---

Tasks
-----
- Create Supabase project (or configure local supabase CLI)
- Implement core schema (users, customers, jobs, invoices)
 - Add migrations to `db/migrations/` and commit (e.g., `2025-12-10-0001-initial-schema.sql`)
 - Add basic seed data for local dev
 - Add a minimal acceptance test `tests/db_schema_test.ts` to validate migration files exist and contain expected CREATE TABLE statements

Acceptance Criteria
-------------------
 - `db/schema.sql` in repo or migrations present and CI runs basic schema apply in dev.
 - Migration file present in `db/migrations/` and `tests/db_schema_test.ts` asserts core tables are present.
