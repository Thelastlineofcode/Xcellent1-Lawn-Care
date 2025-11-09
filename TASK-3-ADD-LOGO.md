# TASK 3: Add Logo to Website

## GOAL
Upload the Xcellent1 Lawn Care logo to the website

## REPOSITORY
https://github.com/Thelastlineofcode/Xcellent1-Lawn-Care

## INSTRUCTIONS FOR CHATGPT

### Step 1: Create images folder
1. Navigate to: `web/static/`
2. Create a new folder named: `images`
3. This creates the path: `web/static/images/`

### Step 2: Upload logo
1. The user has a logo file named: `Gemini_Generated_Image_fpz929fpz929fpz9.jpg`
2. Upload this file to: `web/static/images/`
3. Rename it to: `logo.png` (or keep as logo.jpg - both work)

### Step 3: Update home.html to show logo
1. Open: `web/static/home.html`
2. Find the hero section (around line 25-35)
3. Find this line:
```html
<h1>🌱 Xcellent1 Lawn Care</h1>
```

4. Add this BEFORE the h1:
```html
<div class="logo-container">
  <img src="images/logo.png" alt="Xcellent1 Lawn Care" class="main-logo">
</div>
```

5. Add this CSS in the `<style>` section (around line 10):
```css
.logo-container { margin-bottom: 2rem; text-align: center; }
.main-logo { max-width: 400px; width: 90%; height: auto; }
@media (max-width: 768px) {
  .main-logo { max-width: 280px; }
}
```

6. Commit with message: "feat: add logo to landing page"

## WHAT THIS DOES
- Displays the professional Xcellent1 logo at the top of the landing page
- Logo is responsive (shrinks on mobile)
- Logo appears above the company name

## VERIFICATION
After uploading:
- Logo file is at: `web/static/images/logo.png` (or logo.jpg)
- Logo displays on homepage
- Logo is centered and properly sized

## NEXT TASK
Landing page is now complete with logo! 
For additional features, see TASK-4-SUMMARY.md