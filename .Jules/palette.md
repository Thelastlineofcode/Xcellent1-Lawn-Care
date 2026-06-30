## 2025-11-05 - [Single-Focus Micro-UX Strategy]
**Learning:** UX improvements should be delivered in small, atomic PRs to maintain quality and adhere to strict line limits. Over-bundling features can lead to regression risks and slower reviews.
**Action:** Always prioritize the single most impactful micro-UX win and keep changes under 50 lines.

## 2025-11-05 - [Non-Semantic Interactivity Pattern]
**Learning:** This app uses many `div` elements with `onclick` handlers for key interactions (like service cards). This excludes keyboard-only and screen-reader users.
**Action:** When encountering non-semantic interactive elements, always add `role="button"`, `tabindex="0"`, and a keyboard listener for `Enter`/`Space`.
