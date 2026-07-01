## 2025-05-22 - [Accessibility for Non-Semantic Interactive Elements]
**Learning:** In this codebase, many interactive components (like service cards) are implemented using `div` elements with `onclick` handlers. These are invisible to screen readers as buttons and unreachable via keyboard by default.
**Action:** Always add `role="button"`, `tabindex="0"`, and `keydown` listeners (Enter/Space) to these elements. Ensure focus management is implemented for any resulting modals to return the user to their previous context.
