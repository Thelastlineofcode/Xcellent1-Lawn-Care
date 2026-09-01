## 2025-09-01 - Mobile Menu Toggle ARIA Accessibility

**Learning:** Mobile menu toggle buttons require `aria-expanded` and `aria-controls` attributes that update dynamically in JavaScript when the menu toggles or closes, enabling screen readers to communicate navigation state changes correctly.
**Action:** Always ensure disclosure buttons (like mobile hamburger menus) include `aria-expanded` (initialized to `"false"`) and `aria-controls`, and programmatically update `aria-expanded` during state changes.
