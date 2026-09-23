# Palette's Journal - Critical Learnings

## 2025-05-18 - Modal and Mobile Menu A11y Lifecycle Sync
**Learning:** For landing pages served as static HTML (`home.html` and `index.html`), interactive modal overlays require explicit focus management (storing `document.activeElement`, setting focus to first visible `input`, and listening for `Escape` key to close and restore focus) along with updating `aria-expanded` attributes on toggle buttons to ensure seamless keyboard and screen reader experiences.
**Action:** Always complement ARIA attributes (`role="dialog"`, `aria-modal="true"`, `aria-expanded`, `aria-label`) with active JavaScript lifecycle handlers for focus management and keyboard listeners on modal and drawer components.
