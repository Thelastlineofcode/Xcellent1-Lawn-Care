import { assertEquals, assert, assertExists } from "https://deno.land/std@0.203.0/testing/asserts.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const BASE_URL = Deno.env.get("TEST_BASE_URL") || "http://localhost:8000";

function skipIfMissingEnv() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.warn("Skipping owner invitation tests - missing SUPABASE_* env vars");
    return true;
  }
  return false;
}

// Helper: create invitation row via Supabase REST API (service role)
async function createInvitation(email: string, name: string) {
  const token = `invite-${crypto.getRandomValues(new Uint8Array(12)).reduce((acc, v) => acc + v.toString(16).padStart(2, '0'), '')}`;
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/owner_invitations`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify([{ email, name, invitation_token: token, status: 'pending', expires_at: expiresAt }]),
  });
  const json = await res.json();
  return { res, json, token };
}

Deno.test("Owner invitation accept flow works", { permissions: { net: true } }, async () => {
  if (skipIfMissingEnv()) return;

  const email = `invite+${Date.now()}@xcellent1.com`;
  const name = "Invite Test";

  // Create invitation
  const { res: createRes, json, token } = await createInvitation(email, name);
  assertEquals(createRes.status, 201);
  assert(Array.isArray(json), 'Supabase returned array');
  assertEquals(json[0].email, email);

  // Validate token via server
  const validateRes = await fetch(`${BASE_URL}/api/owner/invite/${token}`);
  assertEquals(validateRes.status, 200);
  const vjson = await validateRes.json();
  assertEquals(vjson.ok, true);
  assertEquals(vjson.email, email);

  // Accept invitation (create auth user)
  const acceptRes = await fetch(`${BASE_URL}/api/owner/invite/${token}/accept`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'Inv1t3Pass!', password_confirm: 'Inv1t3Pass!' })
  });
  const aj = await acceptRes.json();
  assertEquals(acceptRes.status, 201);
  assertEquals(aj.ok, true);
  assertExists(aj.user_id);
});
