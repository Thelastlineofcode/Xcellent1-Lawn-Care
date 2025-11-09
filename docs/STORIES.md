# Xcellent1 Lawn Care - USER STORIES

## Week 1 Stories (Foundation & Waitlist)

### STORY-1: Create Supabase Project & Connection
**Epic:** Epic 1: Foundation
**Priority:** P0 (Blocking)
**Effort:** 3 points

**As a** developer
**I want** to set up a Supabase project and connect it to the Deno backend
**So that** we have a reliable PostgreSQL database for customer and job data

**Acceptance Criteria:**
- [ ] Supabase account created at supabase.com
- [ ] New project created (region: closest to Houston)
- [ ] Supabase API key and URL obtained
- [ ] Connection tested from Deno backend
- [ ] Environment variables (.env) configured with SUPABASE_URL and SUPABASE_KEY
- [ ] Documentation updated with connection string format

**Technical Details:**
- Use Supabase JavaScript client for Deno
- Test with simple query: `SELECT NOW()`
- Error handling for connection failures

**Definition of Done:**
- Code merged to main
- .env.example updated
- Connection test passes in CI/CD

---

### STORY-2: Design & Migrate Database Schema
**Epic:** Epic 1: Foundation
**Priority:** P0 (Blocking)
**Effort:** 5 points

**As a** developer
**I want** to design and migrate the database schema
**So that** we can store customers, jobs, crew, payments, and waitlist data

**Acceptance Criteria:**
- [ ] Schema includes: customers, jobs, crew, payments, waitlist, invoices tables
- [ ] Tables have appropriate relationships (foreign keys)
- [ ] Timestamps (created_at, updated_at) on all tables
- [ ] Indexes created on frequently queried columns
- [ ] Migration script created and tested
- [ ] Schema documentation written

**Tables Needed:**
```
- customers (id, name, email, phone, address, created_at, updated_at)
- waitlist (id, name, email, phone, address, status, created_at)
- jobs (id, customer_id, crew_id, date, address, description, status, photos, created_at, completed_at)
- crew (id, name, email, phone, status, availability, created_at)
- payments (id, job_id, amount, status, stripe_id, created_at, paid_at)
- invoices (id, job_id, customer_id, amount, status, created_at, sent_at, paid_at)
```

**Definition of Done:**
- Migration runs without errors
- All tables visible in Supabase dashboard
- Test data inserted successfully

---

### STORY-3: Implement Row Level Security Policies
**Epic:** Epic 1: Foundation
**Priority:** P1 (Important)
**Effort:** 4 points

**As a** developer
**I want** to configure RLS policies on Supabase tables
**So that** crew members can only see their own jobs and customers can only see their own bookings

**Acceptance Criteria:**
- [ ] RLS enabled on all tables
- [ ] Crew policy: can SELECT/UPDATE only own jobs
- [ ] Customers policy: can SELECT only own bookings
- [ ] Owner policy: full access to all data
- [ ] Anonymous policy for waitlist: can INSERT only
- [ ] Policies tested and documented

**Policies to Implement:**
- crew_jobs: crew_id = auth.uid()
- customer_jobs: customer_id = auth.uid()
- owner_all: admin role has full access
- waitlist_insert: anyone can insert

**Definition of Done:**
- Policies created and enabled
- Manual tests pass (JWT token verification)
- Documentation updated

---

### STORY-4: Test Database Connectivity & CRUD Operations
**Epic:** Epic 1: Foundation
**Priority:** P0 (Blocking)
**Effort:** 3 points

**As a** developer
**I want** to test CRUD operations from the Deno backend
**So that** I know the database connection works end-to-end

**Acceptance Criteria:**
- [ ] CREATE: Insert test customer → verified in dashboard
- [ ] READ: Query customer by ID → returns correct data
- [ ] UPDATE: Modify customer name → verified update
- [ ] DELETE: Remove test customer → verified deletion
- [ ] Error handling tested (duplicate key, not found, permissions)
- [ ] Test file created with examples

