# Xcellent1 Lawn Care - EPICS

## Epic 1: Foundation (Week 1)

**Goal:** Core infrastructure ready to support customer bookings and crew operations

### Description
**Related FRs:** FR-001

Set up Supabase database with proper schema, authentication, Row Level Security policies, and API structure. Establish foundation for all future features.

### Acceptance Criteria

- [ ] Supabase project created and connected
- [ ] Database schema migrated (customers, jobs, payments tables)
- [ ] Row Level Security policies enforced
- [ ] Can insert/read data from Supabase dashboard
- [ ] Environment variables configured (.env)
- [ ] Deno backend able to connect and query database
- [ ] Basic CRUD endpoints working (curl tested)

### Stories

- STORY-1: Create Supabase Project & Connection
- STORY-2: Design & Migrate Database Schema
- STORY-3: Implement Row Level Security Policies
- STORY-4: Test Database Connectivity & CRUD Operations

---

## Epic 2: Customer Waitlist (Week 1-2)

**Goal:** Professional landing page with customer waitlist signup form

### Description
**Related FRs:** FR-002

Rebuild landing page with modern UI (Tailwind CSS, mobile-first), integrate Instagram/Facebook photos, and replace booking form with waitlist signup. Create waitlist storage in Supabase.

### Acceptance Criteria

- [ ] Landing page redesigned (mobile-first, professional)
- [ ] Instagram/Facebook photos integrated
- [ ] Waitlist form collects: name, email, phone, address, service date
- [ ] Form validation on frontend and backend
- [ ] Waitlist data stored in Supabase
- [ ] Success message displayed after signup
- [ ] Email confirmation sent to customer
- [ ] Owner receives notification of new waitlist signup
- [ ] Responsive on mobile, tablet, desktop

### Stories

- STORY-3: Design Landing Page UI/UX
- STORY-4: Create Waitlist Form Component
- STORY-5: Build `/api/waitlist` Endpoint
- STORY-6: Integrate Email Notifications (Resend or SendGrid)
- STORY-7: Test Waitlist Flow End-to-End

---

## Epic 3: Crew Mobile Dashboard (Week 2-3)

**Goal:** Mobile-first crew interface for job management and photo uploads

### Description
**Related FRs:** FR-003, FR-004

Build crew.html as a responsive mobile dashboard where crew members can view assigned jobs, mark them complete, and upload photos. Integrate with job management API.

### Acceptance Criteria

- [ ] Crew authentication (email/phone login)
- [ ] Display today's jobs (job list, addresses, descriptions)
- [ ] Job details modal with customer info
- [ ] Photo upload from mobile camera
- [ ] Mark job as complete
- [ ] Photos stored in Supabase Storage
- [ ] Offline support (service worker)
- [ ] Battery-friendly (dark mode option)
- [ ] Works on iPhone, Android, mobile browsers

### Stories

- STORY-8: Create Crew Authentication Flow
- STORY-9: Build Job List Component
- STORY-10: Implement Photo Upload & Storage
- STORY-11: Create Job Completion Workflow
- STORY-12: Add Offline Support (Service Worker)

---

## Epic 4: Owner Dashboard & Analytics (Week 3-4)

**Goal:** Owner visibility into revenue, crew performance, and business metrics

### Description
**Related FRs:** FR-006

Build owner.html as analytics dashboard showing revenue, completed jobs, crew performance, pending payments, and customer feedback. Real-time data from Supabase.

### Acceptance Criteria

- [ ] Owner authentication (secure login)
- [ ] Revenue dashboard (daily, weekly, monthly)
- [ ] Jobs completed today/this week
- [ ] Crew performance metrics
- [ ] Pending invoices & payments
- [ ] Customer feedback/reviews
- [ ] Export data (CSV, PDF)
- [ ] Real-time updates (Supabase real-time subscriptions)
- [ ] Mobile-responsive

### Stories

- STORY-13: Create Owner Authentication
- STORY-14: Build Revenue Dashboard
- STORY-15: Create Job Analytics View
- STORY-16: Implement Real-Time Updates
- STORY-17: Add Export Functionality

---

## Epic 5: Payment Processing (Week 4)

**Goal:** Automated invoicing and Stripe payment integration

### Description
**Related FRs:** FR-005

Generate invoices after job completion, integrate Stripe Checkout for customer payments, handle webhooks for payment confirmation, and update owner dashboard with revenue.

### Acceptance Criteria

- [ ] Invoice auto-generated after job completion
- [ ] Invoice includes job details, crew member, photos, total cost
- [ ] Stripe Checkout integration
- [ ] Customer receives payment link via email
- [ ] Payment webhook verified and processed
- [ ] Invoice marked paid in Supabase
- [ ] Owner dashboard updates in real-time
- [ ] Payment reconciliation working

### Stories

- STORY-18: Design Invoice Template
- STORY-19: Build `/api/invoices` Endpoint
- STORY-20: Integrate Stripe Checkout
- STORY-21: Implement Webhook Handler
- STORY-22: Test End-to-End Payment Flow

---

## Epic 6: Crew Hiring Page (Week 1-2)

**Goal:** Professional hiring page to recruit crew members

### Description
**Related FRs:** FR-001

Create hiring.html page showcasing why someone should join the team, job responsibilities, pay, benefits, and application form. Store applications in Supabase for owner review.

### Acceptance Criteria

