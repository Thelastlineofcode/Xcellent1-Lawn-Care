import { test, expect } from "@playwright/test";

test.describe("UX and Accessibility Enhancements", () => {
  test("mobile menu toggles aria-expanded attribute", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/home.html");

    const menuBtn = page.locator(".mobile-menu-btn");
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
    await expect(menuBtn).toHaveAttribute("aria-controls", "navbar-links");

    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "true");

    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
  });

  test("service modal has dialog role, aria attributes, close button label, and closes on Escape", async ({ page }) => {
    await page.goto("/home.html");

    const modal = page.locator("#service-modal");
    await expect(modal).toHaveAttribute("role", "dialog");
    await expect(modal).toHaveAttribute("aria-modal", "true");
    await expect(modal).toHaveAttribute("aria-labelledby", "modal-service-title");

    const closeBtn = modal.locator(".modal-close");
    await expect(closeBtn).toHaveAttribute("aria-label", "Close");

    // Open modal via service card click
    const serviceCard = page.locator(".service-card").first();
    await serviceCard.click();
    await expect(modal).toBeVisible();

    // Press Escape key
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
  });
});
