## 2025-05-15 - Improving Accessibility on Static Landing Pages
**Learning:** In static HTML projects using non-semantic divs for interactive components (like service cards or custom menus), accessibility must be explicitly grafted on via ARIA roles, tabindex, and key listeners to ensure parity with mouse-based interaction.
**Action:** Always check for `onclick` handlers on non-button elements and supplement them with `role="button"`, `tabindex="0"`, and `keydown` listeners for 'Enter' and 'Space'.
