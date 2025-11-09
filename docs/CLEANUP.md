# Xcellent1 Lawn Care - Page Cleanup & Migration Plan

## Current Pages Status

| Page | File | Purpose | Status | Action |
|------|------|---------|--------|--------|
| Landing | `index.html` | Customer booking | ❌ OLD | ✅ REBUILD with waitlist |
| Crew | `crew.html` | Crew dashboard | ⚠️ BASIC | ✅ ENHANCE with auth + jobs |
| Owner | `owner.html` | Owner dashboard | ⚠️ BASIC | ✅ REBUILD with real data |
| Admin | `dashboard.html` | Admin panel | ❓ UNCLEAR | ❌ REMOVE |
| Home | `home.html` | Homepage | ❓ UNCLEAR | ❌ REMOVE (duplicate) |
| Portal | `portal-index.html` | Portal entry | ❌ UNUSED | ❌ REMOVE |
| Client | `client.html` | Client portal | ❌ UNUSED | ❌ REMOVE (for Phase 2) |
| Offline | `offline.html` | Offline page | ✅ KEEP | - |

---

## Pages to CREATE (New)

| Page | File | Purpose | Priority |
|------|------|---------|----------|
| Services | `services.html` | What we offer | Week 1 |
| About | `about.html` | Team & company | Week 1 |
| Hiring | `hiring.html` | Crew recruitment | Week 2 |
| Blog | `blog.html` | Blog landing | Week 2+ |
| 404 | `404.html` | Error page | Week 1 |

---

## Cleanup Checklist

### Step 1: Backup Current Site
```bash
# Backup everything before making changes
cd /Users/houseofobi/Documents/GitHub/Xcellent1-Lawn-Care/web/static/

# Create backup directory
mkdir -p ../_backups/$(date +%Y%m%d)
cp -r . ../_backups/$(date +%Y%m%d)/
```

**Confirm:**
- [ ] Backup created at `web/_backups/YYYYMMDD/`
- [ ] All current HTML files copied

---

### Step 2: Remove Old/Unused Pages
```bash
# Delete unused pages
rm -f web/static/dashboard.html
rm -f web/static/home.html
rm -f web/static/portal-index.html

# Hide (don't delete yet) until Phase 2
# These will become customer portals after they book
mv web/static/client.html web/static/client.html.phase2

# Keep offline.html for PWA support
```

**Confirm:**
- [ ] `dashboard.html` deleted
- [ ] `home.html` deleted
- [ ] `portal-index.html` deleted
- [ ] `client.html` renamed to `client.html.phase2`
- [ ] `offline.html` still exists

---

### Step 3: Update Routing

**If using Deno backend routing:**

Update `api/main.ts` or your Deno server:

```typescript
// Remove these routes (if they exist)
// Deno.serve({ handler: (req) => {
//   if (req.url === "/dashboard") → REMOVE
//   if (req.url === "/home") → REMOVE
//   if (req.url === "/portal-index") → REMOVE
// });

// Keep these routes
routes.set("/", "index.html");           // Landing + waitlist
routes.set("/crew", "crew.html");        // Crew dashboard
routes.set("/owner", "owner.html");      // Owner dashboard
routes.set("/hiring", "hiring.html");    // Hiring page (new)
routes.set("/services", "services.html"); // Services (new)
routes.set("/about", "about.html");      // About (new)
routes.set("/blog", "blog.html");        // Blog (new)
routes.set("/404", "404.html");          // Error page (new)
```

**If using static web server:**

Update `fly.toml` or nginx config:
```
/             → index.html
/crew         → crew.html
/owner        → owner.html
/hiring       → hiring.html
/services     → services.html
/about        → about.html
/blog         → blog.html
/404          → 404.html
```

**Confirm:**
- [ ] Old routes removed from backend
- [ ] New routes added
- [ ] Routing config committed

---

### Step 4: Create Redirect for Old URLs

If people have bookmarks to old URLs, add redirects:

```html
<!-- In fly.toml or htaccess -->
[[redirects]]
from = "/dashboard"
to = "/owner"
status = 301

[[redirects]]
from = "/home"
to = "/"
status = 301

[[redirects]]
from = "/portal-index"
to = "/"
status = 301
```

**Confirm:**
- [ ] Old URLs redirect to new ones

---

### Step 5: Update Navigation Links

**In `index.html` (landing):**
```html
<nav>
  <a href="/">Home</a>
  <a href="/services">Services</a>
  <a href="/about">About</a>
  <a href="/hiring">We're Hiring</a>
  <a href="/blog">Blog</a>
  <a href="#waitlist">Join Waitlist</a>
</nav>
```

**In `crew.html`:**
```html
<header>
  <a href="/">Home</a>
  <a href="/crew">Dashboard</a>
  <button onclick="logout()">Logout</button>
</header>
```

