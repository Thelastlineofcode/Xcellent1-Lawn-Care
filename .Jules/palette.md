## 2025-05-18 - Modal Focus Timing with CSS Display Transitions
**Learning:** When displaying a hidden modal dialog via `display: flex`, calling `focus()` immediately can fail or target unexpected elements before layout reflow completes or if generic selectors include close buttons.
**Action:** Use a short delay (`setTimeout`) and target specific visible inputs (`input:not([type='hidden'])`) to reliably set focus on the first input field when opening modal dialogs.
