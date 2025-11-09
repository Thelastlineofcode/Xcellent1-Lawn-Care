# Xcellent1 Lawn Care - Development Roadmap

## Overview
4-week sprint to build a working lawn care SaaS MVP for a 5-person team. Customer bookings currently WAITLISTED until we hire 2 more crew members.

**Stack:** Deno + Supabase + Stripe + Fly.io + React + Tailwind CSS

**Team:** 1 Developer (You), 3 Field Workers, 2 to be hired

---

## Week 1: Foundation & Waitlist Landing Page
**Goal:** Database ready, landing page live with waitlist signup

### Epics & Stories
- **Epic 1:** Foundation (STORY-1 to STORY-4)
  - Create Supabase project
  - Design & migrate database schema
  - Implement RLS policies
  - Test CRUD operations

- **Epic 2:** Customer Waitlist (STORY-5 to STORY-9)
  - Design landing page UI
  - Create waitlist form component
  - Build `/api/waitlist` endpoint
  - Integrate email notifications
  - End-to-end testing

- **Epic 10:** Site Cleanup (STORY-39 to STORY-42)
  - Remove unused pages (dashboard.html, home.html, portal-index.html, client.html)
  - Update routing
  - Optimize assets
  - Deploy to Fly.io

### Deliverables
- [ ] Supabase project live and connected
- [ ] Landing page redesigned with Tailwind CSS
- [ ] Waitlist form working end-to-end
- [ ] Confirmation emails sending
- [ ] Old pages removed, site cleaned up
- [ ] Deployed to Fly.io with `fly deploy`

### Success Metrics
- [ ] Can manually insert data into Supabase
- [ ] Landing page loads in <2 seconds on mobile
- [ ] 1 test waitlist signup works
- [ ] No console errors
- [ ] xcellent1lawncare.com shows new landing page

---

## Week 2: Crew Hiring & Dashboard Foundation
**Goal:** Crew hiring page live, crew authentication working, job infrastructure ready

### Epics & Stories
- **Epic 3:** Crew Mobile Dashboard Foundation (STORY-10)
  - Create crew authentication flow

- **Epic 6:** Crew Hiring Page (STORY-23 to STORY-26)
  - Design hiring page
  - Create application form
  - Build `/api/applications` endpoint
  - Setup application notifications

### Deliverables
- [ ] Hiring page live at xcellent1lawncare.com/hiring
- [ ] Job application form working
- [ ] Applications stored in Supabase
- [ ] Owner receives notifications of applications
- [ ] Crew authentication system ready (OTP login)
- [ ] crew.html loads with login form

### Success Metrics
- [ ] 1 test crew member can log in
- [ ] 1 test application submitted
- [ ] Owner receives application notification

---

## Week 3: Crew Mobile & Job Management
**Goal:** Crew can see jobs, upload photos, mark jobs complete

### Epics & Stories
- **Epic 3:** Crew Mobile Dashboard (STORY-11 to STORY-13)
  - Build job list component
  - Implement photo upload & storage
  - Create job completion workflow

### Deliverables
- [ ] Crew can view their jobs on mobile
- [ ] Photo upload working from phone camera
- [ ] Crew can mark jobs complete
- [ ] Photos stored in Supabase Storage
- [ ] Owner receives completion notification

### Success Metrics
- [ ] 1 crew member completes a test job with photos
- [ ] Photos visible in owner dashboard
- [ ] No errors on mobile device

---

## Week 4: Payments & Owner Dashboard
**Goal:** End-to-end payment flow working, owner dashboard live with analytics

### Epics & Stories
- **Epic 4:** Owner Dashboard & Analytics (STORY-13 to STORY-17)
  - Build revenue dashboard
  - Create job analytics view
  - Implement real-time updates
  - Add export functionality

- **Epic 5:** Payment Processing (STORY-18 to STORY-22)
  - Design invoice template
  - Build `/api/invoices` endpoint
  - Integrate Stripe Checkout
  - Implement webhook handler
  - Test end-to-end payment flow