**Test Cases:**
```
- Insert valid customer
- Insert duplicate email (should fail)
- Query non-existent record (should return null)
- Update job status to complete
- Delete from RLS-protected table without permissions (should fail)
```

**Definition of Done:**
- All tests pass locally
- Code committed with test examples
- Errors logged appropriately

---

### STORY-5: Design Landing Page UI/UX
**Epic:** Epic 2: Customer Waitlist
**Priority:** P0 (Blocking)
**Effort:** 5 points

**As a** designer/developer
**I want** to design a mobile-first landing page
**So that** customers get a professional first impression and understand our services

**Acceptance Criteria:**
- [ ] Mobile-first layout (320px minimum width)
- [ ] Hero section with headline and CTA
- [ ] Services section with cards/descriptions
- [ ] Waitlist signup form section
- [ ] Crew hiring section ("We're Hiring!")
- [ ] Footer with contact info
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Uses Tailwind CSS for styling
- [ ] Responsive on desktop/tablet/mobile

**Design Requirements:**
- Color scheme: professional, lawn-focused (greens, whites)
- Typography: clean and readable (Tailwind default or Inter font)
- Images: placeholder for Instagram/Facebook photos
- Button: prominent CTA button for waitlist
- Form: simple, clean inputs

**Definition of Done:**
- Figma/design file created
- HTML mockup built with Tailwind
- Approved by owner
- Committed to repo

---

### STORY-6: Create Waitlist Form Component
**Epic:** Epic 2: Customer Waitlist
**Priority:** P0 (Blocking)
**Effort:** 3 points

**As a** user
**I want** to sign up for the waitlist
**So that** I can be notified when the lawn care service is available

**Acceptance Criteria:**
- [ ] Form collects: name, email, phone, address, preferred service date
- [ ] Validation: email format, phone format, required fields
- [ ] Submit button disabled until valid
- [ ] Error messages displayed for invalid fields
- [ ] Success message shown after submission
- [ ] Form styled with Tailwind CSS
- [ ] Mobile-friendly (touch targets 44px+)

**Technical Details:**
- Frontend validation (HTML5 + JS)
- Backend validation (Deno API)
- Phone format: (XXX) XXX-XXXX or +1 XXX XXX XXXX
- Email format: standard RFC 5322
- Clear error messages

**Definition of Done:**
- Form appears on index.html
- All validations working
- Manual testing on mobile device

---

### STORY-7: Build `/api/waitlist` Endpoint
**Epic:** Epic 2: Customer Waitlist
**Priority:** P0 (Blocking)
**Effort:** 4 points

**As a** developer
**I want** to create a `/api/waitlist` POST endpoint
**So that** waitlist signups are saved to the database

