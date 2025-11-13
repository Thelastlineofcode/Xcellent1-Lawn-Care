# Xcellent1 Lawn Care — Local Development

## Getting Started

1. **Install Deno**
   - See: https://deno.land/manual/getting_started/installation

2. **Start the Dev Server**
   ```bash
   deno run --allow-net server.ts
   ```
   - The server will start on the default port (e.g., 8000).

3. **Health Check**
   - Visit: http://localhost:8000/health
   - Should return: `{ "status": "ok" }`


4. **Database Migrations (Supabase/Postgres)**
   - Ensure you have a local Supabase/Postgres instance running.
   - Run migrations:
     ```bash
     psql "$DATABASE_URL" -f db/migrations/001_core_tables.sql
     ```
   - This will create all core tables, indexes, and RLS policies.

5. **Environment Variables**
   - Set `DATABASE_URL` for Supabase/Postgres connection (optional for local dev).

6. **API Endpoints**
   - See `api-endpoints.ts` for available endpoints and usage.

---

## Project Structure
- `server.ts` — Main Deno server
- `api-endpoints.ts` — API route handlers
- `deno.json` — Deno config
- `web/` — Static files and uploads

---

## Notes
- For DB migrations, see `database-schema.sql` and `db/`.
- For architecture and user stories, see `docs/epics_and_stories.md`.
