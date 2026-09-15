import { test, expect } from "@playwright/test";

test.describe("Landing Page Accessibility & Micro-UX", () => {
  test("mobile menu toggle updates aria-expanded attribute", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/home.html");

    const menuBtn = page.locator(".mobile-menu-btn");
    await expect(menuBtn).toBeVisible();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");

    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "true");

    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
  });

  test("service modal has dialog attributes, manages focus, and closes on Escape", async ({ page }) => {
    await page.goto("/home.html");

    const modal = page.locator("#service-modal");
    await expect(modal).toHaveAttribute("role", "dialog");
    await expect(modal).toHaveAttribute("aria-modal", "true");
    await expect(modal).toHaveAttribute("aria-labelledby", "modal-service-title");

    const closeBtn = page.locator("#service-modal .modal-close");
    await expect(closeBtn).toHaveAttribute("aria-label", "Close");

    // Click service card to trigger modal
    const serviceCard = page.locator(".service-card").first();
    await serviceCard.click();

    // Verify modal becomes visible and focus is moved to first input
    await expect(modal).toBeVisible();
    const firstInput = page.locator("#firstName");
    await expect(firstInput).toBeFocused();

    // Press Escape key to dismiss modal
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
  });
});