**Acceptance Criteria:**
- [ ] POST /api/waitlist accepts JSON body
- [ ] Validates request body (schema validation)
- [ ] Inserts data into waitlist table
- [ ] Returns 201 on success with waitlist record
- [ ] Returns 400 on validation error with message
- [ ] Rate limiting: max 5 requests per IP per minute
- [ ] Error logging implemented

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "(713) 555-1234",
  "address": "123 Main St, Houston, TX 77001",
  "service_date": "2025-11-20"
}
```

**Response (Success):**
```json
{
  "status": "success",
  "id": "uuid-here",
  "message": "You're on the waitlist!"
}
```

**Definition of Done:**
- Endpoint tested with curl
- Rate limiting verified
- Error cases handled
- Endpoint documented in API.md

---

### STORY-8: Integrate Email Notifications
**Epic:** Epic 2: Customer Waitlist
**Priority:** P1 (Important)
**Effort:** 4 points

**As a** customer
**I want** to receive an email confirming my waitlist signup
**So that** I know my submission was received

**And as** the owner
**I want** to be notified of new waitlist signups
**So that** I can track interest

**Acceptance Criteria:**
- [ ] Email service configured (Resend, SendGrid, or Mailgun)
- [ ] Confirmation email sent to customer within 1 minute
- [ ] Owner notification email sent immediately
- [ ] Emails are professional and branded
- [ ] Unsubscribe link included
- [ ] Error handling if email fails (logged but doesn't block signup)

**Email Templates:**
- Customer confirmation: "Thank you for signing up!"
- Owner notification: "New waitlist signup: John Doe"

**Definition of Done:**
- Email service account created
- API key configured in .env
- Test emails received successfully
- Template files created

---

### STORY-9: Test Waitlist Flow End-to-End
**Epic:** Epic 2: Customer Waitlist
**Priority:** P0 (Blocking)
**Effort:** 3 points

**As a** QA engineer
**I want** to test the complete waitlist signup flow
**So that** we can launch with confidence

**Acceptance Criteria:**
- [ ] User fills form on index.html
- [ ] Form validates correctly
- [ ] POST to /api/waitlist succeeds
- [ ] Data appears in Supabase within 30 seconds
- [ ] Confirmation email received by customer
- [ ] Owner notification email received
- [ ] Success message displays to user
- [ ] Works on mobile, tablet, desktop

**Test Steps:**
1. Open index.html on mobile
2. Scroll to waitlist section
3. Fill all fields with valid data
4. Submit form
5. Verify success message
6. Check Supabase for new record
7. Check email inbox for confirmation and owner notification

**Definition of Done:**
- End-to-end test passes on 3 devices
- No console errors
- Ready for production deployment

---

## Week 2-3 Stories (Crew & Crew Hiring)

### STORY-10: Create Crew Authentication Flow
**Epic:** Epic 3: Crew Mobile Dashboard
**Priority:** P0 (Blocking)
**Effort:** 5 points

**As a** crew member
**I want** to log in with my email/phone
**So that** I can access my job assignments

**Acceptance Criteria:**
- [ ] Login form on crew.html with email or phone
- [ ] OTP (one-time password) sent via email or SMS
- [ ] User enters OTP to verify
- [ ] Session token created and stored
- [ ] Token persists across page reloads (localStorage)
- [ ] Logout functionality
- [ ] Password reset flow
- [ ] Mobile-friendly form

**Technical Details:**
- Use Supabase Auth or custom JWT
- OTP valid for 15 minutes
- Rate limiting: 3 attempts per phone number per hour
- Secure token storage (HttpOnly cookies preferred)

**Definition of Done:**
- Login tested on mobile
- OTP email/SMS received
- Token verification working
- No credentials stored in localStorage

---

### STORY-11: Build Job List Component
**Epic:** Epic 3: Crew Mobile Dashboard
**Priority:** P0 (Blocking)
**Effort:** 4 points

**As a** crew member
**I want** to see all my jobs for today
**So that** I know what to work on

**Acceptance Criteria:**
- [ ] GET /api/jobs endpoint returns jobs for crew member
- [ ] Display: customer name, address, job type, time window
- [ ] Filter by status (assigned, in-progress, completed)
- [ ] Sort by address/time
- [ ] Tap job to see details
- [ ] Refresh to get latest jobs
- [ ] Offline support: show cached jobs if offline

**Job Details Modal Shows:**
- Customer name and phone
- Full address with map
- Job description
- Any special notes
- Previous photos (if recurring)
- Start job / Complete job buttons

**Definition of Done:**
- Jobs display on crew.html
- Pagination if more than 10 jobs
- Proper error handling if no jobs

---

### STORY-12: Implement Photo Upload & Storage
**Epic:** Epic 3: Crew Mobile Dashboard
**Priority:** P0 (Blocking)
**Effort:** 5 points

**As a** crew member
**I want** to take and upload photos of completed jobs
**So that** the owner can verify work and customers can see results

**Acceptance Criteria:**
- [ ] Camera button opens device camera
- [ ] Photo captured and previewed
- [ ] Multiple photos can be added per job
- [ ] Photos compressed before upload (50KB-200KB)
- [ ] Uploaded to Supabase Storage
- [ ] Progress bar shown during upload
- [ ] Success message after upload completes
- [ ] Photos viewable in owner dashboard
- [ ] EXIF data stripped for privacy

**Technical Details:**
- Use device camera API (mediaDevices.getUserMedia)
- Compress with Canvas API
- Upload to Supabase Storage
- Store photo URLs in jobs table

**Definition of Done:**
- Camera works on iPhone and Android
- Photos upload successfully
- Viewable in owner dashboard
- File size optimized

---

### STORY-13: Create Job Completion Workflow
**Epic:** Epic 3: Crew Mobile Dashboard
**Priority:** P0 (Blocking)
**Effort:** 4 points

**As a** crew member
**I want** to mark a job as complete
**So that** the system knows the work is done and can generate an invoice

**Acceptance Criteria:**
- [ ] Job detail shows "Complete Job" button
- [ ] Clicking button requires: at least 1 photo, work description
- [ ] POST /api/jobs/:id/complete endpoint
- [ ] Job status changes to "completed" in Supabase
- [ ] Owner receives notification immediately
- [ ] Invoice auto-generates (Week 4)
- [ ] Confirmation message to crew member
- [ ] Estimated time worked can be entered

**Definition of Done:**
- Job completion flow tested end-to-end
- Owner notification received
- Invoice generated (may be manual for now)

---

### STORY-23: Design Hiring Page
**Epic:** Epic 6: Crew Hiring Page
**Priority:** P1 (Important)
**Effort:** 4 points

**As a** owner
**I want** a professional hiring page
**So that** I can attract and recruit crew members

**Acceptance Criteria:**
- [ ] Heading: "Join Our Team"
- [ ] Job description with responsibilities
- [ ] Benefits listed (pay, flexibility, growth)
- [ ] Requirements section
- [ ] Team photos from Instagram/Facebook
- [ ] Application form section
- [ ] Mobile-friendly
- [ ] Professional branding

**Content Sections:**
- Why join us (benefits, team culture)
- Job responsibilities (mowing, landscaping, equipment)
- Physical requirements
- Expected pay range
- Application form link/section

**Definition of Done:**
- Design approved by owner
- HTML created with Tailwind
- Responsive on all devices

---

### STORY-24: Create Application Form Component
**Epic:** Epic 6: Crew Hiring Page
**Priority:** P1 (Important)
**Effort:** 3 points

**As a** candidate
**I want** to submit a job application
**So that** I can apply to join the crew

**Acceptance Criteria:**
- [ ] Form collects: name, email, phone, experience, availability, resume link
- [ ] Validation for required fields
- [ ] Error messages if invalid
- [ ] Success message after submission
- [ ] Form styled professionally
- [ ] Mobile-friendly

**Definition of Done:**
- Form displays on hiring.html
- All validations working
- Tested on mobile

---

### STORY-25: Build `/api/applications` Endpoint
**Epic:** Epic 6: Crew Hiring Page
**Priority:** P1 (Important)
**Effort:** 3 points

**As a** developer
**I want** to create an endpoint for job applications
**So that** we can store and manage crew applications

**Acceptance Criteria:**
- [ ] POST /api/applications accepts form data
- [ ] Data stored in Supabase
- [ ] Returns 201 on success
- [ ] Rate limiting applied
- [ ] Owner receives email notification

**Definition of Done:**
- Endpoint tested with curl
- Application saved to database
- Owner notification received

---

## Week 4 Stories (Payments & Dashboard)

### STORY-18: Design Invoice Template
**Epic:** Epic 5: Payment Processing
**Priority:** P0 (Blocking)
**Effort:** 3 points

**As a** owner
**I want** professional invoice templates
**So that** customers receive branded, professional invoices

**Acceptance Criteria:**
- [ ] Invoice includes: customer name, job description, crew member, date, amount, photos
- [ ] Professional header with company branding
- [ ] Payment terms and instructions
- [ ] Stripe payment link
- [ ] HTML template created
- [ ] PDF generation tested

**Definition of Done:**
- Template created in HTML
- Sample PDF generated
- Approved by owner

---

### STORY-19: Build `/api/invoices` Endpoint
**Epic:** Epic 5: Payment Processing
**Priority:** P0 (Blocking)
**Effort:** 4 points

**As a** developer
**I want** to create invoices automatically after job completion
**So that** customers receive billing immediately

**Acceptance Criteria:**
- [ ] POST /api/invoices creates invoice from completed job
- [ ] Invoice includes all job details
- [ ] Stripe invoice created in parallel
- [ ] Customer receives invoice via email
- [ ] Invoice stored in Supabase
- [ ] Returns 201 on success

**Definition of Done:**
- Invoice generated and sent successfully
- Stripe invoice visible in dashboard
- Customer email received

---

### STORY-20: Integrate Stripe Checkout
**Epic:** Epic 5: Payment Processing
**Priority:** P0 (Blocking)
**Effort:** 5 points

**As a** customer
**I want** to pay for services via Stripe
**So that** transactions are secure and automated

**Acceptance Criteria:**
- [ ] Invoice includes Stripe payment link
- [ ] Link opens Stripe Checkout
- [ ] Customer enters card details securely
- [ ] Payment processed and confirmed
- [ ] Redirect to success page
- [ ] Error handling for declined cards
- [ ] Webhook handler for payment confirmation

**Definition of Done:**
- Test payment with Stripe test card
- Webhook tested and working
- Success and error pages display correctly

---

### STORY-21: Implement Webhook Handler
**Epic:** Epic 5: Payment Processing
**Priority:** P0 (Blocking)
**Effort:** 4 points

**As a** system
**I want** to handle Stripe webhooks
**So that** invoice status updates when payment is received

**Acceptance Criteria:**
- [ ] POST /api/webhooks/stripe receives Stripe events
- [ ] Webhook signature verified
- [ ] Payment intent succeeded event handled
- [ ] Invoice marked paid in Supabase
- [ ] Owner receives payment notification
- [ ] Error logging for failed events
- [ ] Idempotent (can handle duplicate events)

**Webhook Events to Handle:**
- payment_intent.succeeded
- charge.refunded
- invoice.payment_failed

**Definition of Done:**
- Webhook endpoint tested with Stripe CLI
- Events processed correctly
- Invoice status updates in real-time

---

### STORY-13: Build Revenue Dashboard
**Epic:** Epic 4: Owner Dashboard & Analytics
**Priority:** P1 (Important)
**Effort:** 5 points

**As a** owner
**I want** to see my revenue metrics
**So that** I know how the business is performing

**Acceptance Criteria:**
- [ ] Dashboard shows total revenue (today, this week, this month)
- [ ] Displays completed jobs count
- [ ] Average job value
- [ ] Pending payments
- [ ] Revenue chart (line graph over time)
- [ ] Breakdown by crew member
- [ ] Real-time updates

**Metrics Displayed:**
- Today's revenue
- Week-to-date revenue
- Month-to-date revenue
- Pending invoices (total amount)
- Completed jobs (count)
- Average job value

**Definition of Done:**
- Dashboard loads data from Supabase
- Metrics calculate correctly
- Real-time updates working
- Tested on desktop

---

## Backlog - Future Stories

### STORY-27: Design Blog Landing Page
**Epic:** Epic 7: Blog & Content
**Priority:** P2 (Nice-to-have)
**Effort:** 4 points

### STORY-35: Setup SMS Service (Twilio)
**Epic:** Epic 9: Notifications & Alerts
**Priority:** P2 (Nice-to-have)
**Effort:** 3 points

### STORY-39: Audit & Remove Unused Pages
**Epic:** Epic 10: Site Cleanup & Deployment
**Priority:** P1 (Important)
**Effort:** 2 points

### STORY-43: Implement Rate Limiting
**Epic:** Epic 11: Security & Compliance
**Priority:** P1 (Important)
**Effort:** 3 points

### STORY-47: Setup Error Tracking
**Epic:** Epic 12: Monitoring & Analytics
**Priority:** P1 (Important)
**Effort:** 2 points

---

## Story Status Template

**Status:** Not Started / In Progress / In Review / Done

**Assignee:** [Name]

**Started:** [Date]

**Completed:** [Date]

**Notes:** [Any blockers, decisions, or important info]
