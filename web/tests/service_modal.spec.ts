import { test, expect } from "@playwright/test";

test.describe("Service Modal Accessibility and Focus Lifecycle", () => {
  test("modal opens, receives proper ARIA attributes, focuses first field, and closes on Escape", async ({ page }) => {
    await page.goto("/home.html");

    // Modal should be hidden initially
    const modal = page.locator("#service-modal");
    await expect(modal).not.toBeVisible();

    // Trigger modal opening
    await page.evaluate(() => {
      // @ts-ignore
      openServiceModal("Mowing & Edging");
    });

    // Check modal visibility and ARIA attributes
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute("role", "dialog");
    await expect(modal).toHaveAttribute("aria-modal", "true");
    await expect(modal).toHaveAttribute("aria-labelledby", "modal-service-title");

    // Close button aria-label
    const closeBtn = page.locator(".modal-close");
    await expect(closeBtn).toHaveAttribute("aria-label", "Close");

    // First visible input field should be focused
    const firstInput = page.locator("#firstName");
    await expect(firstInput).toBeFocused();

    // Take screenshot of open modal
    await page.screenshot({ path: "screenshots/service_modal_open.png" });

    // Press Escape to close modal
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
  });
});
