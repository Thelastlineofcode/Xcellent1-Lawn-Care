import { test, expect } from "@playwright/test";

test.describe("Mobile menu and modal accessibility", () => {
  test("mobile menu toggle updates aria-expanded correctly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/home.html");

    const menuBtn = page.locator(".mobile-menu-btn");
    await expect(menuBtn).toBeVisible();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
    await expect(menuBtn).toHaveAttribute("aria-controls", "navbar-links");

    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "true");

    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
  });

  test("service modal close button has aria-label='Close'", async ({ page }) => {
    await page.goto("/home.html");

    const closeBtn = page.locator("#service-modal .modal-close");
    await expect(closeBtn).toHaveAttribute("aria-label", "Close");
  });
});
