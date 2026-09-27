import { test, expect } from "@playwright/test";

test("service inquiry modal has proper ARIA attributes, close aria-label, and closes on Escape key", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:8000/home.html");

  // Click a service card to open modal
  await page.locator(".service-card", { hasText: "Weekly Lawn Maintenance" }).click();

  // Verify modal is visible
  const modal = page.locator("#service-modal");
  await expect(modal).toBeVisible();

  // Verify ARIA attributes
  await expect(modal).toHaveAttribute("role", "dialog");
  await expect(modal).toHaveAttribute("aria-modal", "true");
  await expect(modal).toHaveAttribute("aria-labelledby", "modal-service-title");

  // Verify close button aria-label
  const closeBtn = page.locator(".modal-close");
  await expect(closeBtn).toHaveAttribute("aria-label", "Close");

  // Press Escape key to close modal
  await page.keyboard.press("Escape");
  await expect(modal).not.toBeVisible();
});
