## 2025-05-18 - Modal Dialog Focus Lifecycle and ARIA Roles
**Learning:** Service inquiry modals using raw entity close buttons (`&times;`) lack screen reader accessibility and focus management, causing lost keyboard focus when closed.
**Action:** Always include `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-label="Close"`, capture `document.activeElement` on open to restore focus on close, and handle the `Escape` key.
