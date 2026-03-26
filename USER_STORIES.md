# Xcellent1 Lawn Care - User Stories

## Product Vision

A simple, efficient field service management system for Xcellent1 Lawn Care that
enables the owner to manage clients and pricing, crews to track daily jobs, and
clients to view services and pay invoices online.

**No AI/automation required** - Focus on practical business dashboards and data
management.

---

## Epic 1: Owner Client Management

### Story 1.1: Add New Client

**As an** owner **I want to** add new clients to the system with their property
and service details **So that** I can start scheduling services and billing for
them

**Acceptance Criteria:**

- [ ] Owner can access "Add Client" form from owner dashboard
- [ ] Form captures:
  - Client name, email, phone number
  - Property address (street, city, state, zip)
  - Service plan (weekly, biweekly, monthly, seasonal, one-time)
  - Property size (sq ft) - optional
  - Initial balance due (defaults to $0.00)
  - Notes field for special instructions
- [ ] Form validates required fields (name, email, phone, address)
- [ ] Email must be unique in system
- [ ] On submit, creates both:
  - Entry in `users` table with role='client'
  - Entry in `clients` table with property details
- [ ] Success message shows after adding client
- [ ] Owner is redirected to client list or client detail page
- [ ] New client appears in searchable client list

**Technical Notes:**

- API: `POST /api/owner/clients`
- Creates Supabase Auth user with temporary password
- Sends welcome email with login credentials (optional for MVP)

---

### Story 1.2: Edit Client Information

**As an** owner **I want to** edit client details and service plans **So that**
I can update information when clients move or change service frequency

**Acceptance Criteria:**

- [ ] Owner can click "Edit" on any client in client list
- [ ] Edit form pre-populates with current client data
- [ ] Owner can update:
  - Contact information (name, email, phone)
  - Property address
  - Service plan
  - Property size
  - Status (active, paused, cancelled)
  - Notes
- [ ] Cannot change email to one already in use
- [ ] Changes are saved on submit with confirmation message
- [ ] Updated information immediately reflects in all views

**Technical Notes:**

- API: `PATCH /api/owner/clients/:id`
- Updates both `users` and `clients` tables

---

### Story 1.3: View All Clients

**As an** owner **I want to** see a list of all clients with their key
information **So that** I can quickly find and manage client accounts

**Acceptance Criteria:**

- [ ] Owner dashboard displays searchable client list
- [ ] List shows for each client:
  - Name
  - Property address
  - Service plan
  - Current balance due
  - Status (active, paused, cancelled)
  - Last service date
- [ ] Owner can search/filter by:
  - Name
  - Address
  - Service plan
  - Status
- [ ] List is sortable by name, balance, last service date
- [ ] Click on client row opens client detail page
- [ ] Shows total count of active vs inactive clients

**Technical Notes:**

- API: `GET /api/owner/clients`
- Returns joined data from `users` + `clients` tables
- Pagination for large client lists

---

### Story 1.4: Set Client Pricing

**As an** owner **I want to** set custom pricing per client based on property
size and services **So that** each client is billed correctly for their specific
needs

**Acceptance Criteria:**

- [ ] On client add/edit form, owner can set:
  - Base service price (per visit)
  - Optional add-on pricing:
    - Trimming/edging
    - Mulch/flower bed maintenance
    - Leaf removal
    - Bush hogging
- [ ] Owner can choose pricing type:
  - Per visit (one-time charge)
  - Per service period (weekly/monthly)
- [ ] Pricing is saved with client record
- [ ] Pricing auto-populates when creating invoices for that client
- [ ] Owner can override pricing on individual invoices

**Technical Notes:**

- Add `pricing_config` JSONB column to `clients` table
- Structure: `{ base_price: 60, add_ons: { trimming: 20, mulch: 50 } }`
- API: `PATCH /api/owner/clients/:id/pricing`

---

## Epic 2: Waitlist Management

### Story 2.1: Capture Website Waitlist Signups

**As a** potential client **I want to** join a waitlist from the website **So
that** I can be contacted when service is available in my area

**Acceptance Criteria:**

- [ ] Website has waitlist form with fields:
  - Name (required)
  - Email (required)
  - Phone (optional)
  - Service area/address (required)
  - Preferred service (dropdown: weekly, biweekly, monthly, one-time)
  - How did you hear about us? (optional)
