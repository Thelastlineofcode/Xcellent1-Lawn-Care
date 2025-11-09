# Xcellent1 Lawn Care - Reality Check

## What This Actually Is

Small lawn care business in LaPlace/Norco area:
- **Current team:** Owner + 3 field workers
- **Goal:** Hire 2 more workers to handle growth
- **Revenue:** ~$8K/month, targeting $12K/month
- **NOT:** A giant company with complex hierarchies and 50 agents

## Current Web App (What's Built)

### Pages That Exist
1. **index.html** - Simple hiring page ("We need 2 workers")
2. **owner.html** - Owner dashboard (revenue, crew status, alerts)
3. **crew.html** - Crew member portal (their daily jobs)
4. **client.html** - Customer portal (view jobs, pay invoices)
5. **dashboard.html** - Application tracker (review job applications)

### What They Do
- Customers book lawn services online
- Crew sees their daily jobs on phone
- Upload before/after photos
- Auto-generate invoices
- Owner sees weekly metrics

## Tech Stack (Keep It Simple)

**Frontend:** Static HTML/CSS/JS (PWA)
**Backend:** Deno Deploy (serverless functions)
**Database:** Supabase (PostgreSQL + auth)
**Payments:** Stripe
**SMS:** Twilio
**Email:** SendGrid

**Why?** Cheap, simple, scales to 100 customers easily.

## What Actually Needs to Be Built

### Phase 1: Core Operations (NOW)
- [ ] Customer booking form → creates job in Supabase
- [ ] Crew mobile view → shows today's jobs
- [ ] Photo upload → stores in Supabase storage
- [ ] Mark job complete → auto-generates invoice
- [ ] Stripe payment link → send to customer via SMS
- [ ] Owner dashboard → shows this week's revenue

### Phase 2: Automation (NEXT)
- [ ] SMS to customer 24h before job
- [ ] Sunday evening owner text (weekly summary)
- [ ] Auto-send review request after payment
- [ ] Recurring jobs (weekly customers auto-schedule)

### Phase 3: Growth (LATER)
- [ ] Simple route optimization (minimize drive time)
- [ ] Basic customer retention tracking
- [ ] Marketing automation (social posts, SEO)

## Agents (What's Actually Needed)

**NOT 19 AGENTS.** Just these:

1. **intake** - Convert web leads to jobs
2. **quote** - Estimate pricing (simple formula)
3. **scheduler** - Assign jobs to crew
4. **invoice** - Generate invoice after job complete
5. **outbox** - Send SMS/email reliably
6. **digest** - Weekly owner summary
7. **review** - Request reviews after payment

That's it. 7 simple agents. Not "Game Designer" or "UX Architect" or other enterprise nonsense.

## Current State of Project

### What Works
- ✅ Web pages designed (HTML/CSS)
- ✅ Architecture planned (Deno + Supabase)
- ✅ Database schema defined
- ✅ Agent structure scaffolded

### What Doesn't Work Yet
- ❌ No backend API endpoints
- ❌ Forms don't submit to database
- ❌ No Supabase connection
- ❌ No SMS/email integration
- ❌ Agents are empty shells

### Next Steps
1. Connect Supabase (database + auth)
2. Build 3 core API endpoints:
   - POST /api/leads/intake (customer booking)
   - POST /api/jobs/:id/complete (crew marks done)
   - POST /api/invoices/:id/pay (Stripe webhook)
3. Wire up the web forms to API
4. Test with real crew on phones
5. Deploy to Deno Deploy

## Perplexity Research Skill

**Purpose:** Research before building features

**Use it for:**
- "Best practices for Stripe webhooks in Deno"
- "Supabase RLS policies for multi-tenant apps"
- "Twilio SMS webhook verification"
- "Deno Deploy environment variables"

**Don't use it for:**
- Analyzing local CSV files (use Desktop Commander)
- Things you already know
- Stable concepts (like "what is JavaScript")

**Cost:** ~$0.50/month for 50 research queries

## Budget Reality

### Monthly Costs (Current)
- Deno Deploy: $0 (free tier)
- Supabase: $0 (free tier)
- Twilio SMS: ~$30 (1K messages)
- SendGrid: $0 (free tier)
- Stripe: Per-transaction only
- Domain: $12/year
- **Total: ~$30/month**

### When You Hit 100 Customers
- Deno Deploy: $20/month (Pro)
- Supabase: $25/month (Pro)
- Twilio: $50/month
- SendGrid: $15/month
- **Total: ~$110/month**

Still cheap. Way cheaper than Jobber ($100/month) with less features you don't need.

## The Over-Engineering Problem

**What the docs say:** 90+ user stories, 9 epics, 4-phase roadmap, enterprise-scale agents

**What you need:** Customer books job → Crew does job → Get paid

Don't let perfect be the enemy of done. Build the basics first. Add fancy stuff later if you actually need it.

## Reality Check Questions

Before adding any feature, ask:
1. Will this make the owner money THIS MONTH?
2. Does it solve a current pain point?
3. Can it be built in 1 week or less?

If no to all three, skip it. Focus on:
- Get customers → Do jobs → Get paid → Repeat

That's the business. Everything else is noise.

## Current Focus (Nov 2025)

**THIS WEEK:** 
- Connect Supabase
- Build 3 API endpoints
- Wire up customer booking form
- Test end-to-end with 1 fake customer

**NEXT WEEK:**
- Crew mobile view
- Photo upload
- Invoice generation
- Stripe payment

**MONTH 1 GOAL:**
- Live with 5 real customers
- 3 crew members using the app daily
- $500 revenue through the system

Then iterate based on real feedback. Not imaginary enterprise use cases.

---

**Remember:** You're building for a 5-person lawn care business, not NASA. Keep it simple. Ship fast. Learn from real usage.
