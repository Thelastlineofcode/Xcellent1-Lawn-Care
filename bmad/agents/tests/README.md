# Agent tests (local)

These tests exercise the local dev DB and core heuristics so you can validate behavior before deploying.

Run tests with Deno from the repository root. The tests need read/write access to the `bmad/agents/dev_db.json` file and access to environment variables (optional).

Example:

```bash
deno test bmad/agents/tests --allow-read --allow-write --allow-env
```

Notes:

- Tests use the local supabase stub (`bmad/agents/supabase_client_stub.ts`) and `dev_db.ts` (file-backed JSON).
- If `dev_db.json` does not exist, tests will create it.
