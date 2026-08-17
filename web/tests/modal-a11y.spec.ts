import { test, expect } from "@playwright/test";

test("Modal accessibility and focus management", async ({ page }) => {
  await page.goto("/home.html");

  // Verify modal attributes before opening
  const modal = page.locator("#service-modal");
  await expect(modal).toHaveAttribute("role", "dialog");
  await expect(modal).toHaveAttribute("aria-modal", "true");
  await expect(modal).toHaveAttribute("aria-labelledby", "modal-service-title");

  // Verify close button aria-label
  const closeBtn = page.locator("#service-modal .modal-close");
  await expect(closeBtn).toHaveAttribute("aria-label", "Close");

  // Click on a service card to open modal
  const serviceCard = page.locator(".service-card", { hasText: "Weekly Lawn Maintenance" });
  await serviceCard.click();
  await expect(modal).toBeVisible();

  // Check focus moved to firstName input
  await page.waitForTimeout(100);
  const firstName = page.locator("#firstName");
  await expect(firstName).toBeFocused();

  // Test Escape key closes modal
  await page.keyboard.press("Escape");
  await expect(modal).toBeHidden();
});
