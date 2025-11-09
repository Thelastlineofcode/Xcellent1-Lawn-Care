# TASK 2: Update Server Routing

## GOAL
Update `server.ts` to redirect the root URL to the new landing page instead of the careers page.

## REPOSITORY
https://github.com/Thelastlineofcode/Xcellent1-Lawn-Care

## INSTRUCTIONS FOR CHATGPT

1. Access the GitHub repository: Thelastlineofcode/Xcellent1-Lawn-Care
2. Open the file: `server.ts` (it's in the root directory)
3. Find this code block (should be around line 20-35):

```typescript
if (url.pathname === "/") {
  return new Response(null, {
    status: 302,
    headers: { "Location": "/static/index.html" }
  });
}
```

4. Replace it with:

```typescript
if (url.pathname === "/") {
  return new Response(null, {
    status: 302,
    headers: { "Location": "/static/home.html" }
  });
}
```

5. Commit with message: "feat: redirect root to new landing page"

## WHAT THIS DOES
- Changes the homepage from the careers page to the new landing page
- Visitors to xcellent1lawncare.com will see the landing page with services, blog, and shop
- Careers page is still accessible at /static/index.html

## VERIFICATION
After updating:
- The change should only affect ONE line: `/static/index.html` becomes `/static/home.html`
- The rest of server.ts should remain unchanged
- Commit message is: "feat: redirect root to new landing page"

## NEXT TASK
After this is done, the basic landing page is live! 
Next steps are in TASK-3-ADD-LOGO.md