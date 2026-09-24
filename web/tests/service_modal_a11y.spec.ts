import { test, expect } from "@playwright/test";

test.describe("Service Cards and Modal Accessibility", () => {
  test("Service card keyboard navigation and modal focus lifecycle", async ({ page }) => {
    await page.goto("/home.html");

    const firstCard = page.locator(".service-card").first();
    await expect(firstCard).toHaveAttribute("role", "button");
    await expect(firstCard).toHaveAttribute("tabindex", "0");

    await firstCard.focus();
    await page.keyboard.press("Enter");

    const modal = page.locator("#service-modal");
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute("role", "dialog");
    await expect(modal).toHaveAttribute("aria-modal", "true");

    const firstInput = modal.locator("#firstName");
    await expect(firstInput).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
    await expect(firstCard).toBeFocused();
  });
});
