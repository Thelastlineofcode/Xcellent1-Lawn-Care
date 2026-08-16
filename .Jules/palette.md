## 2025-05-20 - Service Modal and Mobile Navigation Accessibility
**Learning:** Adding explicit ARIA attributes (`role="dialog"`, `aria-modal="true"`, `aria-expanded`) alongside focus management (capturing `document.activeElement` before opening, auto-focusing initial form input, restoring focus on close, and handling Escape key) significantly improves screen reader navigation and keyboard user experience on static landing pages.
**Action:** Always pair visual modal dialogs and collapsible mobile navigation buttons with programmatic ARIA state updates and focus lifecycle management.
