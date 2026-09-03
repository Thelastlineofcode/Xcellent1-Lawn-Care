import { expect, test } from "@playwright/test";

test.describe("Modal & Mobile Navigation Accessibility", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/home.html`);
  });

  test("Mobile menu button has proper ARIA attributes and toggles aria-expanded", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const menuBtn = page.locator(".mobile-menu-btn");
    await expect(menuBtn).toBeVisible();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
    await expect(menuBtn).toHaveAttribute("aria-controls", "navbar-links");

    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "true");

    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
  });

  test("Service modal has required dialog accessibility attributes", async ({ page }) => {
    const modal = page.locator("#service-modal");
    await expect(modal).toHaveAttribute("role", "dialog");
    await expect(modal).toHaveAttribute("aria-modal", "true");
    await expect(modal).toHaveAttribute("aria-labelledby", "modal-service-title");

    const closeBtn = page.locator(".modal-close");
    await expect(closeBtn).toHaveAttribute("aria-label", "Close");
  });

  test("Service card triggers modal via keyboard and manages focus lifecycle", async ({ page }) => {
    const firstCard = page.locator(".service-card").first();
    await firstCard.focus();
    await expect(firstCard).toBeFocused();

    // Trigger opening via Enter key
    await page.keyboard.press("Enter");

    const modal = page.locator("#service-modal");
    await expect(modal).toBeVisible();

    // Verify focus moved to the first input element
    const firstNameInput = page.locator("#firstName");
    await expect(firstNameInput).toBeFocused();

    // Press Escape to close modal
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();

    // Verify focus is restored to the triggering service card
    await expect(firstCard).toBeFocused();
  });
});
