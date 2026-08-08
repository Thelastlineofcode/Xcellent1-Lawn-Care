# Palette's UX Journal

## 2025-11-20 - Non-semantic Interactive Cards Accessibility
**Learning:** Hand-authoring inline tabindex and keyboard listeners for duplicate non-semantic card components across multiple HTML pages is highly error-prone. A dynamic programmatic approach using querySelectorAll on DOMContentLoaded ensures all cards in the design system automatically receive tabindex, role, and keydown listeners (handling Enter and Space with preventDefault to prevent scrolling).
**Action:** Use programmatic JS-driven accessibility enhancements for non-semantic layout elements that function as buttons to guarantee comprehensive coverage and maintain clean, manageable HTML markup.
