## 2025-03-10 - Modal Dialog & Service Card Focus Lifecycle
**Learning:** Selecting the first `input` element in a modal using `modal.querySelector('input')` can match hidden form fields (e.g. `<input type="hidden">`), which fails element focus silently. Filtering for `input:not([type='hidden'])` ensures the first visible interactive element gets focus.
**Action:** When managing focus in modal dialogs, use `modal.querySelector("input:not([type='hidden']), select, textarea")` to reliably focus user-interactive fields.
