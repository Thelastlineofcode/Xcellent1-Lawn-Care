#!/usr/bin/env python3
import re
from pathlib import Path

ROOT = Path('web/static')
issues = []

for path in sorted(ROOT.glob('*.html')):
    txt = path.read_text(encoding='utf-8')
    ids = re.findall(r'id\s*=\s*"([^"]+)"', txt)
    dupes = {i for i in ids if ids.count(i) > 1}
    if dupes:
        issues.append(f"{path}: duplicate id(s): {', '.join(sorted(dupes))}")

    # find img tags missing alt
    img_tags = re.findall(r'<img[^>]*>', txt, flags=re.IGNORECASE)
    missing_alt = [t for t in img_tags if 'alt=' not in t.lower()]
    if missing_alt:
        issues.append(f"{path}: {len(missing_alt)} <img> tag(s) missing alt attribute")

if issues:
    print('HTML CHECK: Issues found:')
    for it in issues:
        print(' -', it)
    raise SystemExit(1)
else:
    print('HTML CHECK: No obvious duplicate-id or missing-alt issues found')
    raise SystemExit(0)