**In `owner.html`:**
```html
<header>
  <a href="/">Home</a>
  <a href="/owner">Dashboard</a>
  <button onclick="logout()">Logout</button>
</header>
```

**Confirm:**
- [ ] All nav links updated
- [ ] No broken links
- [ ] Test on all pages

---

### Step 6: Optimize Assets

**Compress images:**
```bash
# Install imagemin if needed
# npm install -g imagemin imagemin-webp imagemin-mozjpeg

# Compress all images
for file in web/static/images/*; do
  # Compress with quality 80
  imagemin "$file" --out-dir=web/static/images/optimized --plugin=mozjpeg --plugin=pngquant
done
```

**Minify CSS & JS:**
```bash
# Install minifier
# npm install -g minify

# Minify CSS
minify web/static/css/style.css > web/static/css/style.min.css

# Minify JS
minify web/static/js/*.js
```

**Confirm:**
- [ ] Images compressed (check file sizes)
- [ ] CSS minified
- [ ] JS minified
- [ ] Site still works after minification

---

### Step 7: Create New Pages (Basic Structure)

**Create `web/static/services.html`:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Services - Xcellent1 Lawn Care</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <nav>
    <a href="/">Home</a>
    <a href="/services" class="active">Services</a>
    <a href="/about">About</a>
    <a href="/hiring">Hiring</a>
  </nav>

  <header class="hero">
    <h1>Our Services</h1>
    <p>Professional lawn care for Houston area</p>
  </header>

  <section class="services-grid">
    <div class="service-card">
      <h3>Lawn Mowing</h3>
      <p>Weekly or bi-weekly grass cutting</p>
      <img src="/images/mowing.jpg" alt="Lawn mowing">
    </div>
    <div class="service-card">
      <h3>Fertilizing</h3>
      <p>Nutrient-rich fertilizer applications</p>
      <img src="/images/fertilizing.jpg" alt="Fertilizing">
    </div>
    <div class="service-card">
      <h3>Aeration</h3>
      <p>Soil aeration for healthy grass</p>
      <img src="/images/aeration.jpg" alt="Aeration">
    </div>
    <div class="service-card">
      <h3>Seeding</h3>
      <p>Professional grass seeding services</p>
      <img src="/images/seeding.jpg" alt="Seeding">
    </div>
  </section>

  <footer>
    <p>&copy; 2025 Xcellent1 Lawn Care. All rights reserved.</p>
  </footer>
</body>
</html>
```

**Create `web/static/about.html`:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>About - Xcellent1 Lawn Care</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <nav>
    <a href="/">Home</a>
    <a href="/services">Services</a>
    <a href="/about" class="active">About</a>
    <a href="/hiring">Hiring</a>
  </nav>

  <header class="hero">
    <h1>About Xcellent1</h1>
    <p>Meet the team keeping Houston yards beautiful</p>
  </header>

  <section class="team">
    <h2>Our Team</h2>
    <div class="team-grid">
      <!-- Populate with Instagram/Facebook photos -->
      <div class="team-member">
        <img src="/images/team1.jpg" alt="Team member">
        <h3>Crew Member 1</h3>
        <p>Lawn Care Specialist</p>
      </div>
      <div class="team-member">
        <img src="/images/team2.jpg" alt="Team member">
        <h3>Crew Member 2</h3>
        <p>Landscape Technician</p>
      </div>
      <!-- Add more -->
    </div>
  </section>

  <section class="mission">
    <h2>Our Mission</h2>
    <p>To provide exceptional lawn care services with professionalism and integrity.</p>
  </section>

  <footer>
    <p>&copy; 2025 Xcellent1 Lawn Care. All rights reserved.</p>
  </footer>
</body>
</html>
```

**Create `web/static/hiring.html`:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Join Our Team - Xcellent1 Lawn Care</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <nav>
    <a href="/">Home</a>
    <a href="/services">Services</a>
    <a href="/about">About</a>
    <a href="/hiring" class="active">Hiring</a>
  </nav>

  <header class="hero">
    <h1>Join Our Team</h1>
    <p>We're hiring crew members in Houston</p>
  </header>

  <section class="job-posting">
    <h2>Lawn Care Crew Member</h2>
    <div class="job-details">
      <h3>Responsibilities:</h3>
      <ul>
        <li>Lawn mowing and trimming</li>
        <li>Landscaping and maintenance</li>
        <li>Equipment operation and care</li>
        <li>Customer service</li>
      </ul>

      <h3>Requirements:</h3>
      <ul>
        <li>Valid driver's license</li>
        <li>Physical fitness for outdoor work</li>
        <li>Reliability and punctuality</li>
        <li>Positive attitude and teamwork</li>
      </ul>

      <h3>Benefits:</h3>
      <ul>
        <li>Competitive pay</li>
        <li>Flexible schedule</li>
        <li>Growth opportunities</li>
        <li>Friendly team environment</li>
      </ul>
    </div>
  </section>

  <section class="application-form">
    <h2>Apply Now</h2>
    <form id="applicationForm">
      <input type="text" placeholder="Full Name" required>
      <input type="email" placeholder="Email" required>
      <input type="tel" placeholder="Phone" required>
      <textarea placeholder="Why do you want to join us?" required></textarea>
      <button type="submit">Submit Application</button>
    </form>
  </section>

  <footer>
    <p>&copy; 2025 Xcellent1 Lawn Care. All rights reserved.</p>
  </footer>

  <script>
    document.getElementById('applicationForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        alert('Application submitted! We\'ll be in touch soon.');
        e.target.reset();
      } else {
        alert('Error submitting application. Please try again.');
      }
    });
  </script>
