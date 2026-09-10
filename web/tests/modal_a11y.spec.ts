import { test, expect } from "@playwright/test";

test.describe("Mobile Menu and Service Modal Accessibility", () => {
  test("mobile menu button toggles aria-expanded attribute", async ({ page }) => {
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

  test("service card keyboard activation and modal focus lifecycle", async ({ page }) => {
    await page.goto("/home.html");

    const firstCard = page.locator(".service-card").first();
    await expect(firstCard).toHaveAttribute("tabindex", "0");
    await expect(firstCard).toHaveAttribute("role", "button");

    await firstCard.focus();
    await page.keyboard.press("Enter");

    const modal = page.locator("#service-modal");
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute("role", "dialog");
    await expect(modal).toHaveAttribute("aria-modal", "true");
    await expect(modal).toHaveAttribute("aria-labelledby", "modal-service-title");

    const closeBtn = page.locator(".modal-close");
    await expect(closeBtn).toHaveAttribute("aria-label", "Close modal");

    const firstInput = page.locator("#firstName");
    await expect(firstInput).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
    await expect(firstCard).toBeFocused();
  });
});
