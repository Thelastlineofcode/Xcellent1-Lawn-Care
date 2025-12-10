---
title: Authentication and Roles (Owner/Manager/Crew)
id: story-02-auth-and-roles
epic: epic-01-foundation
owner: dev
points: 3
---

Tasks
-----
- Configure Supabase Auth and user role metadata
- Create RLS policies for Owners and Crew
- Add sign-up flow and role assignment scripts
- Add a SQL migration: `db/migrations/2025-12-10-0002-rls-policies.sql` that configures RLS policies for clients, jobs, invoices, and a fallback outbox policy.
- Add a test `tests/rls_migration_test.ts` that verifies the migration contains ENABLE and CREATE POLICY statements.

Acceptance Criteria
-------------------
- Users can sign up and are assigned roles; RLS prevents cross-owner data access.
- Users can sign up and are assigned roles; RLS prevents cross-owner data access.
- The RLS migration and test are present and successful in CI.
