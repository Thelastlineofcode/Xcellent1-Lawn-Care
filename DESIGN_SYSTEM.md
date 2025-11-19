# Xcellent1 Lawn Care - Unified Design System

## Overview
This document defines the complete design system for Xcellent1 Lawn Care web application, ensuring consistency across all pages and components.

## Color Palette

### Primary Colors
```css
--color-primary-50:  #f0fdf4;   /* Very light green */
--color-primary-100: #dcfce7;   /* Light green */
--color-primary-500: #10b981;   /* PRIMARY GREEN (main brand color) */
--color-primary-600: #059669;   /* Dark green (hover states) */
--color-primary-700: #047857;   /* Darker green (active states) */
--color-primary-900: #014d3a;   /* Darkest green (text on light bg) */
```

### Accent Color
```css
--color-accent:      #f23d00;   /* Orange (CTAs, prices) */
--color-accent-dark: #bc2800;   /* Dark orange (hover) */
```

### Neutral Colors
```css
--color-white:       #ffffff;
--color-gray-50:     #f9fafb;
--color-gray-100:    #f3f4f6;
--color-gray-200:    #e5e7eb;
--color-gray-300:    #d1d5db;
--color-gray-600:    #4b5563;
--color-gray-700:    #374151;
--color-gray-900:    #111827;
--color-black:       #000000;
```

### Status Colors
```css
--color-success:     #16a34a;
--color-warning:     #f59e0b;
--color-error:       #ef4444;
--color-info:        #0284c7;
```

### Semantic Colors
```css
--color-bg-primary:      var(--color-white);
--color-bg-secondary:    var(--color-gray-50);
--color-text-primary:    var(--color-gray-900);
--color-text-secondary:  var(--color-gray-600);
--color-border:          var(--color-gray-200);
--color-border-dark:     var(--color-gray-300);
```

## Typography

### Font Families
```css
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-mono: "SF Mono", Monaco, Consolas, "Courier New", monospace;
```

### Font Sizes
```css
--text-xs:   0.75rem;   /* 12px */
--text-sm:   0.875rem;  /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg:   1.125rem;  /* 18px */
--text-xl:   1.25rem;   /* 20px */
--text-2xl:  1.5rem;    /* 24px */
--text-3xl:  1.875rem;  /* 30px */
--text-4xl:  2.25rem;   /* 36px */
--text-5xl:  3rem;      /* 48px */
```

### Font Weights
```css
--font-normal:    400;
--font-medium:    500;
--font-semibold:  600;
--font-bold:      700;
--font-extrabold: 800;
```

### Line Heights
```css
--leading-tight:  1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

## Spacing

```css
--space-0:  0;
--space-1:  0.25rem;  /* 4px */
--space-2:  0.5rem;   /* 8px */
--space-3:  0.75rem;  /* 12px */
--space-4:  1rem;     /* 16px */
--space-5:  1.25rem;  /* 20px */
--space-6:  1.5rem;   /* 24px */
--space-8:  2rem;     /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
```

## Border Radius

```css
--radius-sm:  0.25rem;  /* 4px */
--radius-md:  0.5rem;   /* 8px */
--radius-lg:  0.75rem;  /* 12px */
--radius-xl:  1rem;     /* 16px */
--radius-full: 9999px;   /* Fully rounded */
```

## Shadows

```css
--shadow-sm:  0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md:  0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg:  0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl:  0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

## Transitions

```css
--transition-fast:   150ms ease-in-out;
--transition-base:   200ms ease-in-out;
--transition-slow:   300ms ease-in-out;
```

## Breakpoints

```css
/* Mobile first approach */
--screen-sm:  640px;   /* Tablet */
--screen-md:  768px;   /* Small laptop */
--screen-lg:  1024px;  /* Desktop */
--screen-xl:  1280px;  /* Large desktop */
```

## Component Specifications

### Navbar

#### Public Navbar (Unauthenticated)
- Background: `rgba(1, 39, 20, 0.98)` (dark green)
- Height: 60px
- Links: Home, Shop, Careers
- Login Button: Orange accent color
- Sticky positioning

#### Authenticated Navbar
- Same background color
- Links based on role:
  - **Owner**: Dashboard, Clients, Jobs, Invoices, Logout
  - **Crew**: Today's Jobs, Photos, Profile, Logout
  - **Client**: My Services, History, Profile, Logout
  - **Hiring**: Applications, Candidates, Settings, Logout

