from playwright.sync_api import sync_playwright
import os

pages = [
    "blog-seasonal-tips.html",
    "blog-watering-guide.html",
    "client.html",
    "crew.html",
    "portal-index.html",
    "login.html",
    "offline.html",
    "manage-waitlist.html",
    "pending-payments.html",
    "manage-jobs.html",
]

os.makedirs("screenshots", exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(viewport={"width":1280, "height":900})
    page = context.new_page()
    base = "http://127.0.0.1:8000/static/"
    results = []
    for fname in pages:
        url = base + fname
        try:
            page.goto(url, timeout=15000)
            # wait for network idle
            page.wait_for_load_state("networkidle", timeout=5000)
            out = f"screenshots/{fname}.png"
            page.screenshot(path=out, full_page=True)
            results.append((fname, "ok", out))
        except Exception as e:
            results.append((fname, "error", str(e)))
    browser.close()

for r in results:
    print(r[0], r[1], r[2])
