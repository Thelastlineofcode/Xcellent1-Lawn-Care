# Quick Start - 5 Minutes

## 1. Read This First
- **`PROJECT-SUMMARY.md`** - Complete overview (5 min read)
- **`BUILD-PLAN.md`** - 4-week implementation plan (5 min read)
- **`docs/REALITY-CHECK.md`** - What this actually is vs hype (3 min read)

## 2. Test Perplexity Research (Right Now)

```bash
cd /Users/houseofobi/Documents/GitHub/Xcellent1-Lawn-Care

# Quick test - does it work?
python3 -c "from src.skills.perplexity_research import perplexityResearch; \
result = perplexityResearch('Hello test'); \
print('✅ Perplexity works!' if result['success'] else '❌ Check API key')"

# Real example - research Supabase
python3 -c "from src.skills.perplexity_research import perplexityResearch; \
result = perplexityResearch('Supabase quickstart with Deno Deploy', model='sonar-pro'); \
print(result['answer'][:500] + '...')"
```

**If it works:** You're ready to build!
**If error:** Check `.env` file has `PERPLEXITY_API_KEY=pplx-...`

## 3. Pick Your Starting Point

### Option A: Build Now (Action Mode)
Start `BUILD-PLAN.md` Week 1:
1. Create Supabase project → supabase.com
2. Copy connection URL to `.env`
3. Run `db/schema.sql` migrations
4. Test: Can insert data manually

**Next:** Build customer booking endpoint

### Option B: Learn First (Study Mode)
Research key topics:
```bash
# Deno + Supabase
python3 -c "from src.skills.perplexity_research import perplexityResearch; \
print(perplexityResearch('Deno Deploy with Supabase tutorial')['answer'])"

# Stripe integration
python3 -c "from src.skills.perplexity_research import perplexityResearch; \
print(perplexityResearch('Stripe Checkout Deno integration')['answer'])"

# PWA basics
python3 -c "from src.skills.perplexity_research import perplexityResearch; \
print(perplexityResearch('Progressive Web App offline mode tutorial')['answer'])"
```

**Next:** Build with knowledge

### Option C: Review Everything (Plan Mode)
1. Read all 3 summary docs (15 min)
2. Review web pages in `web/static/` (10 min)
3. Check database schema in `db/schema.sql` (10 min)
4. Plan your week (15 min)

**Next:** Start Monday with clear plan

## 4. Your First Win (This Week)

**Goal:** Customer submits booking form → saves to database

**Steps:**
1. Supabase setup (1 hour)
2. Create `/api/leads/intake` endpoint (2 hours)
3. Wire up form in `index.html` (1 hour)
4. Test end-to-end (30 min)

**Total time:** ~5 hours

**When done:** You'll have a working customer booking system!

## 5. Quick Reference

### Environment Variables (.env)
```bash
PERPLEXITY_API_KEY=pplx-your-key-here
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Research Before Building
```python
from src.skills.perplexity_research import perplexityResearch
result = perplexityResearch("YOUR QUESTION", model='sonar-pro')
print(result['answer'])
```

### Test API Locally
```bash
deno run --allow-net --allow-env server.ts
```

### Deploy to Production
```bash
git push origin main
# Auto-deploys via Deno Deploy
```

## 6. When Stuck

1. **Technical question?** Use Perplexity research
2. **Code not working?** Check Deno Deploy logs
3. **Database issue?** Check Supabase dashboard
4. **Need examples?** Look in `docs/Architecture.md`

## 7. Success Checklist

- [ ] Read PROJECT-SUMMARY.md
- [ ] Read BUILD-PLAN.md
- [ ] Tested Perplexity research skill
- [ ] Picked starting point (A, B, or C)
- [ ] Started Week 1 tasks

**When all checked:** You're ready to build. Go do it!

---

## Next Step: Your Choice

**Feeling ready?** → Start Option A (build now)
**Want to learn?** → Start Option B (research first)
**Need clarity?** → Start Option C (plan mode)

No wrong choice. Just pick one and start. You can always switch later.

**Time to build:** Go to `BUILD-PLAN.md` Week 1 and start task 1.
