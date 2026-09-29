import { test, expect } from "@playwright/test";

test.describe("Modal and Mobile Menu Accessibility", () => {
  test("Service modal has proper ARIA attributes and focus lifecycle", async ({ page }) => {
    await page.goto("http://127.0.0.1:8000/home.html");

    const modal = page.locator("#service-modal");
    await expect(modal).toHaveAttribute("role", "dialog");
    await expect(modal).toHaveAttribute("aria-modal", "true");
    await expect(modal).toHaveAttribute("aria-labelledby", "modal-service-title");

    const closeBtn = page.locator("#service-modal .modal-close");
    await expect(closeBtn).toHaveAttribute("aria-label", "Close");

    const serviceCard = page.locator(".service-card").first();
    await serviceCard.click();

    await expect(modal).toBeVisible();
    await expect(page.locator("#firstName")).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
  });

  test("Mobile menu toggle has proper aria-expanded state", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("http://127.0.0.1:8000/home.html");

    const menuBtn = page.locator(".mobile-menu-btn");
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
    await expect(menuBtn).toHaveAttribute("aria-controls", "navbar-links");

    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "true");

    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
  });
});
