## 2026-09-28 - Mobile Navigation Menu Toggle ARIA State

**Learning:** Mobile menu toggle buttons that control collapsible navigation menus must explicitly include `aria-expanded` attributes on the trigger element, and this attribute must be dynamically updated to `"true"` or `"false"` in the click handlers for both opening/closing the menu and selecting internal navigation links.
**Action:** Always initialize mobile menu button elements with `aria-expanded="false"` and update the attribute state programmatically in JavaScript when toggling the active class or closing the drawer on link navigation.
