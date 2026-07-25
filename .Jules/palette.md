## 2026-07-25 - [Enhancing Modal and Card Interaction States]
**Learning:** [Non-semantic divs or clickable containers (like service-card) lack keyboard/focus support, meaning keyboard and screen-reader users can't discover or interact with key modal flows. Explicit tabindex, role="button", and Space/Enter key listeners are crucial for these elements.]
**Action:** [Ensure keyboard handlers with event.preventDefault() are present on non-semantic clickable cards, and always manage focus using activeElement storage and restore upon modal close.]
