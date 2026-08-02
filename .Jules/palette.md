## 2026-04-02 - Enhancing Non-Semantic Interactive Element Accessibility
**Learning:** In marketing sites built with non-semantic grid items (like service cards), relying solely on `onclick` handlers on generic `div` tags breaks keyboard navigation. Users navigating via screen-reader or keyboard tab navigation cannot focus or interact with these elements.
**Action:** Always add `role="button"` and `tabindex="0"` programmatically or explicitly, and ensure keydown events handle both 'Enter' and 'Space' with appropriate `preventDefault()` to prevent scrolling.