- [ ] Form validates email format
- [ ] On submit, creates entry in `waitlist` table
- [ ] Shows success message: "Thank you! We'll contact you soon."
- [ ] Sends confirmation email to customer (optional for MVP)

**Technical Notes:**

- API: `POST /api/waitlist` (already exists in server.ts)
- Create new table: `waitlist` with columns:
  - id, name, email, phone, address, service_preference, source, status,
    created_at

---

### Story 2.2: View Waitlist in Owner Dashboard

**As an** owner **I want to** see all waitlist signups in my dashboard **So
that** I can contact them and convert them to active clients

**Acceptance Criteria:**

- [ ] Owner dashboard has "Waitlist" section
- [ ] Displays table with columns:
  - Name
  - Email
  - Phone
  - Service area
  - Preferred service
  - Signup date
  - Status (new, contacted, converted, declined)
- [ ] Sorted by signup date (newest first)
- [ ] Owner can filter by:
  - Status
  - Service preference
  - Date range
- [ ] Shows total count: "X people waiting"
- [ ] Badge notification for new (uncontacted) signups

**Technical Notes:**

- API: `GET /api/owner/waitlist`
- Query: `SELECT * FROM waitlist ORDER BY created_at DESC`

---

### Story 2.3: Convert Waitlist to Client

**As an** owner **I want to** convert a waitlist entry into an active client
**So that** I can quickly onboard them without re-entering information

**Acceptance Criteria:**

- [ ] Each waitlist entry has "Convert to Client" button
- [ ] Clicking button opens "Add Client" form
- [ ] Form pre-populates with waitlist data:
  - Name
  - Email
  - Phone
  - Property address (from service area)
  - Service plan (from preference)
- [ ] Owner can edit any field before saving
- [ ] On save:
  - Creates new client (same as Story 1.1)
  - Updates waitlist status to "converted"
  - Waitlist entry remains in database (for tracking)
- [ ] Converted entries are visually distinct in waitlist view

**Technical Notes:**

- API: `POST /api/owner/waitlist/:id/convert`
- Creates client, updates waitlist.status = 'converted'

---

### Story 2.4: Manage Waitlist Status

**As an** owner **I want to** update waitlist entry status **So that** I can
track my follow-up progress

**Acceptance Criteria:**

- [ ] Owner can change status for each waitlist entry:
  - New (default)
  - Contacted (owner reached out)
  - Converted (became a client)
  - Declined (not interested)
  - Not serviceable (outside service area)
- [ ] Status change is one click (dropdown or buttons)
- [ ] Owner can add notes to waitlist entry
- [ ] Status updates are timestamped
- [ ] Owner can bulk-update status for multiple entries

**Technical Notes:**

- API: `PATCH /api/owner/waitlist/:id`
- Add columns: `status`, `notes`, `contacted_at`, `converted_at`

---

## Epic 3: Crew Job Management

### Story 3.1: View Daily Job List

**As a** crew member **I want to** see my jobs for today with addresses and
directions **So that** I know where to go and what services to perform

**Acceptance Criteria:**

- [ ] Crew dashboard shows today's jobs in chronological order
- [ ] Each job displays:
  - Client name
  - Property address (formatted for GPS)
  - Scheduled time (if set)
  - Services to perform (mowing, trimming, etc.)
  - Property notes/special instructions
  - Job status (pending, in progress, completed)
- [ ] "Get Directions" button opens address in Google Maps
- [ ] "Call Client" button initiates phone call
- [ ] Jobs marked "in progress" appear at top
- [ ] Completed jobs are grayed out but still visible
- [ ] Shows total: "X of Y jobs completed"

**Technical Notes:**

- API: `GET /api/crew/:id/jobs` (already exists in server.ts)
- Use query param: `?date=YYYY-MM-DD` (defaults to today)
- Returns jobs where `crew_id = :id` and `scheduled_date = :date`

---

### Story 3.2: Mark Job In Progress

**As a** crew member **I want to** mark a job as "in progress" when I arrive
**So that** the office knows I'm working on it

**Acceptance Criteria:**

- [ ] Each job has "Start Job" button
- [ ] Click records start time and changes status to "in_progress"
- [ ] Button changes to "Complete Job"
- [ ] Job moves to top of list
- [ ] Visual indicator (color/icon) shows job in progress
- [ ] Only one job can be "in progress" at a time

**Technical Notes:**

