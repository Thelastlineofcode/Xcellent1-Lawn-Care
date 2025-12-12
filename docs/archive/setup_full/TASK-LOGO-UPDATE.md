# Task: Update Xcellent1 Lawn Care Logo Assets

## Overview

Replace existing logo files with newly generated professional digital assets
optimized for web use.

## Generated Logo Assets

Three logo variations have been created:

### 1. Primary Logo (Modernized)

- **File**: `xcellent1-new.png`
- **URL**:
  https://user-gen-media-assets.s3.amazonaws.com/gemini_images/c5113c9e-4719-4cd8-88d8-56f3d988034a.png
- **Use**: Main website header, hero sections

### 2. Alternative Clean Design

- **File**: `xcellent1-alt.png`
- **URL**:
  https://user-gen-media-assets.s3.amazonaws.com/gemini_images/eabb11bb-952a-41e0-8906-7841cfa67460.png
- **Use**: Secondary placements, smaller UI elements

### 3. Web-Optimized Emblem

- **File**: `xcellent1-web.png`
- **URL**:
  https://user-gen-media-assets.s3.amazonaws.com/gemini_images/5b84f266-1bd8-4c70-a395-80397e91e8d5.png
- **Use**: Favicon, social media, compact displays

## Implementation Steps

### Step 1: Download Logo Assets

```bash
# Navigate to images directory
cd web/static/images/

# Download the three logo variations
curl -o xcellent1-new.png "https://user-gen-media-assets.s3.amazonaws.com/gemini_images/c5113c9e-4719-4cd8-88d8-56f3d988034a.png"
curl -o xcellent1-alt.png "https://user-gen-media-assets.s3.amazonaws.com/gemini_images/eabb11bb-952a-41e0-8906-7841cfa67460.png"
curl -o xcellent1-web.png "https://user-gen-media-assets.s3.amazonaws.com/gemini_images/5b84f266-1bd8-4c70-a395-80397e91e8d5.png"
```

### Step 2: Update HTML Files

#### index.html

Replace the emoji logo in the header:

**Current:**

```html
<a href="/" class="logo">🌱 Xcellent1 Lawn Care</a>
```

**Updated:**

```html
<a href="/" class="logo">
  <img
    src="/static/images/xcellent1-new.png"
    alt="Xcellent1 Lawn Care"
    height="40"
  >
</a>
```

#### Other HTML Files to Update

- `web/static/home.html`
- `web/static/dashboard.html`
- `web/static/owner.html`
- `web/static/crew.html`
- `web/static/client.html`
- `web/static/portal-index.html`

Search for `🌱 Xcellent1 Lawn Care` and replace with the image tag above.

### Step 3: Update Styles

Add logo styling to `web/static/styles.css`:

```css
/* Logo styling */
.logo img {
  height: 40px;
  width: auto;
  vertical-align: middle;
  transition: transform 0.2s ease;
}

.logo:hover img {
  transform: scale(1.05);
}

/* Responsive logo */
@media (max-width: 768px) {
  .logo img {
    height: 32px;
  }
}
```

### Step 4: Update Manifest & Meta Tags

#### manifest.json

Update icons to reference the new web-optimized logo:

```json
{
  "name": "Xcellent1 Lawn Care",
  "short_name": "Xcellent1",
  "description": "Professional lawn care services",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#10b981",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/static/images/xcellent1-web.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/static/images/xcellent1-web.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### Add Favicon Links

Add to `<head>` section of all HTML files:

```html
<link
  rel="icon"
  type="image/png"
  sizes="32x32"
  href="/static/images/xcellent1-web.png"
>
<link
  rel="apple-touch-icon"
  sizes="180x180"
  href="/static/images/xcellent1-web.png"
>
```

### Step 5: Test & Verify

1. **Local Testing:**
   ```bash
   deno task dev
   # or
   deno run --allow-all server.ts
   ```

2. **Check:**
   - Logo displays on all pages
   - Logo is properly sized and aligned
   - Hover effects work
   - Mobile responsive scaling
   - Favicon appears in browser tab

3. **Browser Cache:**
   - Clear cache or hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
   - Test in incognito/private window

### Step 6: Commit Changes

```bash
git add web/static/images/xcellent1-*.png
git add web/static/*.html
git add web/static/styles.css
git add web/static/manifest.json
git commit -m "Update brand with new professional logo assets"
git push origin main
```

### Step 7: Deploy

If using Fly.io:

```bash
fly deploy
```

If using GitHub Actions, push will trigger automatic deployment.

## Logo Usage Guidelines

### Primary Logo (xcellent1-new.png)

- Main website header
- Landing page hero
- Email signatures
- Large format displays

### Alternative Logo (xcellent1-alt.png)

- Dashboard header
- Portal interfaces
- Secondary pages
- Marketing materials

### Web Emblem (xcellent1-web.png)

- Favicon
- Social media profile
- Mobile app icon
- Small UI elements (badges, notifications)

## Rollback Plan

If issues arise, revert to emoji logo:

```bash
git revert HEAD
git push origin main
```

Or manually restore:

```html
<a href="/" class="logo">🌱 Xcellent1 Lawn Care</a>
```

## Notes

- Original logo files (`logo.png`, `logo-nobg.png`) will be kept as backup
- New assets maintain green color palette consistent with brand (#10b981,
  #059669)
- All logos are web-optimized for fast loading
- Transparent backgrounds where appropriate

## Completion Checklist

- [ ] Downloaded all three logo variations
- [ ] Updated index.html header
- [ ] Updated all HTML files with logo references
- [ ] Added logo CSS styles
- [ ] Updated manifest.json
- [ ] Added favicon links
- [ ] Tested on desktop
- [ ] Tested on mobile
- [ ] Verified favicon displays
- [ ] Committed changes
- [ ] Deployed to production
- [ ] Verified live site

---

**Task Owner:** Travone\
**Priority:** Medium\
**Estimated Time:** 30-45 minutes\
**Dependencies:** None\
**Status:** Ready to implement
