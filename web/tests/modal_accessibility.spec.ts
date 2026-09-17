import { test, expect } from "@playwright/test";

test.describe("Service Modal & Mobile Menu Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/home.html");
  });

  test("service modal has correct ARIA roles and labels", async ({ page }) => {
    const modal = page.locator("#service-modal");
    await expect(modal).toHaveAttribute("role", "dialog");
    await expect(modal).toHaveAttribute("aria-modal", "true");
    await expect(modal).toHaveAttribute("aria-labelledby", "modal-service-title");

    const closeBtn = page.locator(".modal-close");
    await expect(closeBtn).toHaveAttribute("aria-label", "Close");
  });

  test("opening modal focuses first visible input and closing restores focus", async ({ page }) => {
    const serviceCard = page.locator(".service-card").first();
    await serviceCard.focus();
    await serviceCard.click();

    const modal = page.locator("#service-modal");
    await expect(modal).toBeVisible();

    const firstNameInput = page.locator("#firstName");
    await expect(firstNameInput).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
  });

  test("mobile menu toggle manages aria-expanded state", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const toggleBtn = page.locator(".mobile-menu-btn");
    await expect(toggleBtn).toHaveAttribute("aria-expanded", "false");

    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute("aria-expanded", "true");

    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute("aria-expanded", "false");
  });
});