- API: `PATCH /api/jobs/:id/start`
- Updates: `status = 'in_progress'`, `started_at = NOW()`

---

### Story 3.3: Upload Job Photos

**As a** crew member **I want to** upload before and after photos of completed
work **So that** clients can see the quality of service

**Acceptance Criteria:**

- [ ] Job detail page has "Upload Photos" section
- [ ] Crew can upload:
  - Before photos (taken before work starts)
  - After photos (taken after completion)
  - Issue photos (damaged sprinklers, obstacles, etc.)
- [ ] Can upload from camera or photo library
- [ ] Photo preview shows before uploading
- [ ] Each photo labeled with type and timestamp
- [ ] Photos automatically linked to job and crew member
- [ ] Can upload multiple photos per job
- [ ] Success message confirms upload

**Technical Notes:**

- API: `POST /api/jobs/:id/photo` (already exists)
- Upload to Supabase Storage: `/job-photos/{job_id}/{timestamp}_{type}.jpg`
- Insert record in `job_photos` table with storage URL

---

### Story 3.4: Complete Job

**As a** crew member **I want to** mark a job as complete **So that** it's off
my list and the office can invoice the client

**Acceptance Criteria:**

- [ ] "Complete Job" button available after job started
- [ ] Optional: Add completion notes
- [ ] Optionally prompted to upload photos (if none yet)
- [ ] On complete:
  - Job status changes to "completed"
  - Completion time recorded
  - Duration calculated (end - start time)
  - Job marked with checkmark/green color
- [ ] Completed jobs move to bottom of list
- [ ] Cannot edit or restart completed jobs
- [ ] Completion data sent to owner dashboard

**Technical Notes:**

- API: `PATCH /api/jobs/:id/complete` (already exists)
- Updates: `status = 'completed'`, `completed_at = NOW()`,
  `duration_minutes = calculated`

---

## Epic 4: Client Self-Service

### Story 4.1: View Upcoming Jobs

**As a** client **I want to** see when my next lawn service is scheduled **So
that** I know when to expect the crew

**Acceptance Criteria:**

- [ ] Client dashboard shows upcoming jobs
- [ ] Displays:
  - Service date
  - Estimated time window (if available)
  - Services included (mowing, edging, etc.)
  - Assigned crew member name
  - Job status
- [ ] Shows next 5 upcoming jobs
- [ ] Calendar view option (optional for MVP)
- [ ] Can filter by date range

**Technical Notes:**

- API: `GET /api/client/:id/dashboard` (already exists)
- Returns jobs where `client_id = :id` and `scheduled_date >= TODAY`
- Ordered by scheduled_date ASC

---

### Story 4.2: View Service History

**As a** client **I want to** see my past lawn services with photos **So that**
I can review the work that's been done

**Acceptance Criteria:**

- [ ] Client dashboard has "Service History" tab
- [ ] Lists past jobs showing:
  - Date of service
  - Services performed
  - Crew member name
  - Before/after photos (if available)
  - Duration
  - Status (completed)
- [ ] Sorted by date (most recent first)
- [ ] Photos are clickable for full-size view
- [ ] Can filter by date range
- [ ] Shows total services received

**Technical Notes:**

- API: `GET /api/client/:id/jobs?status=completed`
- Joins with `job_photos` to include images

---

### Story 4.3: View Invoices

**As a** client **I want to** see my current and past invoices **So that** I
know what I owe and my payment history

**Acceptance Criteria:**

- [ ] Client dashboard displays invoice list
- [ ] Each invoice shows:
  - Invoice number
  - Date issued
  - Amount due
  - Due date
  - Status (unpaid, paid, overdue)
  - Payment date (if paid)
  - Line items (services breakdown)
- [ ] Unpaid invoices highlighted
- [ ] Overdue invoices shown in red
- [ ] "Pay Now" button on unpaid invoices
- [ ] Can download invoice as PDF (optional for MVP)
- [ ] Shows total balance due across all invoices

**Technical Notes:**

- API: `GET /api/client/:id/invoices`
- Returns invoices where `client_id = :id`
- Ordered by due_date DESC

---

### Story 4.4: Pay Invoice Online

**As a** client **I want to** pay my invoice online with Cash App, Zelle, or
card **So that** I don't have to mail checks or pay in person

**Acceptance Criteria:**

