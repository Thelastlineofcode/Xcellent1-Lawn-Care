## 2026-08-26 - Programmatic Mobile Menu ARIA State Management
**Learning:** Mobile navigation toggle buttons require `aria-expanded` and `aria-controls` attributes, and their state must be kept in sync dynamically via JS whenever the menu is opened, closed, or a navigation link is clicked.
**Action:** Always include `aria-expanded` and `aria-controls` on mobile menu toggle buttons, and update `aria-expanded` in all JS toggle and link click listeners.
