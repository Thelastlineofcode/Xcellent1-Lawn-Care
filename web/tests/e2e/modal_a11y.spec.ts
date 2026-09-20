import { test, expect } from "@playwright/test";
import * as path from "path";

test.describe("Landing page modal and menu accessibility", () => {
  test.beforeEach(async ({ page }) => {
    const filePath = path.resolve(process.cwd(), "web/static/home.html");
    await page.goto(`file://${filePath}`);
  });

  test("Mobile menu button toggles aria-expanded attribute", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const menuBtn = page.locator(".mobile-menu-btn");
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");

    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "true");

    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
  });

  test("Service cards open modal and manage focus lifecycle", async ({ page }) => {
    const modal = page.locator("#service-modal");
    await expect(modal).toHaveAttribute("role", "dialog");
    await expect(modal).toHaveAttribute("aria-modal", "true");
    await expect(modal).toHaveAttribute("aria-labelledby", "modal-service-title");

    const closeBtn = page.locator(".modal-close");
    await expect(closeBtn).toHaveAttribute("aria-label", "Close");

    const serviceCard = page.locator(".service-card").first();
    await expect(serviceCard).toHaveAttribute("role", "button");
    await expect(serviceCard).toHaveAttribute("tabindex", "0");

    await serviceCard.focus();
    await page.keyboard.press("Enter");

    await expect(modal).toBeVisible();

    const firstNameInput = page.locator("#firstName");
    await expect(firstNameInput).toBeFocused();

    await page.keyboard.press("Escape");

    await expect(modal).not.toBeVisible();
    await expect(serviceCard).toBeFocused();
  });
});
