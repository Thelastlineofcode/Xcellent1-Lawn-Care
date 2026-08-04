# Palette's Journal - Critical UX and Accessibility Learnings

## 2025-11-26 - Accessible Modal Focus Lifecycle
**Learning:** In static pages served in custom Deno/Postgres architectures, standard interactive elements like service inquiry modals often lack essential screen reader attributes (`role="dialog"`, `aria-modal="true"`) and standard focus lifecycle management (capturing the active trigger, focusing the first input on open, and restoring focus to the trigger on close). Failing to manage this makes the site extremely frustrating for keyboard and screen reader users, as keyboard focus gets trapped or lost in the background document when the modal is active.
**Action:** Always verify modals have explicit accessibility tags and write a lightweight focus-management pattern in plain JavaScript for any non-framework modal.