- [ ] Invoice detail page has "Pay Now" button
- [ ] Payment modal shows:
  - Invoice amount
  - Due date
  - Payment method options:
    - Cash App (with $cashtag)
    - Zelle (with email/phone)
    - PayPal (link)
    - Credit/debit card (via Stripe - future)
- [ ] For Cash App/Zelle/PayPal:
  - Shows payment instructions
  - Client pays externally, then marks "I've Paid"
  - Owner must manually verify payment
- [ ] For card payment (future):
  - Stripe payment form
  - Automatic verification
- [ ] After payment marked:
  - Invoice status updates to "pending verification"
  - Owner receives notification to verify
  - Once verified, status = "paid"
- [ ] Payment confirmation email sent

**Technical Notes:**

- API: `POST /api/client/invoices/:id/pay`
- For external payments: Creates payment record with `status = 'pending'`
- For card: Integrates Stripe API (future enhancement)
- Owner API: `PATCH /api/owner/payments/:id/verify` to confirm external payment

---

## Epic 5: Owner Invoice & Payment Management

### Story 5.1: Create Invoice for Client

**As an** owner **I want to** create invoices for completed services **So that**
I can bill clients for their lawn care

**Acceptance Criteria:**

- [ ] Owner can create invoice from:
  - Client detail page ("Create Invoice" button)
  - Completed job ("Invoice This Job" button)
- [ ] Invoice form includes:
  - Auto-generated invoice number (e.g., INV-001234)
  - Client selection (pre-filled if from client page)
  - Due date (defaults to 30 days from today)
  - Line items:
    - Description (e.g., "Weekly lawn service")
    - Quantity
    - Unit price
    - Total
  - "Add Line Item" button
  - Subtotal, tax (optional), total due
  - Notes field
- [ ] If created from job, auto-populates:
  - Client
  - Line items from job services
  - Pricing from client's pricing config
- [ ] On save:
  - Creates invoice record
  - Updates client balance_due
  - Sends invoice to client email (optional)
- [ ] Success message with invoice number

**Technical Notes:**

- API: `POST /api/owner/invoices`
- Invoice number format: `INV-{YYYYMMDD}-{sequence}`
- `line_items` stored as JSONB array

---

### Story 5.2: View All Invoices

**As an** owner **I want to** see all invoices across all clients **So that** I
can track accounts receivable

**Acceptance Criteria:**

- [ ] Owner dashboard has "Invoices" section
- [ ] Table displays:
  - Invoice number
  - Client name
  - Date issued
  - Amount
  - Due date
  - Status (unpaid, paid, overdue, cancelled)
  - Days overdue (if applicable)
- [ ] Can filter by:
  - Status
  - Client
  - Date range
- [ ] Can sort by any column
- [ ] Summary stats at top:
  - Total outstanding: $X
  - Overdue: $Y
  - Paid this month: $Z
- [ ] Click invoice opens detail view
- [ ] "Send Reminder" button for overdue invoices

**Technical Notes:**

- API: `GET /api/owner/invoices`
- Add computed field:
  `days_overdue = CURRENT_DATE - due_date WHERE status = 'unpaid'`

---

### Story 5.3: Record Payment

**As an** owner **I want to** record when a client pays (cash, check, Cash App,
etc.) **So that** I can track which invoices are paid

**Acceptance Criteria:**

- [ ] Invoice detail page has "Record Payment" button
- [ ] Payment form captures:
  - Amount paid (defaults to invoice total)
  - Payment method (cash, check, Cash App, Zelle, PayPal, card)
  - Transaction ID (optional)
  - Payment date (defaults to today)
  - Notes
- [ ] Partial payments allowed (amount < total)
- [ ] On save:
  - Creates payment record
  - If amount >= balance, marks invoice "paid"
  - If amount < balance, marks "partial"
  - Updates client balance_due
  - Records paid_at timestamp
- [ ] Can record multiple payments per invoice
- [ ] Payment confirmation shown

**Technical Notes:**

- API: `POST /api/owner/invoices/:id/payment`
- Insert into `payments` table
- Update invoice status based on amount_paid vs amount_due

---

### Story 5.4: Verify External Payments

**As an** owner **I want to** verify Cash App/Zelle/PayPal payments marked by
clients **So that** I can confirm payment was actually received

**Acceptance Criteria:**

- [ ] Owner dashboard shows "Pending Payments" badge
- [ ] List shows payments with status = "pending verification"
- [ ] Each entry displays:
  - Client name
  - Invoice number
  - Amount
  - Payment method
  - Date client marked paid
