import { expect, test } from "@playwright/test";
import path from "node:path";

test.describe("Mobile menu and modal accessibility", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("home.html mobile menu button has ARIA attributes and toggles correctly", async ({ page }) => {
    const filePath = `file://${path.resolve("web/static/home.html")}`;
    await page.goto(filePath);

    const btn = page.locator(".mobile-menu-btn");
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute("aria-expanded", "false");
    await expect(btn).toHaveAttribute("aria-controls", "navbar-links");

    await btn.click();
    await expect(btn).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#navbar-links")).toHaveClass(/active/);

    await btn.click();
    await expect(btn).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#navbar-links")).not.toHaveClass(/active/);
  });

  test("home.html modal dialog has proper accessibility attributes", async ({ page }) => {
    const filePath = `file://${path.resolve("web/static/home.html")}`;
    await page.goto(filePath);

    const modal = page.locator("#service-modal");
    await expect(modal).toHaveAttribute("role", "dialog");
    await expect(modal).toHaveAttribute("aria-modal", "true");
    await expect(modal).toHaveAttribute("aria-labelledby", "modal-service-title");

    const closeBtn = modal.locator(".modal-close");
    await expect(closeBtn).toHaveAttribute("aria-label", "Close");
  });
});
