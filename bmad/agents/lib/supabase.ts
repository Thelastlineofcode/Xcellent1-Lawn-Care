// Lightweight Supabase helper for Deno agents.
// Uses REST (PostgREST) endpoints. Falls back to local stub if SUPABASE_URL or SERVICE_ROLE_KEY not set.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SUPABASE_KEY") ||
  "";

function hasRealSupabase() {
  return !!SUPABASE_URL && !!SERVICE_ROLE_KEY;
}

function headers() {
  return {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function post(table: string, row: Record<string, any>) {
  if (!hasRealSupabase()) {
    const stub = await import("../supabase_client_stub.ts");
    if (table === "leads") return stub.insertLead(row);
    if (table === "events_outbox") return stub.insertOutboxEvent(row);
    if (table === "invoices") return stub.createInvoice(row);
    return { id: `stub_${Date.now()}` };
  }
  const url = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase POST ${table} failed: ${res.status} ${text}`);
  }
  const json = await res.json().catch(() => null);
  // PostgREST can return inserted representation if Prefer header used; otherwise return a generated id
  return Array.isArray(json) && json[0]
    ? json[0]
    : { id: `remote_${Date.now()}` };
}

async function getLeadById(id: string) {
  if (!hasRealSupabase()) return null;
  const url = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/leads?id=eq.${encodeURIComponent(id)}&select=*`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) return null;
  const json = await res.json();
  return Array.isArray(json) && json.length ? json[0] : null;
}

async function fetchPendingOutbox(now = new Date()) {
  if (!hasRealSupabase()) {
    const stub = await import("../supabase_client_stub.ts");
    return stub.fetchPendingOutbox(now);
  }
  // fetch events where status = pending and (next_attempt_at <= now OR next_attempt_at is null)
  const time = now.toISOString();
  const url = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/events_outbox?status=eq.pending&or=(next_attempt_at.lte.${encodeURIComponent(time)},next_attempt_at.is.null)&select=*`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) return [];
  return await res.json();
}

async function updateOutboxEvent(id: string, patch: Record<string, any>) {
  if (!hasRealSupabase()) {
    const stub = await import("../supabase_client_stub.ts");
    return stub.updateOutboxEvent(id, patch);
  }
  const url = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/events_outbox?id=eq.${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Supabase PATCH events_outbox failed: ${res.status} ${text}`
    );
  }
  return await res.json().catch(() => ({ id }));
}

export {
  post as supabaseInsert,
  getLeadById,
  fetchPendingOutbox,
  updateOutboxEvent,
  hasRealSupabase,
};