- [ ] Owner can:
  - "Confirm" - marks invoice paid, updates balance
  - "Reject" - sends back to unpaid, notifies client
  - "Edit" - adjust amount if partial payment
- [ ] Confirmed payments move to payment history
- [ ] Rejected payments send email notification to client

**Technical Notes:**

- API: `PATCH /api/owner/payments/:id/verify`
- Body: `{ verified: true|false, actual_amount: number }`
- Updates payment and invoice status

---

## Epic 6: Owner Dashboard & Metrics

### Story 6.1: View Business Metrics

**As an** owner **I want to** see key business metrics on my dashboard **So
that** I can monitor business performance at a glance

**Acceptance Criteria:**

- [ ] Owner dashboard displays KPI cards:
  - **Active Clients**: Count of clients with status='active'
  - **Jobs This Week**: Count of jobs scheduled this week
  - **Total Outstanding**: Sum of unpaid invoice amounts
  - **Revenue This Month**: Sum of payments received this month
  - **New Leads**: Count of waitlist signups in last 30 days
  - **Active Crew**: Count of crew members with status='active'
- [ ] Each metric shows:
  - Current value (large number)
  - Trend indicator (up/down vs last period) - optional
  - Icon representing the metric
- [ ] Metrics update in real-time when data changes
- [ ] Can click metric to see detail view

**Technical Notes:**

- API: `GET /api/owner/metrics` (already exists)
- Returns JSON with all metric values
- SQL aggregations for each metric

---

### Story 6.2: View Recent Activity

**As an** owner **I want to** see recent system activity **So that** I can stay
informed of what's happening

**Acceptance Criteria:**

- [ ] Dashboard shows "Recent Activity" feed
- [ ] Activity types shown:
  - New waitlist signup
  - Job completed by crew
  - Invoice created
  - Payment received
  - Client added
- [ ] Each item shows:
  - Icon/color based on type
  - Description (e.g., "Marcus completed job at 123 Oak St")
  - Timestamp (relative: "2 hours ago")
  - Link to related entity
- [ ] Shows most recent 10 activities
- [ ] "View All" link to activity history page

**Technical Notes:**

- Create `activity_log` table or query across multiple tables
- API: `GET /api/owner/activity?limit=10`

---

## Epic 7: Job Scheduling

### Story 7.1: Create Job for Client

**As an** owner **I want to** schedule jobs for my clients **So that** crew
knows what work to do and when

**Acceptance Criteria:**

- [ ] Owner can create job from:
  - Client detail page ("Schedule Service" button)
  - Calendar view (drag-and-drop - future)
  - "Add Job" button on owner dashboard
- [ ] Job form includes:
  - Client (searchable dropdown)
  - Crew member assignment
  - Scheduled date (required)
  - Scheduled time (optional)
  - Services (multi-select):
    - Mowing
    - Edging
    - Trimming
    - Mulch/flower bed
    - Leaf removal
    - Bush hogging
    - Other (custom)
  - Notes/special instructions
  - Estimated duration (optional)
- [ ] On save:
  - Creates job record
  - Assigned crew sees it in their dashboard
  - Client sees it in upcoming jobs
- [ ] Can bulk-create recurring jobs (optional for MVP)

**Technical Notes:**

- API: `POST /api/owner/jobs`
- Insert into `jobs` table with status='assigned'

---

### Story 7.2: Edit/Reassign Job

**As an** owner **I want to** edit job details or reassign to different crew
**So that** I can adjust schedule when things change

**Acceptance Criteria:**

- [ ] Owner can edit any job that's not completed
- [ ] Can change:
  - Assigned crew member
  - Scheduled date/time
  - Services
  - Notes
- [ ] If crew already started job, owner gets warning
- [ ] Changes immediately reflect in crew and client dashboards
- [ ] Can cancel job (sets status = 'cancelled')

**Technical Notes:**

- API: `PATCH /api/owner/jobs/:id`
- Validate: can't change status from 'completed'

---

## Database Schema Changes Required

Based on user stories above, we need:

### New Table: `waitlist`

```sql
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT NOT NULL,
  service_preference TEXT CHECK (service_preference IN ('weekly', 'biweekly', 'monthly', 'seasonal', 'one-time')),
  source TEXT, -- how did you hear about us
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'declined', 'not_serviceable')),
  notes TEXT,
  contacted_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_waitlist_status ON waitlist(status);
CREATE INDEX idx_waitlist_created ON waitlist(created_at DESC);
```

