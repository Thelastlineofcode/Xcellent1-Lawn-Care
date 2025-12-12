import { assertEquals, assert } from "https://deno.land/std@0.203.0/testing/asserts.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const BASE_URL = Deno.env.get("TEST_BASE_URL") || "http://localhost:8000";

function skipIfMissingEnv() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
    console.warn("Skipping owner payment accounts tests - missing SUPABASE_* env vars");
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
    body: JSON.stringify({ email: "paytest@xcellent1.com", password: "PayTest123!", email_confirm: true }),
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
    body: JSON.stringify({ email: "paytest@xcellent1.com", password: "PayTest123!" }),
  });
  return res.json();
}

Deno.test("Owner can add and list payment accounts", { permissions: { net: true } }, async () => {
  if (skipIfMissingEnv()) return;

  await createTestOwner();
  const tokenObj = await signInOwner();
  assert(tokenObj.access_token, "Got access token");
  const token = tokenObj.access_token;

  // create payment accounts for various methods
  const methods = [
    { payment_method: 'paypal', account_identifier: 'owner+pay@example.com', account_name: 'PayPal Business' },
    { payment_method: 'venmo', account_identifier: 'venmoUser', account_name: 'Venmo Personal' },
    { payment_method: 'zelle', account_identifier: 'zelle@example.com', account_name: 'Zelle Business' },
  ];

  for (const m of methods) {
    const createRes = await fetch(`${BASE_URL}/api/owner/payment-accounts`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...m, is_primary: m.payment_method === 'paypal' })
    });
    assertEquals(createRes.status, 201);
    const cr = await createRes.json();
    assertEquals(cr.ok, true);
  }
  const createRes = await fetch(`${BASE_URL}/api/owner/payment-accounts`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(accountBody)
  });
  assertEquals(createRes.status, 201);
  const cr = await createRes.json();
  assertEquals(cr.ok, true);
  const account = cr.account;
  assert(account.id || account[0]?.id, 'payment account id returned');

  // list accounts
  const listRes = await fetch(`${BASE_URL}/api/owner/payment-accounts`, { headers: { Authorization: `Bearer ${token}` } });
  assertEquals(listRes.status, 200);
  const listJson = await listRes.json();
  assertEquals(listJson.ok, true);
  assert(Array.isArray(listJson.accounts), 'accounts list exists');
});
