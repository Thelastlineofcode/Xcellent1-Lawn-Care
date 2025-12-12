// Owner E2E flow tests
// Requires environment variables:
// SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, TEST_BASE_URL

import { assertEquals, assert } from "https://deno.land/std@0.203.0/testing/asserts.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const BASE_URL = Deno.env.get("TEST_BASE_URL") || "http://localhost:8000";

function skipIfMissingEnv() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
    console.warn("Skipping owner E2E tests - missing SUPABASE_* env vars");
    return true;
  }
  return false;
}

async function createTestOwner() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: "test@xcellent1.com", password: "Test123!@#", email_confirm: true }),
  });
  return res;
}

async function signInOwner() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: "test@xcellent1.com", password: "Test123!@#" }),
  });
  return res.json();
}

Deno.test("Owner E2E: login and access metrics", { permissions: { net: true } }, async () => {
  if (skipIfMissingEnv()) return;

  // Create test owner via admin API
  await createTestOwner();

  const tokenRes = await signInOwner();
  assert(tokenRes.access_token, "Got access token");
  const token = tokenRes.access_token;

  // Call metrics endpoint
  const metricsRes = await fetch(`${BASE_URL}/api/owner/metrics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assertEquals(metricsRes.status, 200);
  const metrics = await metricsRes.json();
  assertEquals(metrics.ok, true);
  assert(metrics.owner && metrics.owner.includes("test@xcellent1.com"));
});

// Owner ability to create a client and then read it
Deno.test("Owner E2E: create and fetch clients", { permissions: { net: true } }, async () => {
  if (skipIfMissingEnv()) return;
  const tokenObj = await signInOwner();
  const token = tokenObj.access_token;

  // Create client
  const clientBody = { name: "E2E Client", email: "client+e2e@example.com", property_address: "100 Test Ave" };
  const createRes = await fetch(`${BASE_URL}/api/owner/clients`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(clientBody),
  });
  assertEquals(createRes.status, 200);
  const json = await createRes.json();
  assertEquals(json.ok, true);
  const created = json.client;
  assert(created.id || created[0]?.id, "Client created id returned");

  // List clients
  const listRes = await fetch(`${BASE_URL}/api/owner/clients`, { headers: { Authorization: `Bearer ${token}` } });
  assertEquals(listRes.status, 200);
  const listJson = await listRes.json();
  assertEquals(listJson.ok, true);
  assert(listJson.clients && listJson.clients.length >= 1);
});

Deno.test("Owner E2E: create and update job", { permissions: { net: true } }, async () => {
  if (skipIfMissingEnv()) return;
  const tokenObj = await signInOwner();
  const token = tokenObj.access_token;
  const jobBody = { client_id: null, scheduled_date: new Date().toISOString().split('T')[0], services: ['mowing'], notes: 'E2E job' };
  // create job
  const createRes = await fetch(`${BASE_URL}/api/owner/jobs`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(jobBody)
  });
  const cr = await createRes.json();
  assertEquals(createRes.status, 200);
  assertEquals(cr.ok, true);
  const created = cr.job;
  const id = created.id || created[0]?.id;
  assert(id, 'job id returned');

  // update job
  const patchRes = await fetch(`${BASE_URL}/api/owner/jobs/${id}`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ notes: 'updated' })
  });
  const pr = await patchRes.json();
  assertEquals(patchRes.status, 200);
  assertEquals(pr.ok, true);
});

Deno.test("Owner E2E: list and patch applications", { permissions: { net: true } }, async () => {
  if (skipIfMissingEnv()) return;
  const tokenObj = await signInOwner();
  const token = tokenObj.access_token;
  const listRes = await fetch(`${BASE_URL}/api/owner/applications`, { headers: { Authorization: `Bearer ${token}` } });
  assertEquals(listRes.status, 200);
  const listJson = await listRes.json();
  assertEquals(listJson.ok, true);

  // If there are applications, attempt to update the first
  const apps = listJson.applications || [];
  if (apps.length > 0) {
    const id = apps[0].id;
    const patchRes = await fetch(`${BASE_URL}/api/owner/applications/${id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'hired' }) });
    assertEquals(patchRes.status, 200);
    const pj = await patchRes.json();
    assertEquals(pj.ok, true);
  }
});

Deno.test("Owner E2E: create and manage waitlist items", { permissions: { net: true } }, async () => {
  if (skipIfMissingEnv()) return;
  const tokenObj = await signInOwner();
  const token = tokenObj.access_token;
  const itemBody = { name: 'Waitlist E2E', email: 'waitlist+e2e@example.com', preferred_service_plan: 'weekly' };
  const createRes = await fetch(`${BASE_URL}/api/owner/waitlist`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(itemBody) });
  const cr = await createRes.json();
  assertEquals(createRes.status, 200);
  assertEquals(cr.ok, true);
  const created = cr.waitlist_item;
  const id = created.id || created[0]?.id;
  assert(id, 'waitlist item id returned');

  // update status
  const patchRes = await fetch(`${BASE_URL}/api/owner/waitlist/${id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'contacted' }) });
  const pj = await patchRes.json();
  assertEquals(patchRes.status, 200);
  assertEquals(pj.ok, true);
});

