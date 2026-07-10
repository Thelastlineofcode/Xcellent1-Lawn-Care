## 2025-05-15 - Accessibility and Focus State Improvements
**Learning:** Mobile menu toggles and modal close buttons often lack necessary ARIA attributes (like `aria-expanded` and `aria-label`) for screen readers to convey state and purpose. Additionally, default browser focus outlines are sometimes suppressed, making keyboard navigation difficult.
**Action:** Always include `aria-expanded` on interactive toggles and update them via JS. Ensure icon-only buttons have descriptive `aria-label`s. Implement `:focus-visible` styles to provide clear visual feedback for keyboard users.
