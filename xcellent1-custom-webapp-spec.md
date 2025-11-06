# Xcellent 1 Lawn Care – Custom Web App Specification & Build Plan

## Executive Summary

Build a **simple, single-purpose web app** that serves as the central hub for Xcellent 1 operations: customer management, scheduling, invoicing, crew tracking, and automated owner updates. No need for Jobber or any external tool—**one app, everything he needs.**

**Build Option:** Low-code platform (Bubble, Flutterflow, or custom React) or no-code platform (Glide, Adalo)  
**Time to Build:** 2-4 weeks  
**Cost to Build:** $2K-$8K (depending on platform choice and complexity)  
**Cost to Maintain:** $20-100/month (hosting, database, domain)

---

## What the App Does (Core Features)

### 1. Customer Management
- **Add/edit customer:** Name, phone, email, address, property size, service type, recurring or one-time
- **Customer history:** All past jobs, invoices, reviews, notes
- **Recurring schedule:** Auto-generate weekly/bi-weekly jobs for recurring customers
- **Customer search:** Find by name, phone, neighborhood

### 2. Job Scheduling & Dispatch
- **Create job:** Date, time window, crew assignment, service type, notes
- **Crew view:** Each crew member sees their daily jobs on their phone
- **Before/after photos:** Crew can upload photos during/after job from phone
- **Job completion:** Mark job as done, record time spent, issues encountered

### 3. Invoicing & Payments
- **Auto-generate invoice:** Based on service type and customer
- **Payment link:** Send via SMS/email; customer pays online
- **Payment tracking:** See which invoices are paid/unpaid
- **Revenue dashboard:** Total revenue by day/week/month

### 4. Crew Management
- **Crew list:** Name, phone, rate, availability
- **Time tracking:** See hours worked (start/end time for each job)
- **Performance rating:** Average customer rating per crew member
- **Payroll export:** Generate weekly/monthly payroll for payments

### 5. Owner Dashboard (The Main Hub)
- **Weekly revenue:** This week vs. last week, month-to-date
- **Customers:** Total active, recurring %, churn rate
- **Crew efficiency:** Jobs per day per crew, revenue per crew
- **Compliance:** Insurance/license renewal dates with countdown
- **Action items:** Queue of things to do (upload photos, follow up on complaint, etc.)

### 6. Automated Owner Updates
- **Weekly text:** App sends automatic text Sunday 6pm with 5 key metrics
- **Monthly email:** Dashboard snapshot attached to email
- **Critical alerts:** Instant notification if customer complaint, payment fails, etc.

### 7. Marketing & Reviews
- **Google review link:** One-click link to request reviews on Google
- **Review counter:** Track new reviews, average rating
- **Google Business Profile integration:** Pull review feed into app

---

## Database Schema (What Data Gets Stored)

```
CUSTOMERS
├── customer_id (unique)
├── name
├── phone
├── email
├── address
├── neighborhood (Laplace, Norco, Destrehan, etc.)
├── property_size (sq ft)
├── service_type (mowing, aeration, maintenance, etc.)
├── recurring (Y/N)
├── recurring_frequency (weekly, bi-weekly, monthly)
├── recurring_day (Monday, Tuesday, etc. for weekly)
├── monthly_rate ($)
├── notes
├── date_created
├── date_last_service
└── status (active, paused, cancelled)

JOBS
├── job_id (unique)
├── customer_id (link to CUSTOMERS)
├── crew_id (link to CREW)
├── date_scheduled
├── time_window (8am-10am, etc.)
├── service_type (mowing, aeration, etc.)
├── status (pending, in_progress, completed, cancelled)
├── notes (gate code, dog, etc.)
├── before_photo_url
├── after_photo_url
├── time_spent (hours)
├── issues_noted (text)
├── customer_rating (1-5 stars)
├── date_completed
└── invoice_id (link to INVOICES)

INVOICES
├── invoice_id (unique)
├── customer_id (link to CUSTOMERS)
├── job_id (link to JOBS)
├── amount ($)
├── service_description
├── date_issued
├── date_due
├── status (sent, paid, overdue)
├── payment_method (online, cash, check)
├── payment_link (Stripe/Square)
├── date_paid
└── notes

CREW
├── crew_id (unique)
├── name
├── phone
├── email
├── pay_rate ($/hour or $/job)
├── status (active, inactive)
├── date_hired
├── total_hours_this_month
├── total_jobs_this_month
├── avg_customer_rating
└── notes

CREW_AVAILABILITY
├── crew_id
├── date
├── available (Y/N)
├── reason_if_no (sick, time off, etc.)

RECURRING_SCHEDULE
├── schedule_id
├── customer_id
├── service_type
├── frequency (weekly, bi-weekly)
├── day_of_week (Monday, etc.)
├── start_date
├── end_date (or NULL if ongoing)
└── auto_generate_jobs (Y/N)

OWNER_PREFERENCES
├── pref_id
├── text_alert_time (6pm)
├── email_alert_time (8am)
├── alert_critical_only (Y/N)
└── phone_number (for texts)

METRICS (daily snapshot for dashboard)
├── date
├── daily_revenue
├── weekly_revenue
├── monthly_revenue
├── jobs_completed
├── new_customers
├── cancellations
├── avg_rating
└── hours_total_crew
```

