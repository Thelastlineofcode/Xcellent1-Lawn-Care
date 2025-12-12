---
title: Fix Owner Login and Owner Dashboard Access
id: STORY-55
epic: Owner Dashboard & Analytics
owner: platform-engineer
status: draft
---

Summary
-------
Resolve owner login failures and ensure owner dashboard loads correctly. This involves verifying environment configuration, Supabase connectivity, auth user linking to database profile, RLS policies, and owner dashboard API endpoints.

Tasks
-----
- [ ] Validate `.env.local` contains SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET, and DATABASE_URL.
- [ ] Run `scripts/check_env.sh` to verify environment.
- [ ] Start local server and reproduce login flow: `deno task dev` and visit `/login.html`.
- [ ] Check `deno-server.log` for Supabase initialization messages and JWT verification warnings.
- [ ] If login fails, confirm owner user exists in `auth.users` and is linked to `users.auth_user_id` in database. Fix with SQL from `db/migrations/003_create_test_owner.sql`.
- [ ] Verify `owner@xcellent1.com` role is `owner` and has correct RLS policies to view owner metrics.
- [ ] Ensure `/api/owner/metrics` endpoint returns data; inspect `supabase_auth.ts` and `server.ts` for permission checks.
- [ ] Add console/debug logs in `supabase_auth.ts` if needed to trace JWT verification (already have debug logs, enable them if `APP_ENV=development`).
- [ ] Add or verify integration test: `tests/e2e` owner dashboard login flow passes.

Acceptance Criteria
-------------------
- Owner can log in at `/login.html` using `owner@xcellent1.com` and default password (or configured password)
- `GET /api/owner/metrics` returns HTTP 200 with expected JSON data
- Owner dashboard `/static/owner.html` displays metrics and does not show errors in console
- CI tests for owner dashboard login pass

Notes
-----
- We added `.env.local.example` and a script to check local environment variables.
- Remove sensitive files such as `.env.local.bak` (already removed) and ensure `.env.local` isn't committed.
- RLS and JWT verification are implemented in `supabase_auth.ts` and should be used in debugging.
