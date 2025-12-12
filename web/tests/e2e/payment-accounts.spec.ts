import { expect, test } from "@playwright/test";
import process from "node:process";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

test.beforeAll(async () => {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    test.skip("Supabase env not provided; skipping payment accounts E2E setup");
    return;
  }

  try {
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "e2e-payments@example.com",
        password: "E2EPay123!",
        email_confirm: true,
      }),
    });
  } catch (e) {
    console.log("create owner error", e.message || e);
  }
});

test("Owner can connect multiple payment accounts in UI", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/static/login.html`);
  await expect(page.locator("#login-form")).toBeVisible();
  await page.fill("#email", "e2e-payments@example.com");
  await page.fill("#password", "E2EPay123!");
  await page.click("#login-btn");
  await page.waitForURL("**/static/owner.html");

  await page.goto(`${baseURL}/static/payment-accounts.html`);
  await expect(page.locator("#accounts-grid")).toBeVisible();

  const methods = [
    { method: "paypal", id: "owner+pay@example.com" },
    { method: "venmo", id: "@venmoUser" },
    { method: "zelle", id: "zelle+e2e@example.com" },
  ];

  for (const m of methods) {
    await page.click('button:has-text("+ Connect Payment Account")');
    await expect(page.locator("#account-modal")).toBeVisible();
    await page.selectOption("#payment-method-select", m.method);
    await page.fill("#account-identifier", m.id);
    await page.fill("#account-name", `E2E ${m.method}`);
    if (m.method === "paypal") await page.check("#set-primary");
    await page.click('#account-form button[type="submit"]');
    await page.waitForSelector("#account-modal", { state: "hidden" });
    await page.waitForTimeout(250);
    const text = await page.locator("#accounts-grid").innerText();
    expect(text).toContain(m.id.replace("@", ""));
  }
});
