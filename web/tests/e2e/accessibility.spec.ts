import { expect, test } from "@playwright/test";
import path from "node:path";

const homeHtmlPath = `file://${path.resolve("web/static/home.html")}`;

test("Home page accessibility enhancements are correct", async ({ page }) => {
  // Set to mobile viewport size so the mobile menu button is visible
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(homeHtmlPath);

  // 1. Mobile menu button check
  const mobileMenuBtn = page.locator(".mobile-menu-btn");
  await expect(mobileMenuBtn).toBeVisible();
  await expect(mobileMenuBtn).toHaveAttribute("aria-expanded", "false");

  // Toggle mobile menu and verify updated attribute
  await mobileMenuBtn.click();
  await expect(mobileMenuBtn).toHaveAttribute("aria-expanded", "true");

  // 2. Service card focusability and roles
  const serviceCards = page.locator(".service-card");
  const count = await serviceCards.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const card = serviceCards.nth(i);
    await expect(card).toHaveAttribute("role", "button");
    await expect(card).toHaveAttribute("tabindex", "0");
  }

  // 3. Service inquiry modal accessibility attributes
  const modal = page.locator("#service-modal");
  await expect(modal).toHaveAttribute("role", "dialog");
  await expect(modal).toHaveAttribute("aria-modal", "true");
  await expect(modal).toHaveAttribute("aria-labelledby", "modal-service-title");

  // 4. Modal close button accessibility label
  const closeBtn = modal.locator(".modal-close");
  await expect(closeBtn).toHaveAttribute("aria-label", "Close");
});
