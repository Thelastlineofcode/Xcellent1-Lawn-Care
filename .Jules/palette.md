# Palette's Journal - UX & Accessibility Learnings

## 2026-08-23 - Mobile Navigation ARIA State Sync & Modal Close Accessibility
**Learning:** Pure HTML/JS navigation toggles often omit dynamic `aria-expanded` and `aria-controls` states, leaving screen reader users unaware when menus toggle. Modal close buttons using HTML entities like `&times;` are read aloud as "multiplication sign" or "times" unless given an explicit `aria-label="Close modal"`.
**Action:** Always include `aria-expanded="false"` and `aria-controls` on mobile trigger buttons, dynamically sync `aria-expanded` in JS toggle handlers, and ensure icon/entity close buttons have descriptive `aria-label` attributes across all HTML templates.
