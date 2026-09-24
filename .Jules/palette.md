# Palette Journal

## 2026-09-24 - Service Modal & Interactive Card Focus Lifecycle
**Learning:** Interactive `div` cards without ARIA roles or keyboard event listeners block screen reader and keyboard-only users from triggering modal dialogs. Furthermore, modals without `role="dialog"`, `aria-modal="true"`, and automatic focus on opening disrupt context for assistive tools.
**Action:** Always add `role="button"`, `tabindex="0"`, and `Enter`/`Space` key handlers to interactive card containers, and implement capture/restore of `document.activeElement` along with initial input focus for modal dialogs.
