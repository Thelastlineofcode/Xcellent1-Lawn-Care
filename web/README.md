# Xcellent1 Lawn Care - Local Web UI

## Overview

Production-ready, accessible frontend for field service management. Built with vanilla HTML/CSS/JS (no frameworks) to work with Deno backend and Supabase.

---

## How to Run Locally

### Start the Server

```bash
# From repository root
deno run --allow-net --allow-read --allow-write --allow-env web/server.ts
```

**Or use the main server:**
```bash
deno run --allow-net --allow-read --allow-write --allow-env server.ts
```

### Access the App

- **Lead Form:** http://localhost:8000/
- **Crew Dashboard:** http://localhost:8000/static/dashboard.html

---

## Quick Test Checklist

### ✅ Test 1: Submit Lead

1. Open http://localhost:8000/
2. Fill form (Name, Phone, Email, Notes)
3. Click **Submit Lead**
4. ✅ Success message appears
5. Open dashboard
6. ✅ Lead appears in list

### ✅ Test 2: Upload Photo

1. On dashboard, enter Job ID: `testjob1`
2. Choose photo (<5MB)
3. ✅ Preview shows
4. Click **Upload Photo**
5. ✅ Success message with path
6. ✅ Thumbnail appears in events

### ✅ Test 3: Auto-Refresh

1. Open dashboard
2. Run in terminal:
```bash
curl -X POST http://localhost:8000/api/outbox \
  -H "Content-Type: application/json" \
  -d '{"type":"TEST","payload":{}}'
```
3. Wait 20 seconds
4. ✅ Event appears automatically

---

## Testing Commands

### Insert Lead
```bash
curl -X POST http://localhost:8000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","phone":"555-1234","email":"john@test.com","notes":"Mowing needed","source":"web"}'
```

### Get Status
```bash
curl http://localhost:8000/api/status
```

### Add Event
```bash
curl -X POST http://localhost:8000/api/outbox \
  -H "Content-Type: application/json" \
  -d '{"type":"JOB_COMPLETE","payload":{"photo_path":"/uploads/test.jpg"}}'
```

---

## File Structure

```
web/
├── static/
│   ├── styles.css      # Responsive CSS (9.6 KB)
│   ├── app.js          # Client JS (17.8 KB)
│   ├── index.html      # Lead form
│   └── dashboard.html  # Crew dashboard
├── uploads/            # Photos (auto-created)
├── server.ts           # Local Deno server
└── README.md           # This file
```

---

## Features

- ✅ Lead capture with validation
- ✅ Real-time dashboard (20s polling)
- ✅ Photo upload with preview
- ✅ KPI metrics (leads, events, photos)
- ✅ Mobile-first responsive
- ✅ WCAG AA accessible
- ✅ Zero dependencies

---

## Notes

- **Backend:** Uses Supabase helper (`bmad/agents/lib/supabase.ts`) with local stub fallback
- **Storage:** Photos saved to `web/uploads/` during local dev
- **Polling:** Dashboard refreshes every 20 seconds; stops when tab hidden
- **PWA:** Service Worker registration ready (requires HTTPS in production)

---

## Troubleshooting

**Server won't start:**
```bash
# Check Deno installed
deno --version

# Check port not in use
lsof -i :8000
```

**Files not loading:**
```bash
# Verify files exist
ls -la web/static/
```

**Upload fails:**
```bash
# Create uploads directory
mkdir -p web/uploads
chmod 755 web/uploads
```

---

## Production Deployment

### Deno Deploy
```bash
deployctl deploy --project=xcellent1 server.ts
```

### Docker
```bash
docker build -t xcellent1 .
docker run -p 8000:8000 xcellent1
```

---

**For full documentation, see Epic 2 (Leads & Intake) in `/docs/epics_and_stories.md`**
