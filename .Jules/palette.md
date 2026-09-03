## 2025-09-03 - Interactive Service Cards & Modal Focus Lifecycle in Static Pages

**Learning:** Static HTML landing pages often feature interactive non-semantic cards (e.g. `div.service-card`) that open modal dialogs on click. Without `role="button"`, `tabindex="0"`, `onkeydown` support for Enter/Space, `aria-expanded` toggle states, and complete modal focus management (capturing active element, auto-focusing first field, closing on Escape, and restoring focus), keyboard and screen reader users are completely blocked from interacting with service inquiries.

**Action:** When adding modal triggers to non-semantic elements, always pair `role="button"` and `tabindex="0"` with key handlers that call `preventDefault()` on Space, and ensure the modal open/close lifecycle captures `document.activeElement` and handles Escape key listeners.