### Add to `clients` table:

```sql
ALTER TABLE clients ADD COLUMN pricing_config JSONB;
-- Example: {"base_price": 60, "add_ons": {"trimming": 20, "mulch": 50}}
```

### Add to `jobs` table:

```sql
ALTER TABLE jobs ADD COLUMN started_at TIMESTAMPTZ;
-- (completed_at and duration_minutes already exist)
```

### Add to `payments` table:

```sql
ALTER TABLE payments ADD COLUMN verified BOOLEAN DEFAULT true;
ALTER TABLE payments ADD COLUMN verified_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN verified_by UUID REFERENCES users(id);
-- For tracking external payment verification
```

### New Table: `activity_log` (optional)

```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  entity_type TEXT, -- 'job', 'invoice', 'client', etc.
  entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_created ON activity_log(created_at DESC);
```

---

## API Endpoints Required

### Client Management

- `POST /api/owner/clients` - Create client
- `GET /api/owner/clients` - List all clients
- `GET /api/owner/clients/:id` - Get client details
- `PATCH /api/owner/clients/:id` - Update client
- `PATCH /api/owner/clients/:id/pricing` - Update pricing config

### Waitlist

- `POST /api/waitlist` - Add to waitlist (public - already exists)
- `GET /api/owner/waitlist` - View all waitlist entries
- `PATCH /api/owner/waitlist/:id` - Update status
- `POST /api/owner/waitlist/:id/convert` - Convert to client

### Jobs

- `POST /api/owner/jobs` - Create job
- `GET /api/owner/jobs` - List all jobs
- `PATCH /api/owner/jobs/:id` - Edit job
- `PATCH /api/jobs/:id/start` - Mark job in progress (crew)
- `PATCH /api/jobs/:id/complete` - Mark job complete (crew - already exists)
- `POST /api/jobs/:id/photo` - Upload photo (already exists)

### Invoices

- `POST /api/owner/invoices` - Create invoice
- `GET /api/owner/invoices` - List all invoices
- `GET /api/owner/invoices/:id` - Get invoice details
- `GET /api/client/:id/invoices` - Client view invoices
- `POST /api/client/invoices/:id/pay` - Client mark as paid

### Payments

- `POST /api/owner/invoices/:id/payment` - Record payment
- `PATCH /api/owner/payments/:id/verify` - Verify external payment
- `GET /api/owner/payments/pending` - List pending verifications

### Metrics

- `GET /api/owner/metrics` - Business KPIs (already exists)
- `GET /api/owner/activity` - Recent activity

---

## Priority Ranking

### Phase 1 - MVP (Essential for Launch)

1. ✅ User authentication (already complete)
2. **Epic 1: Owner Client Management** (Stories 1.1, 1.2, 1.3, 1.4)
3. **Epic 7: Job Scheduling** (Stories 7.1, 7.2)
4. **Epic 3: Crew Job Management** (Stories 3.1, 3.4)
5. **Epic 5: Invoice Management** (Stories 5.1, 5.3)

### Phase 2 - Enhanced Features

6. **Epic 2: Waitlist Management** (All stories)
7. **Epic 3: Crew Photos** (Story 3.3)
8. **Epic 4: Client Self-Service** (Stories 4.1, 4.2, 4.3)
9. **Epic 6: Owner Metrics** (Story 6.1)

### Phase 3 - Full Featured

10. **Epic 4: Online Payments** (Story 4.4)
11. **Epic 5: Payment Verification** (Story 5.4)
12. **Epic 6: Activity Feed** (Story 6.2)

---

## Success Metrics

- **Owner Efficiency**: Time to add new client < 2 minutes
- **Client Satisfaction**: 80%+ clients use portal to view services
- **Payment Speed**: Average days to payment < 30 days
- **Crew Productivity**: 95%+ jobs completed same day
- **Waitlist Conversion**: 40%+ waitlist converts to clients

---

## Out of Scope (No AI Required)

- ❌ Automated scheduling/route optimization
- ❌ AI chatbots for customer service
- ❌ Predictive analytics
- ❌ Automated invoice generation
- ❌ Smart notifications/alerts
- ❌ BMAD agents (experimental AI system)

**Focus**: Simple, reliable dashboards for manual business management.
