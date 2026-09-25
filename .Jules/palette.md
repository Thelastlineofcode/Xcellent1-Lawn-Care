## 2025-09-25 - Mobile Navigation & Modal Dialog Accessibility Attributes

**Learning:** Mobile navigation toggles and modal overlays require standard ARIA attributes (`aria-expanded`, `aria-controls`, `role="dialog"`, `aria-modal="true"`, `aria-label="Close"`) so screen reader users can accurately perceive state changes and identify dialog overlays.
**Action:** Always complement DOM element state toggles (like `.classList.toggle('active')`) with corresponding ARIA attribute updates (`setAttribute('aria-expanded', ...)`), and ensure modal dialog containers include full ARIA roles and labels across both `home.html` and `index.html`.
