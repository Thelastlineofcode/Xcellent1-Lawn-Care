import { expect, test } from "@playwright/test";

test("Mobile menu button toggles aria-expanded attribute on mobile viewport", async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${baseURL}/home.html`);

  const menuBtn = page.locator(".mobile-menu-btn");
  await expect(menuBtn).toBeVisible();
  await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
  await expect(menuBtn).toHaveAttribute("aria-controls", "navbar-links");

  await menuBtn.click();
  await expect(menuBtn).toHaveAttribute("aria-expanded", "true");

  await menuBtn.click();
  await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
});
