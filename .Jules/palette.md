# Palette's Journal - Critical Learnings

## 2025-03-01 - Standardizing Modal Accessibility and Mobile Navigation
**Learning:** This application utilizes non-semantic and custom-built modal dialogs and mobile menus that lack keyboard and screen reader accessibility markers (role="dialog", aria-modal="true", and aria-expanded toggles). Modals also suffer from a lack of focus management, causing screen readers and keyboard users to lose context when a modal opens or closes.
**Action:** Always ensure custom modals feature role="dialog", aria-modal="true", proper label associations, clear aria-labels on close controls, and a fully robust 'Focus Lifecycle' (capture trigger element, focus first input on open, Esc key close listener, and restore focus to trigger element on close). Ensure mobile navigation toggles feature programmatic updating of the aria-expanded attribute.