---

## Tech Stack Comparison

### Option 1: Bubble.io (No-Code, Easiest)

**Pros:**
- Drag-and-drop builder, no coding required
- Full-stack (database + frontend + backend included)
- Good for fast MVP
- Can integrate Stripe for payments, Twilio for SMS

**Cons:**
- Can be slow for large databases
- Expensive to scale ($29-495+/month)
- Vendor lock-in (can't export code)
- Learning curve for workflows

**Best for:** Fast build (2-3 weeks), low budget, willing to pay per month

**Cost:**
- Build: $0 (DIY) or $3K-5K (hire developer)
- Hosting: $29-500/month depending on usage
- **Total Year 1:** $3K-10K

---

### Option 2: Flutterflow (Low-Code)

**Pros:**
- Mobile-first (works great on phones for crews)
- Can export source code (not locked in)
- Firebase backend included
- Affordable ($0-70/month for app)

**Cons:**
- Still learning curve (more code-ish than Bubble)
- Separate database/backend costs
- Firebase can get expensive at scale

**Best for:** Custom control, mobile-first, willing to manage backend

**Cost:**
- Build: $2K-5K (hire developer)
- Hosting: $50-150/month (Flutterflow + Firebase + domain)
- **Total Year 1:** $2.5K-7K

---

### Option 3: Custom React App (Traditional Code)

**Pros:**
- Complete control
- Scalable to any size
- Can optimize costs
- Export/own all code

**Cons:**
- More expensive upfront ($5K-10K to build)
- Needs developer (can't be no-code)
- Requires ongoing maintenance

**Best for:** Long-term, large app, willing to invest upfront

**Cost:**
- Build: $5K-10K
- Hosting: $20-50/month (AWS, Vercel, etc.)
- Maintenance: $500-2K/month if issues arise
- **Total Year 1:** $7K-15K

---

### Option 4: Glide (No-Code, Spreadsheet-Based)

**Pros:**
- Fastest to build (1-2 weeks)
- Uses Google Sheets as database (super simple)
- Affordable ($20-200/month)
- Great for non-technical users

**Cons:**
- Limited for complex workflows
- Not ideal for large customer bases (Google Sheets has limits)
- Less customizable UI

**Best for:** MVP, want to test with real crew/customers, minimal budget

**Cost:**
- Build: $500-1K (simple setup)
- Hosting: $20-200/month
- **Total Year 1:** $1.5K-3.5K

---

## Recommended Approach: Glide MVP → Migrate to Bubble/Flutterflow

**Phase 1 (Weeks 1-2): Glide MVP**
- Build basic app in Glide using Google Sheets
- Test with 2-3 crew members and 20-30 customers
- Gather feedback: What works? What's missing?
- Cost: ~$1K + 40 hours

**Phase 2 (Weeks 3-6): Bubble/Flutterflow Full Build**
- Based on Phase 1 learnings, build full app in Bubble or Flutterflow
- Add all features, integrations (Stripe, Twilio, Google)
- Migrate Google Sheets data to proper database
- Train Lacardio and crew
- Cost: ~$3K-5K + 80-120 hours

**Phase 3 (Month 3+): Optimize & Iterate**
- Monitor usage, gather feedback
- Fix bugs, add tweaks
- Consider custom React migration if app grows beyond platform limits

---

## Feature Breakdown & Build Timeline

### Week 1: Foundation
- [ ] User authentication (Lacardio, crew members)
- [ ] Customer database with add/edit/search
- [ ] Basic job creation and assignment
- **Time:** 20 hours
- **Status:** MVP ready for internal testing

### Week 2: Crew Tools
- [ ] Crew mobile view (today's jobs)
- [ ] Photo upload (before/after)
- [ ] Job completion workflow
- [ ] Time tracking (start/stop for each job)
- **Time:** 20 hours
- **Status:** Crew can use app in field

### Week 3: Invoicing & Payments
- [ ] Auto-generate invoices from completed jobs
- [ ] Stripe/Square integration for online payments
- [ ] Payment tracking and reminders
- [ ] Revenue dashboard
- **Time:** 25 hours
- **Status:** Money flow automated

### Week 4: Owner Dashboard & Automation
- [ ] Owner dashboard (7 key metrics)
- [ ] Twilio SMS integration (Sunday text)
- [ ] Email digest (Monday morning)
- [ ] Compliance tracking & reminders
- [ ] Critical alerts (real-time)
- **Time:** 25 hours
- **Status:** Lacardio gets all updates automatically

### Week 5-6: Refinement & Deployment
- [ ] User training & documentation
- [ ] Bug fixes and optimization
- [ ] Deploy to production
- [ ] Set up recurring scheduling (auto-generate weekly jobs)
- **Time:** 20 hours
- **Status:** Live and operational

---

## Detailed Feature Specs

### Customer Add/Edit Screen

```
Form Fields:
├─ Name (required)
├─ Phone (required)
├─ Email (optional)
├─ Address (required)
├─ Neighborhood dropdown (Laplace, Norco, Destrehan, Hahnville)
├─ Property Size (sq ft)
├─ Service Type (checkbox: Mowing, Aeration, Fertilization, Cleanup, Premium)
├─ Recurring? (Yes/No toggle)
│  ├─ If Yes:
│  │  ├─ Frequency (Weekly / Bi-Weekly / Monthly)
│  │  ├─ Day of Week
│  │  └─ Monthly Rate ($)
├─ Notes (gate code, pets, access info)
└─ Status (Active / Paused / Cancelled)

Buttons: [Save Customer] [View History] [Cancel]
```

### Job Scheduling Screen

```
Job Creation Form:
├─ Customer (dropdown, search by name)
├─ Service Type (dropdown)
├─ Date (date picker)
├─ Time Window (time picker: start and end)
├─ Crew Assignment (dropdown of available crew)
├─ Notes (gate, customer requests, etc.)
└─ [Create Job] [Cancel]

Job View (for owner):
├─ Calendar view (see all jobs this week)
├─ List view (sortable by crew, date, status)
├─ Drag-to-reschedule (drag job to different time)
├─ Color-coded (pending=yellow, in_progress=blue, completed=green)
└─ Click to edit, mark done, or delete
```

### Crew Mobile View

```
Crew App (on phone):
├─ Header: "Welcome, [Crew Name]"
├─ Today's Schedule
│  ├─ Job 1: [Customer] @ [Address] [8am-10am]
│  │  └─ [Directions] [Call Customer] [Start Job]
│  ├─ Job 2: [Customer] @ [Address] [10:30am-12pm]
│  └─ Job 3: [Customer] @ [Address] [1pm-3pm]
├─ In-Progress Job:
│  ├─ [Stop Job] / [Job Complete]
│  ├─ Time spent: [counter]
│  ├─ Upload before photo
│  ├─ Upload after photo
│  ├─ Any issues? [text field]
│  └─ [Mark Complete] [Save & Next]
└─ Completed today: 2/3 jobs

Dashboard:
├─ Total jobs this month: 38
├─ Hours this month: 120
├─ Avg customer rating: 4.7/5
```

### Owner Dashboard Screen

```
Main Dashboard (Lacardio's view):
├─ 💰 This Week Revenue: $1,820 (↑ 12% vs last week)
├─ 📅 Month-to-Date: $8,400 / Target $8,500 (98%)
├─ 👥 Active Customers: 85 (72% recurring)
├─ Crew Efficiency: 
│  ├─ Crew A: 38 jobs, 4.8★ rating
│  └─ Crew B: 41 jobs, 4.5★ rating
├─ Reviews: 4.6★ avg (12 new this month)
├─ Compliance:
│  ├─ ✅ Insurance (renews Mar 2026)
│  ├─ ✅ License (renews Feb 2026)
│  └─ ✅ Workers Comp (renews Jan 2026)
├─ Action Items:
│  ├─ [ ] Upload GBP photos (due today)
│  ├─ [ ] Follow up: customer complaint (Crew A)
│  └─ [ ] Submit HOA proposal #1
├─ [View Details] [Edit] [Add Customer] [Create Job]
```

### Automated Text Alert (Sunday 6pm)

```
Sent automatically every Sunday 6pm to Lacardio:

Xcellent 1 Weekly Update (Nov 10)
💰 Revenue: $1,820 (↑ 12% vs last week)
📅 Jobs next week: 24 booked
👥 Crew: All good
⚠️ 1 complaint from Acadia St. job (fixing)
🎯 Priority: Upload GBP photos
Questions? Check your dashboard or reply.
```

---

## Integration Points

### Stripe/Square Payment Processing
- Customer receives invoice → clicks payment link → Stripe checkout
- Payment marked as "paid" in app automatically
- Daily reconciliation: App compares payments received vs. marked paid

### Twilio SMS Integration
- App sends Sunday 6pm text with weekly summary
- App sends SMS reminders to customers 24h before job
- Crew can SMS updates to owner ("Running late," "Job complete")

### Google Business Profile Integration
- Pull recent reviews into app
- One-click "request review" link for each completed job
- Aggregate review rating on owner dashboard

### Firebase Database (if using Flutterflow)
- All customer, job, invoice, crew data stored here
- Real-time sync (all users see latest data instantly)
- Automatic backup

### Google Sheets (if using Glide MVP)
- Customer list in one sheet
- Jobs in another sheet
- Invoices in another sheet
- Simple, transparent, owner can see all data

---

## Security & Access Control

### User Roles
- **Owner (Lacardio):** Full access (read + write all data)
- **Crew Member:** Can see only their own jobs, upload photos, mark complete
- **Customer (optional):** Can see their job history, upcoming jobs, pay invoices

### Data Protection
- Password-protected login (email + password)
- All data encrypted in transit (HTTPS)
- Regular backups (automated daily)
- No payment card data stored (Stripe/Square handles it)

---

## Maintenance & Scaling

### Year 1 (Small Business)
- 85 active customers
- 2-3 crew members
- 200-250 jobs/month
- App handles easily on any platform

### Year 2 (Growth)
- 150+ customers
- 3-4 crews
- 400+ jobs/month
- Glide may hit limits → migrate to Bubble or Flutterflow

### Year 3 (Scale)
- 250+ customers
- 5+ crews
- 600+ jobs/month
- Consider custom React app for full control and optimization

---

## Estimated Budget & Timeline

### Budget (Glide MVP → Bubble Full App)

| Phase | Item | Cost |
|---|---|---|
| **Design/Planning** | Spec + mockups | $500-1K |
| **Phase 1 (Glide MVP)** | Build + deploy | $500-1K |
| **Phase 2 (Bubble/FF)** | Build + deploy | $2K-4K |
| **Hosting Year 1** | Servers, domain, etc. | $200-400 |
| **Integrations** | Stripe, Twilio setup | $0 (included in platform) |
| **Training/Docs** | Owner + crew training | $500-1K |
| **TOTAL YEAR 1** | **$4K-7.5K** |
| **Year 2+** | Hosting + minor fixes | $300-600/month |

### Timeline

| Phase | Duration | Start | End |
|---|---|---|---|
| **Design & Planning** | 1 week | Week 1 | Week 1 |
| **Glide MVP Build** | 2 weeks | Week 2-3 | Week 3 |
| **MVP Testing** | 1 week | Week 3-4 | Week 4 |
| **Full Build** | 2-3 weeks | Week 5-7 | Week 7 |
| **Refinement** | 1 week | Week 8 | Week 8 |
| **Go Live** | - | Week 8 | - |
| **TOTAL** | **8 weeks** | Now | ~2 months |

---

## Comparison: Custom App vs. Jobber

| Feature | Jobber | Xcellent 1 Custom App |
|---|---|---|
| **Cost/month** | $40-100 | $20-100 |
| **Setup time** | 2-3 hours | 2-3 weeks (including build) |
| **Learning curve** | Medium (many features) | Easy (only what you need) |
| **Customization** | Limited (fixed features) | Complete (build what you want) |
| **Mobile crew app** | ✅ Yes (Jobber branded) | ✅ Yes (your branded) |
| **Owner dashboard** | ✅ Yes (many metrics) | ✅ Yes (7 key metrics, simplified) |
| **Invoicing** | ✅ Yes | ✅ Yes |
| **SMS/Email alerts** | ⚠️ Limited | ✅ Full automation |
| **Compliance tracking** | ❌ Not built in | ✅ Built in (renewal dates) |
| **Auto-scheduling** | ✅ Yes | ✅ Yes (for recurring jobs) |
| **Export data** | Limited | ✅ Full (you own it) |
| **Scalability** | ✅ Works to $1M+ | ✅ Works to $500K+ easily |

**Bottom line:** For $4K-7K upfront + $40-100/month, you get a **custom app built exactly for Xcellent 1**, vs. paying $40-100/month forever for Jobber with features he doesn't use.

---

## Next Steps

### Decision Point: Which approach?

**Option A: Keep it super simple (Text + Google Sheet + Folder)**
- Cost: $0
- Time: 2 hours to set up
- Best if: He wants minimal tech involvement

**Option B: Build Glide MVP first**
- Cost: $1.5K-2K
- Time: 2 weeks
- Best if: He wants to test a custom app before full investment

**Option C: Full custom app (Bubble)**
- Cost: $4K-7K
- Time: 8 weeks
- Best if: He wants a professional, branded solution ready to scale

**Option D: Stick with Jobber**
- Cost: $500-1,200/year
- Time: 3 hours setup
- Best if: He wants proven, no headaches

---

**Recommendation:** Start with **Option B (Glide MVP in 2 weeks)** to prove the concept. If it works, upgrade to **Option C (Bubble full app)** in weeks 3-8. Test with real customers/crew, then decide.

Would cost less, de-risk the full build, and give him operational data to justify the full investment.
