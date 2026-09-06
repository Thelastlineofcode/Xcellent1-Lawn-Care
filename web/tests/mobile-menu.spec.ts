import { test, expect } from "@playwright/test";

test.describe("Mobile Menu ARIA Expanded State", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  const pages = [
    { name: "Home", path: "/home.html" },
    { name: "Index", path: "/index.html" },
    { name: "About", path: "/about.html" },
    { name: "Services", path: "/services.html" },
    { name: "Contact", path: "/contact.html" },
  ];

  for (const p of pages) {
    test(`mobile menu aria-expanded toggles correctly on ${p.name} page`, async ({ page }) => {
      await page.goto(p.path);

      const menuBtn = page.locator(".mobile-menu-btn");
      await expect(menuBtn).toBeVisible();
      await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
      await expect(menuBtn).toHaveAttribute("aria-controls", "navbar-links");

      // Open mobile menu
      await menuBtn.click();
      await expect(menuBtn).toHaveAttribute("aria-expanded", "true");

      // Close mobile menu by clicking button again
      await menuBtn.click();
      await expect(menuBtn).toHaveAttribute("aria-expanded", "false");

      // Open menu and click a navbar link
      await menuBtn.click();
      await expect(menuBtn).toHaveAttribute("aria-expanded", "true");
      const navLink = page.locator("#navbar-links .navbar-link").first();
      await navLink.click();
      await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
    });
  }
});
