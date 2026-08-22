## 2025-05-18 - Modal Focus Lifecycle and ARIA Roles

**Learning:** Service modals built with custom HTML/JS often lack essential accessibility features like ARIA dialog attributes (`role="dialog"`, `aria-modal="true"`), focus management, and keydown listeners for Escape dismissal. Restoring focus to the triggering element on close and auto-focusing the first input on open significantly improves keyboard and screen-reader usability.

**Action:** Whenever creating or refactoring modals, ensure proper ARIA labeling (`aria-labelledby`, `aria-label="Close"`), capture `document.activeElement` on open to restore focus on close, auto-focus the first interactive element, and add global `Escape` key handling.
