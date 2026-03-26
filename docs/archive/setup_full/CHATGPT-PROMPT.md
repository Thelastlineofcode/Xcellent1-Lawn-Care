# CHATGPT PROMPT: Complete Xcellent1 Landing Page

Copy and paste this entire prompt into ChatGPT:

---

I need you to add a landing page to my GitHub repository. Follow these exact
steps:

**Repository:** https://github.com/Thelastlineofcode/Xcellent1-Lawn-Care

## Task 1: Create Landing Page File

1. Access my GitHub repository: Thelastlineofcode/Xcellent1-Lawn-Care
2. Navigate to folder: `web/static/`
3. Create new file: `home.html`
4. Use the complete HTML code I'm providing in the attached
   TASK-1-ADD-LANDING.md file
5. Commit message: "feat: add landing page with services, blog, and shop"

## Task 2: Update Server Routing

1. Open file: `server.ts` (in root directory)
2. Find the code that says:

```typescript
headers: { "Location": "/static/index.html" }
```

3. Change it to:

```typescript
headers: { "Location": "/static/home.html" }
```

4. Commit message: "feat: redirect root to new landing page"

## Task 3: Add Logo

1. Create folder: `web/static/images/`
2. I'll upload the logo file separately - save it as `logo.png` in that folder
3. Update `web/static/home.html`:
   - Find: `<h1>🌱 Xcellent1 Lawn Care</h1>`
   - Add before it:

```html
<div class="logo-container">
  <img src="images/logo.png" alt="Xcellent1 Lawn Care" class="main-logo">
</div>
```

4. Add this CSS in the `<style>` section:

```css
.logo-container {
  margin-bottom: 2rem;
  text-align: center;
}
.main-logo {
  max-width: 400px;
  width: 90%;
  height: auto;
}
@media (max-width: 768px) {
  .main-logo {
    max-width: 280px;
  }
}
```

5. Commit message: "feat: add logo to landing page"

## Verification

After completing all tasks:

- Confirm `home.html` exists at `web/static/home.html`
- Confirm `server.ts` redirects to `/static/home.html`
- Confirm logo file is at `web/static/images/logo.png`
- Tell me when it's done so I can test the deployment

## Files Attached

- TASK-1-ADD-LANDING.md (contains complete HTML code)
- TASK-2-UPDATE-ROUTING.md (routing details)
- TASK-3-ADD-LOGO.md (logo setup)
- TASK-4-SUMMARY.md (what gets deployed)

Complete these 3 tasks in order. Let me know if you encounter any errors.

---

**After ChatGPT completes the tasks, you can deploy:**

```bash
flyctl deploy -a xcellent1-lawn-care-rpneaa
```
