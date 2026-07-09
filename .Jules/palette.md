## 2025-05-14 - Restoring Keyboard Focus Visibility
**Learning:** Legacy CSS often includes `outline: none` on interactive elements to remove the default browser focus ring, which completely breaks keyboard navigation accessibility for users who don't use a mouse.
**Action:** Replace `outline: none` with a custom `:focus-visible` ring (e.g., `outline: 3px solid var(--primary-color)`) and use `outline-offset` to ensure visibility. This maintains aesthetic polish for mouse users while providing essential feedback for keyboard users.

## 2025-05-14 - Synchronizing ARIA States with JS
**Learning:** Adding ARIA attributes like `aria-expanded` to HTML is insufficient if they aren't programmatically updated when the state changes via JavaScript.
**Action:** Always include attribute updates (e.g., `setAttribute('aria-expanded', 'true')`) within toggle functions to ensure screen readers accurately reflect the UI state.