- [ ] Hiring page designed (professional, benefits-focused)
- [ ] Job description (responsibilities, requirements, benefits)
- [ ] Application form (name, email, phone, experience, availability)
- [ ] Applications stored in Supabase
- [ ] Owner receives email notification of new application
- [ ] Mobile-responsive

### Stories

- STORY-23: Design Hiring Page
- STORY-24: Create Application Form Component
- STORY-25: Build `/api/applications` Endpoint
- STORY-26: Setup Application Notifications

---

## Epic 7: Blog & Content (Week 2+)

**Goal:** Educational blog for SEO and dropshipping product showcase

### Description
**Related FRs:** FR-001, FR-002

Build blog.html landing page and blog post structure. Create categories for lawn care tips and dropshipping products. Optimize for search and social sharing.

### Acceptance Criteria

- [ ] Blog landing page with post listings
- [ ] Blog post template (title, content, images, author, date)
- [ ] Categories (lawn care, products)
- [ ] Search functionality
- [ ] Social sharing buttons
- [ ] SEO metadata (title, description, keywords)
- [ ] Mobile-responsive
- [ ] Future: CMS integration or headless CMS ready

### Stories

- STORY-27: Design Blog Landing Page
- STORY-28: Create Blog Post Template
- STORY-29: Implement Search/Filter
- STORY-30: Setup Blog Posting Workflow

---

## Epic 8: Services & About Pages (Week 1-2)

**Goal:** Professional information pages showcasing services and team

### Description
**Related FRs:** FR-002

Create services.html detailing offerings (mowing, fertilizing, aeration, seeding) with pricing and photos. Create about.html with team photos and company mission.

### Acceptance Criteria

- [ ] Services page with offerings and descriptions
- [ ] Service pricing displayed
- [ ] Before/after photos from Instagram/Facebook
- [ ] About page with team photos
- [ ] Company mission/values statement
- [ ] Mobile-responsive
- [ ] SEO optimized

### Stories

- STORY-31: Design Services Page
- STORY-32: Design About Page
- STORY-33: Integrate Social Media Photos
- STORY-34: Add SEO Metadata

---

## Epic 9: Notifications & Alerts (Week 2+)

**Goal:** Keep customers, crew, and owner informed in real-time

### Description
**Related FRs:** FR-007

Implement email and SMS notifications for waitlist confirmations, job assignments, job completions, payment confirmations, and owner summaries.

### Acceptance Criteria

- [ ] Email service configured (Resend, SendGrid, Mailgun)
- [ ] SMS service configured (Twilio)
- [ ] Customer waitlist confirmation email
- [ ] Crew job assignment notifications
- [ ] Job completion notifications
- [ ] Payment confirmation emails
- [ ] Owner weekly SMS summary
- [ ] Notification templates professional and branded

### Stories

- STORY-35: Setup Email Service
- STORY-36: Setup SMS Service (Twilio)
- STORY-37: Create Notification Templates
- STORY-38: Implement Notification Queue

---

## Epic 10: Site Cleanup & Deployment (Week 1)

**Goal:** Remove old code, restructure for production, deploy to Fly.io

### Description
**Related FRs:** FR-001

Consolidate pages (remove redundant files like dashboard.html, home.html, portal-index.html), update routing, ensure all assets are optimized, and redeploy.

### Acceptance Criteria

- [ ] Old/unused pages removed (dashboard.html, home.html, portal-index.html, client.html)
- [ ] Routing updated (correct pages at correct URLs)
- [ ] Assets optimized (images compressed, CSS minified)
- [ ] Favicon and metadata updated
- [ ] 404 page created
- [ ] SSL certificate verified
- [ ] Performance tested (Lighthouse score 90+)
- [ ] Deployed to Fly.io with `fly deploy`

### Stories

- STORY-39: Audit & Remove Unused Pages
- STORY-40: Optimize Assets & Images
- STORY-41: Test Performance & SEO
- STORY-42: Deploy to Fly.io

---

## Epic 11: Security & Compliance (Ongoing)

**Goal:** Protect customer data and ensure compliance

### Description
**Related FRs:** FR-001

Implement authentication security, data encryption, GDPR compliance, SSL/TLS, and audit logging.

### Acceptance Criteria

- [ ] Passwords hashed (bcrypt)
- [ ] Data encrypted in transit (HTTPS/TLS)
- [ ] Rate limiting on API endpoints
- [ ] SQL injection protection (parameterized queries)
- [ ] CORS configured correctly
- [ ] Privacy policy written and published
- [ ] GDPR-compliant data deletion
- [ ] Audit logging of sensitive operations

### Stories

- STORY-43: Implement Rate Limiting
- STORY-44: Add CORS Configuration
- STORY-45: Write Privacy Policy
- STORY-46: Setup Audit Logging

---

## Epic 12: Monitoring & Analytics (Ongoing)

**Goal:** Visibility into system health and business metrics

### Description
**Related FRs:** FR-006

Setup error tracking, performance monitoring, uptime monitoring, and analytics dashboards.

### Acceptance Criteria

- [ ] Error tracking (Sentry or similar)
- [ ] Performance monitoring (response times)
- [ ] Uptime monitoring (Fly.io health checks)
- [ ] Custom analytics (bookings, conversions, revenue)
- [ ] Alerts for critical errors
- [ ] Dashboard for monitoring

### Stories

- STORY-47: Setup Error Tracking
- STORY-48: Configure Performance Monitoring
- STORY-49: Create Monitoring Dashboard
- STORY-50: Setup Alert Rules
