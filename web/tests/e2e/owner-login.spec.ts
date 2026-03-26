import { expect, test } from "@playwright/test";
import process from "node:process";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

test.beforeAll(async () => {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    test.skip("Supabase env not provided; skipping owner E2E setup");
    return;
  }

  // Create a test owner account using Supabase admin API
  try {
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "e2e-owner@example.com",
        password: "E2Epass123!",
        email_confirm: true,
      }),
    });
  } catch (e) {
    // ignore; user may already exist
    console.log("create owner error", e.message || e);
  }
});

test("Owner can login via UI and reach dashboard", async ({ page, baseURL }) => {
  // Navigate to login page
  await page.goto(`${baseURL}/static/login.html`);
  await expect(page.locator("#login-form")).toBeVisible();

  // Fill in login form
  await page.fill("#email", "e2e-owner@example.com");
  await page.fill("#password", "E2Epass123!");
  await page.click("#login-btn");

  // Wait for redirect to owner dashboard page
  await page.waitForURL("**/static/owner.html");
  await expect(page).toHaveURL(/owner.html$/);

  // Verify dashboard element(s)
  await expect(page.locator("#kpi-revenue")).toBeVisible();
  await expect(page.locator("#action-manage-apps")).toBeVisible();
});
