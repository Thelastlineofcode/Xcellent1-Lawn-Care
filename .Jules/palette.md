## 2025-05-20 - Accessible Service Inquiry Modal Dialogs

**Learning:** Modal dialogs rendered without `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` fail screen reader accessibility standards, and close buttons rendering `&times;` without `aria-label="Close"` are announced as multiplication signs.
**Action:** Always ensure modal overlays have `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, explicit `aria-label="Close"` on dismiss buttons, and support the `Escape` key shortcut to close.
