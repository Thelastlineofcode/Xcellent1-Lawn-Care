## 2026-07-11 - Modal Focus Lifecycle and Screen Reader Accessibility
**Learning:** Modals in vanilla static sites require programmatic focus restoration (saving `document.activeElement` before display) and explicit `role="dialog"`, `aria-modal="true"`, and `aria-label="Close"` attributes for screen readers and keyboard accessibility.
**Action:** Always capture trigger element reference when opening custom HTML modals, auto-focus the first visible field, listen for `Escape` key events, and restore trigger focus on modal close.