### Buttons

#### Primary Button
- Background: `var(--color-primary-500)`
- Text: White
- Padding: `var(--space-3) var(--space-6)`
- Border radius: `var(--radius-md)`
- Hover: `var(--color-primary-600)`

#### Accent Button (CTA)
- Background: `var(--color-accent)`
- Text: White
- Same padding and radius
- Hover: `var(--color-accent-dark)`

#### Secondary Button
- Background: `var(--color-gray-100)`
- Text: `var(--color-gray-900)`
- Same padding and radius
- Hover: `var(--color-gray-200)`

### Cards

#### Standard Card
- Background: White
- Border: `1px solid var(--color-border)`
- Border radius: `var(--radius-lg)`
- Padding: `var(--space-6)`
- Shadow: `var(--shadow-md)`

#### Stat Card (KPI)
- Background: Linear gradient from primary-500 to primary-600
- Text: White
- Bold large numbers
- Icon in corner

#### Job Card (Crew)
- Left border: 4px solid status color
- White background
- Job details stacked vertically
- Action buttons at bottom

### Forms

#### Input Fields
- Border: `2px solid var(--color-border)`
- Border radius: `var(--radius-md)`
- Padding: `var(--space-3) var(--space-4)`
- Focus: Border changes to `var(--color-primary-500)` with ring

#### Labels
- Font weight: `var(--font-semibold)`
- Margin bottom: `var(--space-2)`
- Color: `var(--color-text-primary)`

### Dashboard Layouts

#### Owner Dashboard Grid
```
┌─────────────────────────────────────┐
│         Welcome Header              │
├─────────────────────────────────────┤
│ KPI 1   │  KPI 2   │   KPI 3       │
├─────────────────────────────────────┤
│    Revenue Chart    │  Jobs Chart   │
├─────────────────────────────────────┤
│  Quick Actions Grid (4 columns)     │
└─────────────────────────────────────┘
```

#### Crew Dashboard (Mobile-First)
```
┌─────────────────────────┐
│    Welcome Header       │
├─────────────────────────┤
│   Today's Job Card 1    │
│   [Navigate] [Complete] │
├─────────────────────────┤
│   Today's Job Card 2    │
│   [Navigate] [Complete] │
├─────────────────────────┤
│   Bottom Nav Bar        │
│   Jobs | Photos | More  │
└─────────────────────────┘
```

## Navigation Flow

```
/                      → home.html (marketing)
├── /shop              → shop.html
├── /careers           → careers.html
├── /login             → login.html
│   ├── Role: Owner    → owner.html
│   ├── Role: Crew     → crew.html
│   ├── Role: Client   → client.html
│   └── Role: Hiring   → dashboard.html
├── /portal            → portal-index.html (hub)
└── /blog
    ├── /grass-types   → blog-grass-types.html
    ├── /seasonal-tips → blog-seasonal-tips.html
    └── /watering      → blog-watering-guide.html
```

## Accessibility Requirements

- Minimum color contrast: WCAG AA (4.5:1 for text)
- Focus indicators on all interactive elements
- ARIA labels on icon buttons
- Semantic HTML5 elements
- Keyboard navigation support
- Screen reader tested

## Implementation Notes

1. **Remove all inline styles** - Move to centralized styles.css
2. **Use CSS custom properties** - All colors and sizes via variables
3. **Component-based CSS** - Modular, reusable classes
4. **Mobile-first responsive** - Media queries for larger screens
5. **Consistent spacing** - Use spacing scale
6. **Semantic naming** - Class names describe purpose, not appearance

## File Structure

```
web/static/
├── styles.css (SINGLE source of truth)
├── index.html
├── home.html
├── login.html
├── owner.html (dashboard)
├── crew.html (dashboard)
├── client.html (portal)
├── dashboard.html (hiring)
└── ...
```

## Migration Checklist

- [ ] Update CSS custom properties in styles.css
- [ ] Remove Montserrat font import (use system fonts)
- [ ] Consolidate all navbar styles
- [ ] Create button component classes
- [ ] Create card component classes
- [ ] Move all inline styles to styles.css
- [ ] Update home.html
- [ ] Update login.html
- [ ] Rebuild owner.html dashboard
- [ ] Rebuild crew.html dashboard
- [ ] Update all navigation links
- [ ] Add portal integration
- [ ] Test responsive breakpoints
- [ ] Audit accessibility
