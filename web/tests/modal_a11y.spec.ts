import { test, expect } from "@playwright/test";

test.describe("Modal & Mobile Navigation Accessibility", () => {
  test("Service modal has proper ARIA attributes, focus capture, and Escape key handling", async ({ page }) => {
    await page.goto("/home.html");

    const modal = page.locator("#service-modal");
    await expect(modal).toHaveAttribute("role", "dialog");
    await expect(modal).toHaveAttribute("aria-modal", "true");
    await expect(modal).toHaveAttribute("aria-labelledby", "modal-service-title");

    const closeBtn = page.locator(".modal-close");
    await expect(closeBtn).toHaveAttribute("aria-label", "Close");

    // Click first service card to trigger modal
    const serviceCard = page.locator(".service-card").first();
    await serviceCard.click();

    await expect(modal).toBeVisible();

    // Verify focus moved to the first input
    const firstNameInput = page.locator("#firstName");
    await expect(firstNameInput).toBeFocused();

    // Press Escape to close modal and verify focus restoration
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
  });

  test("Mobile menu button has aria-expanded toggling", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/home.html");

    const menuBtn = page.locator(".mobile-menu-btn");
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");

    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "true");

    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
  });
});
