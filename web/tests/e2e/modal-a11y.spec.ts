import { test, expect } from "@playwright/test";

test.describe("Modal and Navigation Accessibility E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/home.html");
  });

  test("Service modal dialog has correct ARIA attributes and close button label", async ({ page }) => {
    const modal = page.locator("#service-modal");
    await expect(modal).toHaveAttribute("role", "dialog");
    await expect(modal).toHaveAttribute("aria-modal", "true");
    await expect(modal).toHaveAttribute("aria-labelledby", "modal-service-title");

    const closeBtn = modal.locator(".modal-close");
    await expect(closeBtn).toHaveAttribute("aria-label", "Close");
  });

  test("Service card is keyboard navigable, manages focus on open/close, and handles Escape key", async ({ page }) => {
    const firstCard = page.locator(".service-card").first();
    await expect(firstCard).toHaveAttribute("role", "button");
    await expect(firstCard).toHaveAttribute("tabindex", "0");

    // Focus service card and press Enter to open modal
    await firstCard.focus();
    await page.keyboard.press("Enter");

    const modal = page.locator("#service-modal");
    await expect(modal).toBeVisible();

    // Verify first visible input gets focus automatically
    const firstInput = page.locator("#firstName");
    await expect(firstInput).toBeFocused();

    // Press Escape to close modal and verify focus returns to trigger card
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
    await expect(firstCard).toBeFocused();
  });

  test("Mobile menu button toggles aria-expanded attribute", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    const menuBtn = page.locator(".mobile-menu-btn");
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");

    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "true");

    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
  });
});
