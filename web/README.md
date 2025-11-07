# Local web UI (development)

This is a tiny Deno-based web UI for local testing. It provides:

- Lead capture form at `/` (posts to `/api/leads`)
- Crew dashboard at `/dashboard` (shows leads and pending outbox events)
- Photo upload for jobs that stores uploads to `web/uploads` and creates an outbox event

Run locally (from repository root):

```bash
deno run --allow-net --allow-read --allow-write --allow-env web/server.ts
```

Then open `http://localhost:8000` in your browser.

Notes:

- The web server uses the repository's `bmad/agents/lib/supabase.ts` helper; that file will fall back to the local dev DB stub when no Supabase env vars are set.
- Uploaded images are saved under `web/uploads` during local runs.