### Deliverables
- [ ] Invoice auto-generates after job completion
- [ ] Customer receives payment link via email
- [ ] Stripe payment processing working
- [ ] Owner dashboard shows real revenue
- [ ] Payment confirmation webhook verified
- [ ] Invoice marked paid in database

### Success Metrics
- [ ] 1 end-to-end test payment: job → invoice → payment → dashboard update
- [ ] Test payment processed via Stripe
- [ ] Owner dashboard displays correct revenue

---

## Month 2 & Beyond: Scale & Improve

### Immediate Next Steps (After Week 4)
1. **SMS Notifications** (STORY-35 to STORY-38)
   - Twilio integration
   - Customer reminder 24h before job
   - Owner weekly summary text

2. **Blog & Content** (STORY-27 to STORY-30)
   - Blog landing page
   - Blog post templates
   - Dropshipping product showcase

3. **Advanced Features**
   - Recurring job auto-scheduling
   - Review requests after payment
   - Route optimization
   - Customer portal

### Long-term (Month 3+)
- Marketing automation
- Advanced analytics
- E-commerce integration
- Mobile apps (iOS/Android)

---

## Technical Architecture

### Frontend Structure
```
web/
├── static/
│   ├── index.html              # Landing page + waitlist
│   ├── crew.html               # Crew mobile dashboard
│   ├── owner.html              # Owner analytics dashboard
│   ├── hiring.html             # Crew hiring page
│   ├── services.html           # Services description
│   ├── about.html              # About/team page
│   ├── blog.html               # Blog landing (future)
│   ├── css/
│   │   └── style.css           # Tailwind CSS (built)
│   ├── js/
│   │   ├── api.js              # API client functions
│   │   ├── auth.js             # Authentication logic
│   │   ├── crew.js             # Crew-specific JS
│   │   └── owner.js            # Owner dashboard JS
│   ├── images/                 # Assets (optimized)
│   └── fonts/                  # Web fonts
```

### Backend Structure (Deno)
```
api/
├── main.ts                     # Server entry point
├── deno.json                   # Dependencies
├── routes/
│   ├── waitlist.ts             # POST /api/waitlist
│   ├── auth.ts                 # POST /api/auth/login, /verify
│   ├── jobs.ts                 # GET/POST /api/jobs
│   ├── invoices.ts             # POST /api/invoices
│   ├── applications.ts         # POST /api/applications
│   └── webhooks.ts             # POST /api/webhooks/stripe
├── db/
│   ├── schema.sql              # Database schema
│   └── migrations/             # Migration scripts
├── middleware/
│   ├── auth.ts                 # JWT verification
│   ├── cors.ts                 # CORS configuration
│   └── rateLimit.ts            # Rate limiting
├── utils/
│   ├── email.ts                # Email service (Resend/SendGrid)
│   ├── stripe.ts               # Stripe client
│   └── validation.ts           # Input validation
└── .env.example                # Environment template
```

### Database Schema (Supabase)
```sql
-- Core tables
customers (id, name, email, phone, address, created_at, updated_at)
waitlist (id, name, email, phone, address, status, created_at)
crew (id, name, email, phone, status, availability, created_at)
jobs (id, customer_id, crew_id, date, address, description, status, photos, created_at, completed_at)
payments (id, job_id, amount, status, stripe_id, created_at, paid_at)
invoices (id, job_id, customer_id, amount, status, created_at, sent_at, paid_at)

-- Relationships
jobs.customer_id → customers.id
jobs.crew_id → crew.id
payments.job_id → jobs.id
invoices.job_id → jobs.id
```

---

## Deployment Pipeline

### Development
```bash
# Local development
deno task dev        # Start Deno server on localhost:8000
# Develop HTML/CSS/JS in web/static/

# Test
deno task test       # Run test suite

# Commit & push
git add .
git commit -m "feature: add waitlist form"
git push origin main
```

### Staging (Optional)
```bash
fly deploy --app xcellent1-lawn-care-staging
```

