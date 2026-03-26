const port = Number(Deno.env.get("PORT") || 8000); // if using std/http
serve(handler, { hostname: "0.0.0.0", port });const port =
Number(Deno.env.get("PORT") || 8000); // if using std/http serve(handler, {
hostname: "0.0.0.0", port });# Xcellent1 Build Plan - Keep It Simple

## 🎯 Goal

Working lawn care app for 5-person team. Customers book → Crew works → Get paid.

## ✅ What's Done

- Web pages designed (HTML/CSS)
- Architecture planned (Deno + Supabase)
- Database schema defined
- Perplexity research skill ready

## 🚀 Next 4 Weeks

### Week 1: Database & Auth

**Goal:** Supabase connected, can store data

**Tasks:**

1. Create Supabase project
2. Run database migrations (schema from docs/Architecture.md)
3. Set up Row Level Security policies
4. Test: Can insert/read from tables

**Success:** Can add a customer and job manually in Supabase dashboard

---

### Week 2: Customer Booking

**Goal:** Customer fills form → job created in database

**Tasks:**

1. Create `/api/leads/intake` endpoint (Deno)
2. Wire up index.html form to API
3. Add form validation
4. Test: Fill form → job appears in database

**Success:** Customer booking works end-to-end

**Research first:**

```python
from src.skills.perplexity_research import perplexityResearch
result = perplexityResearch(
    "Deno Deploy API endpoint with Supabase insert best practices",
    model='sonar-pro'
)
```

---

### Week 3: Crew Mobile & Photos

**Goal:** Crew sees jobs on phone, uploads photos

**Tasks:**

1. Create `/api/jobs` endpoint (list today's jobs)
2. Wire up crew.html to show jobs
3. Add photo upload to Supabase Storage
4. Create `/api/jobs/:id/complete` endpoint
5. Test: Crew marks job done with photos

**Success:** Crew member can complete a job on their phone

**Research first:**

```python
result = perplexityResearch(
    "Supabase Storage file upload from mobile web app best practices",
    model='sonar-pro'
)
```

---

### Week 4: Payments & Owner Dashboard

**Goal:** Invoice sent → customer pays → owner sees revenue

**Tasks:**

1. Create `/api/invoices` endpoint (auto-generate after job)
2. Integrate Stripe Checkout
3. Add `/api/webhooks/stripe` (mark invoice paid)
4. Wire up owner.html to show real data
5. Test: Complete job → invoice → payment → dashboard updates

**Success:** Full flow works. Money in Stripe, data in dashboard.

**Research first:**

```python
result = perplexityResearch(
    "Stripe Checkout integration with Deno Deploy and webhook verification",
    model='sonar-pro'
)
```

---

## 📋 After Month 1

### Must-Have Next

1. SMS notifications (Twilio)
   - Customer reminder 24h before job
   - Owner weekly summary text
2. Recurring jobs auto-scheduling
3. Review request after payment

### Nice-to-Have Later

1. Route optimization
2. Marketing automation
3. E-commerce dropshipping
4. Advanced analytics

**But first:** Get the core working with real customers.

---

## 🛠️ Daily Development Workflow

### Before Starting Any Feature

1. **Research** (if needed):

```bash
cd /Users/houseofobi/Documents/GitHub/Xcellent1-Lawn-Care
python3 -c "from src.skills.perplexity_research import perplexityResearch; \
print(perplexityResearch('YOUR QUESTION HERE')['answer'])"
```

2. **Plan** (5 min):
   - What's the smallest thing that works?
   - What can I skip for now?

3. **Build** (chunk it):
   - Write endpoint
   - Test with curl/Postman
   - Wire up frontend
   - Test end-to-end

4. **Deploy & Test**:
   - Push to GitHub
   - Deploy to Deno Deploy
   - Test on real phone

### When Stuck

1. Use Perplexity Research for technical questions
2. Use Desktop Commander for file analysis
3. Keep it simple - skip fancy features
4. Ship something that works, improve later

---

## 📊 Success Metrics

### Week 1

- [ ] Supabase connected
- [ ] Can manually add data

### Week 2

- [ ] 1 test customer booking works

### Week 3

- [ ] 1 crew member completes job on phone

### Week 4

- [ ] 1 end-to-end transaction: booking → work → payment

### Month 2

- [ ] 5 real customers using the app
- [ ] 3 crew members using daily
- [ ] $500 revenue through system

### Month 3

- [ ] 15 customers
- [ ] Owner rarely touches the system
- [ ] $2K revenue through system

---

## 💡 Guiding Principles

1. **Ship fast, iterate faster**
   - Working > perfect
   - 1 week features, not 1 month epics

2. **Only build what you need NOW**
   - Hiring 2 people? Build hiring page.
   - Have 5 customers? Don't build for 500.

3. **Use research, don't reinvent**
   - Perplexity first, code second
   - Learn from others' mistakes

4. **Test with real users early**
   - Week 2: Test booking with 1 friend
   - Week 3: Test crew app with actual crew
   - Week 4: Test payment with $1 charge

5. **Owner time is the most valuable**
   - Automate what takes him time
   - Don't automate what's already fine

---

## 🚨 Red Flags (Stop and Simplify)

- Feature takes more than 1 week
- Adding 3rd party service that costs $50+/month
- Building something "for scale" when you have 5 customers
- Copying enterprise patterns (you're not an enterprise)
- "Just in case" features (you ain't gonna need it)

When in doubt: **Ship the minimum. Add later if needed.**

---

## 📞 Current Team & Roles

**Owner (You):**

- Builds the app
- Manages crew
- Gets customer bookings

**3 Field Workers:**

- Do the lawn work
- Use crew.html on phones
- Upload photos after jobs

**2 Workers Needed:**

- Same as above
- Hiring page live: index.html

**That's it.** No "Head of Operations" or "Marketing Director". Just people who
mow lawns and the person who built this app.

---

## Next Step Right Now

Pick ONE:

**Option A:** Start Week 1 (Supabase setup)

```bash
# Create Supabase project at supabase.com
# Copy connection string to .env
# Run migrations from db/schema.sql
```

**Option B:** Research a technical question

```bash
cd /Users/houseofobi/Documents/GitHub/Xcellent1-Lawn-Care
python3 -c "from src.skills.perplexity_research import perplexityResearch; \
print(perplexityResearch('Supabase quickstart for Deno Deploy')['answer'])"
```

**Option C:** Test Perplexity skill first

```bash
# Just make sure it works
python3 -c "from src.skills.perplexity_research import perplexityResearch; \
result = perplexityResearch('Hello world test'); \
print('✅ Perplexity works!' if result['success'] else '❌ Error')"
```

Choose one. Do it now. Build momentum.
