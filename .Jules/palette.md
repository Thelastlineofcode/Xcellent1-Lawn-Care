## 2025-05-18 - Modal Focus Lifecycle & ARIA Roles

**Learning:** Service inquiry modals on landing pages require explicit ARIA dialog roles (`role="dialog"`, `aria-modal="true"`), explicit `aria-label="Close"` on entity close buttons, and focus management (capturing `document.activeElement`, setting initial focus to the first form field on open, restoring focus on close, and handling Escape key listeners).
**Action:** When updating modals, ensure focus lifecycle and ARIA dialog properties are wired up and tested on both `home.html` and `index.html`.