</body>
</html>
```

**Create `web/static/404.html`:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found - Xcellent1 Lawn Care</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <div class="error-page">
    <h1>404</h1>
    <h2>Page Not Found</h2>
    <p>Sorry, the page you're looking for doesn't exist.</p>
    <a href="/" class="button">Back to Home</a>
  </div>
</body>
</html>
```

**Confirm:**
- [ ] `services.html` created
- [ ] `about.html` created
- [ ] `hiring.html` created
- [ ] `404.html` created

---

### Step 8: Test All Pages Locally

```bash
# Start your Deno server
cd /Users/houseofobi/Documents/GitHub/Xcellent1-Lawn-Care
deno task start

# Test each page
# Open in browser:
# http://localhost:8000/          → index.html (landing)
# http://localhost:8000/crew      → crew.html
# http://localhost:8000/owner     → owner.html
# http://localhost:8000/services  → services.html
# http://localhost:8000/about     → about.html
# http://localhost:8000/hiring    → hiring.html
# http://localhost:8000/blog      → blog.html (Phase 2)
# http://localhost:8000/404       → 404.html
# http://localhost:8000/xyz       → 404.html (invalid route)
```

**On mobile device (if possible):**
```bash
# Get your local IP
ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1
# Example: 192.168.1.100

# Open on phone:
# http://192.168.1.100:8000/
```

**Checklist:**
- [ ] All pages load without errors
- [ ] Mobile layout looks correct
- [ ] Navigation works
- [ ] No broken links
- [ ] Forms submit correctly
- [ ] Invalid routes show 404

---

### Step 9: Commit Changes

```bash
cd /Users/houseofobi/Documents/GitHub/Xcellent1-Lawn-Care

# Check what changed
git status

# Stage all changes
git add .

# Commit with clear message
git commit -m "refactor: cleanup pages, remove unused files, add new pages

- Remove: dashboard.html, home.html, portal-index.html
- Add: services.html, about.html, hiring.html, 404.html
- Update: routing, navigation links
- Optimize: compress images, minify CSS/JS
- Prepare for: waitlist form, crew auth, owner dashboard"

# Push to main (or feature branch first)
git push origin main
```

**Confirm:**
- [ ] Changes committed
- [ ] Push successful

---

### Step 10: Deploy to Fly.io

```bash
# Verify fly.toml is correct
cat fly.toml

# Deploy
fly deploy

# Verify deployment
fly status
fly logs --app xcellent1-lawn-care

# Test live site
# Open: https://xcellent1lawncare.com/
# Open: https://xcellent1lawncare.com/hiring
# Open: https://xcellent1lawncare.com/xyz (404 test)
```

**Confirm:**
- [ ] `fly deploy` successful
- [ ] All pages load live
- [ ] No errors in logs
- [ ] Mobile responsive on live site

---

## Final Cleanup Checklist

- [ ] Backup created
- [ ] Old pages deleted (dashboard, home, portal-index)
- [ ] client.html archived (client.html.phase2)
- [ ] Routing updated
- [ ] Redirects configured
- [ ] Navigation links fixed
- [ ] Assets optimized
- [ ] New pages created (services, about, hiring, 404)
- [ ] All pages tested locally
- [ ] Tested on mobile device
- [ ] Changes committed
- [ ] Deployed to Fly.io
- [ ] Live site verified

---

## Next Phase (Phase 2)

Once cleanup is complete and live, you'll:

1. **Update index.html** - Add waitlist form
2. **Update crew.html** - Add authentication + job list
3. **Update owner.html** - Add real analytics
4. **Create Blog** - blog.html landing
5. **Re-enable client.html** - as customer portal after booking

See EPICS.md, STORIES.md, and ROADMAP.md for detailed implementation.

---

## Questions?

If you get stuck on any step:
1. Check error logs: `fly logs --app xcellent1-lawn-care`
2. Test locally first: `deno task start`
3. Use Perplexity research for technical questions
4. Reference documentation in `docs/` folder
