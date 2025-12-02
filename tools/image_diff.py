from PIL import Image, ImageChops
import os

cur_dir = "screenshots"
base_dir = "screenshots/baseline"
out_dir = "screenshots/diff"

os.makedirs(out_dir, exist_ok=True)

files = [
    "blog-seasonal-tips.html.png",
    "blog-watering-guide.html.png",
    "client.html.png",
    "crew.html.png",
    "portal-index.html.png",
    "login.html.png",
    "offline.html.png",
    "manage-waitlist.html.png",
    "pending-payments.html.png",
    "manage-jobs.html.png",
]

summary = []
for f in files:
    cur_path = os.path.join(cur_dir, f)
    base_path = os.path.join(base_dir, f)
    out_path = os.path.join(out_dir, f)
    if not os.path.exists(cur_path):
        summary.append((f, "missing_current"))
        continue
    if not os.path.exists(base_path):
        summary.append((f, "missing_baseline"))
        continue
    a = Image.open(cur_path).convert('RGBA')
    b = Image.open(base_path).convert('RGBA')
    # Ensure same size
    if a.size != b.size:
        # Resize baseline to current size (best-effort)
        b = b.resize(a.size)
    diff = ImageChops.difference(a, b)
    # Calculate percent difference by counting non-zero pixels
    bbox = diff.getbbox()
    if not bbox:
        percent = 0.0
        diff.save(out_path)
        summary.append((f, "identical", percent, out_path))
        continue
    # Count differing pixels
    diff_gray = diff.convert('L')
    pixels = diff_gray.getdata()
    nonzero = sum(1 for p in pixels if p != 0)
    total = a.size[0] * a.size[1]
    percent = (nonzero / total) * 100.0
    # Enhance diff for visibility: multiply and save
    vis = diff
    vis.save(out_path)
    summary.append((f, "different", round(percent, 3), out_path))

for s in summary:
    print(s)