### Production
```bash
# Deploy to Fly.io (main branch auto-deploys or manual)
fly deploy --app xcellent1-lawn-care

# Verify
fly status --app xcellent1-lawn-care
```

---

## Success Criteria - End of Week 4

### Customer Perspective
- [ ] Can sign up for waitlist on landing page
- [ ] Receives confirmation email
- [ ] Can see company services and team
- [ ] Can apply to join crew

### Crew Perspective
- [ ] Can log in with email/OTP
- [ ] Can see jobs assigned for today
- [ ] Can upload photos of completed work
- [ ] Can mark jobs complete

### Owner Perspective
- [ ] Can see all crew applications
- [ ] Can view today's jobs completed
- [ ] Can see revenue dashboard
- [ ] Can receive payment confirmations
- [ ] Can access admin panel

### Technical
- [ ] 0 critical bugs
- [ ] All endpoints tested and documented
- [ ] Performance: pages load <2s on mobile
- [ ] Security: all data encrypted, RLS enforced
- [ ] Monitoring: error tracking configured
- [ ] CI/CD: automated tests passing

---

## Key Dependencies & Services

### Frontend Dependencies
- Tailwind CSS (styling)
- shadcn/ui (component library, if used)
- Supabase client-js (database)
- Stripe.js (payments)

### Backend Dependencies
- Supabase server library (Deno)
- Stripe SDK (Deno)
- Email service (Resend, SendGrid, or Mailgun)
- SMS service (Twilio, optional)

### External Services
- Supabase (Database + Auth + Storage)
- Stripe (Payment processing)
- Fly.io (Hosting/Deployment)
- Resend or SendGrid (Email)
- Twilio (SMS, optional)

### Monitoring & Analytics
- Sentry or LogRocket (Error tracking)
- Google Analytics (Traffic)
- Stripe Dashboard (Payment analytics)

---

## Risk Mitigation

### Risks & Mitigation
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Crew member can't log in | High | Setup fallback: phone call verification |
| Stripe payment fails | High | Retry logic, manual payment option |
| Database down | Critical | Supabase auto-backup, status page |
| Photos won't upload | Medium | Offline queue, auto-retry when online |
| Email delays | Medium | Real-time SMS notification backup |
| Scope creep | High | Strict adherence to build-plan.md, ship MVP first |

---

## Team Workflow

### Daily Standup (Async)
Update in Slack:
- What I shipped yesterday
- What I'm working on today
- Any blockers

### Code Review
- Commit to feature branch
- Open PR with description
- Review for: functionality, security, performance, tests
- Merge to main once approved

### Deployment
- Push to main → Automatic tests run
- Manual `fly deploy` to production
- Monitor error tracking for 30 minutes
- Announce to team

---

## Support & Documentation

### Required Documentation
- [ ] README.md - Setup instructions
- [ ] API.md - Endpoint documentation
- [ ] DATABASE.md - Schema documentation
- [ ] DEPLOYMENT.md - How to deploy
- [ ] ARCHITECTURE.md - System architecture (already exists)

### Communication Channels
- Slack: daily updates, quick questions
- GitHub Issues: bugs and feature requests
- Google Docs: planning and design docs
- Email: important announcements

---

## Next Steps - Start Now

**Pick ONE and start immediately:**

### Option A: Week 1 Foundation (Database)
```bash
# 1. Create Supabase project at supabase.com
# 2. Copy connection string to .env
# 3. Run migrations from db/schema.sql
# 4. Test connection from Deno backend
```

### Option B: Week 1 Frontend (Landing Page)
```bash
# 1. Backup current index.html
# 2. Create new index.html with Tailwind CSS
# 3. Add waitlist form component
# 4. Test on mobile device
```

### Option C: Research & Planning
```bash
# Use Perplexity research to unblock any questions
python3 -c "from src.skills.perplexity_research import perplexityResearch; \
result = perplexityResearch('Supabase + Deno best practices for auth'); \
print(result['answer'])"
```

**Recommendation:** Start with Option A (database) since everything depends on it. Should take 2-3 hours.

Choose one. Do it now. Build momentum. 🚀
