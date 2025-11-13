# Cleanup Instructions - Xcellent1 Lawn Care

## Files to Remove

### 1. Old Documentation (in `/docs/`)
```bash
rm /Users/houseofobi/Documents/GitHub/Xcellent1-Lawn-Care/docs/epics_and_stories.md
```
**Reason**: Replaced by new `STORIES.md` and `ROADMAP.md`

### 2. Redundant HTML Pages (in `/web/static/`)
```bash
rm /Users/houseofobi/Documents/GitHub/Xcellent1-Lawn-Care/web/static/dashboard.html
rm /Users/houseofobi/Documents/GitHub/Xcellent1-Lawn-Care/web/static/home.html
rm /Users/houseofobi/Documents/GitHub/Xcellent1-Lawn-Care/web/static/client.html
rm /Users/houseofobi/Documents/GitHub/Xcellent1-Lawn-Care/web/static/portal-index.html
```
**Reason**: Consolidating into single-page PWA structure. Keep only:
- `index.html` (landing page with waitlist)
- `crew.html` (crew mobile portal)
- `owner.html` (owner dashboard)

---

## Files to Keep & Update

### Keep These Files:
✅ `/web/static/index.html` - Landing page (needs waitlist form)
✅ `/web/static/crew.html` - Crew mobile app
✅ `/web/static/owner.html` - Owner dashboard
✅ `/web/static/app.js` - Main JavaScript
✅ `/web/static/styles.css` - Styles
✅ `/web/static/sw.js` - Service worker
✅ `/web/static/manifest.json` - PWA manifest

---

## Directory Structure After Cleanup

```
Xcellent1-Lawn-Care/
├── docs/
│   ├── Architecture.md ✅
│   ├── STORIES.md ✅ NEW
│   ├── ROADMAP.md ✅ NEW
│   ├── assessment-instructions.md ✅
│   ├── lawncare-financial-kpis.md ✅
│   └── (other docs remain)
│
├── web/static/
│   ├── index.html ✅ (update with waitlist)
│   ├── crew.html ✅
│   ├── owner.html ✅
│   ├── app.js ✅
│   ├── styles.css ✅
│   ├── sw.js ✅
│   ├── manifest.json ✅
│   └── images/ ✅
│
├── db/
│   └── database-schema.sql ✅ NEW
│
├── bmad/
│   └── agents/
│       ├── intake/
│       ├── quote/
│       ├── scheduler/
│       ├── invoice/
│       └── (all agent dirs)
│
└── src/
    └── skills/
        ├── perplexity_research.py ✅
        └── (new skills to be added)
```

---

## Cleanup Commands

Run these commands from the project root:

```bash
# Remove old documentation
rm docs/epics_and_stories.md

# Remove redundant HTML pages
rm web/static/dashboard.html
rm web/static/home.html
rm web/static/client.html  
rm web/static/portal-index.html

# Verify cleanup
ls -la docs/
ls -la web/static/
```

---

## Post-Cleanup Verification

After cleanup, verify:
1. ✅ Only 3 HTML files in `/web/static/`: index.html, crew.html, owner.html
2. ✅ Old `epics_and_stories.md` is removed
3. ✅ New `STORIES.md` and `ROADMAP.md` exist in `/docs/`
4. ✅ Database schema exists in `/db/`
5. ✅ All static assets (JS, CSS, images) remain intact

---

## Notes

- **Do NOT** remove any files in `/bmad/` directory
- **Do NOT** remove any agent handlers or configs
- **Do NOT** remove `.env` file (contains API keys)
- Keep all markdown files in `/docs/` except `epics_and_stories.md`
