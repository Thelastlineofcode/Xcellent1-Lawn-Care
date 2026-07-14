## 2026-07-14 - Standardizing Modal Accessibility
**Learning:** Standard modal accessibility for the repository requires role="dialog", aria-modal="true", an Escape key listener, and focus management (focusing the first input on open and restoring focus to the trigger on close). Non-semantic interactive elements like divs used as buttons must have role="button" and tabindex="0" to be discoverable by screen readers and navigable by keyboard.
**Action:** Always include ARIA roles and focus management when implementing or improving modals or custom interactive components.
