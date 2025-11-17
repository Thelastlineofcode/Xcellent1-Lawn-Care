# Implementation Roadmap - Xcellent1 Lawn Care

## Project Scope

**Goal**: Simple field service management system for lawn care business
- Owner dashboard for managing clients, jobs, invoices
- Crew dashboard for viewing daily jobs
- Client portal for viewing services and paying bills
- Waitlist management for website signups

**Explicitly Out of Scope**: AI features, automation, BMAD agents

---

## Current Status ✅

### Completed
- ✅ Database schema designed (`/db/schema.sql`)
- ✅ Supabase authentication integrated
- ✅ Role-based access control (owner, crew, client)
- ✅ Protected API endpoints with JWT verification
- ✅ Login page with Supabase auth
- ✅ UI templates for all dashboards (owner, crew, client)
- ✅ Service worker for offline capability
- ✅ Responsive navbar with consistent branding
- ✅ Environment configuration (.env setup)
- ✅ Basic API endpoints (health, config, leads, waitlist, careers)

### Database Ready
- ✅ Users table with auth_user_id linking
- ✅ Clients table with property information
- ✅ Jobs table with crew assignments
- ✅ Invoices and payments tables
- ✅ Job photos table
- ✅ RLS policies for data security
- ✅ Helper functions for common queries

### Frontend Ready
- ✅ Home/marketing pages
- ✅ Dashboard templates (owner, crew, client)
- ✅ Login/authentication flow
- ✅ Blog pages for SEO
- ✅ Shop page for products
- ✅ Careers application form

---

## Phase 1: Core Business Operations (Week 1-2)

**Goal**: Get essential features working for daily operations

### 1.1 Client Management API
**Priority**: CRITICAL
**Estimated**: 2 days

**Tasks**:
- [ ] Create `POST /api/owner/clients` - Add new client
  - Validates email uniqueness
  - Creates user + client records
  - Sets up Supabase auth user
- [ ] Create `GET /api/owner/clients` - List all clients
  - Returns joined user + client data
  - Supports search/filter by name, status
  - Includes current balance
- [ ] Create `GET /api/owner/clients/:id` - Client details
  - Returns full client profile
  - Includes job history, invoices
- [ ] Create `PATCH /api/owner/clients/:id` - Update client
  - Updates contact info, address, service plan
  - Updates status (active/paused/cancelled)
- [ ] Create `PATCH /api/owner/clients/:id/pricing` - Set pricing
  - Saves pricing_config JSON

**Testing**:
- [ ] Can add client with all fields
- [ ] Email uniqueness enforced
- [ ] Search/filter works correctly
- [ ] Pricing config saves and retrieves

---

### 1.2 Client Management UI
**Priority**: CRITICAL
**Estimated**: 3 days

**Tasks**:
- [ ] Build "Add Client" form on owner dashboard
  - All required fields with validation
  - Service plan dropdown
  - Address autocomplete (optional)
  - Pricing configuration section
- [ ] Build client list table
  - Display name, address, plan, balance, status
  - Search bar
  - Filter by status dropdown
  - Click row → client detail page
- [ ] Build client detail page
  - Shows full profile
  - Edit button → edit form
  - Tabs for: Overview, Jobs, Invoices, Payments
  - "Schedule Service" button
  - "Create Invoice" button
- [ ] Connect forms to API endpoints
  - Handle loading states
  - Show success/error messages
  - Validate inputs

**Testing**:
- [ ] Add 5 test clients via UI
- [ ] Search finds clients correctly
- [ ] Edit updates save properly
- [ ] All fields display correctly

---

### 1.3 Job Creation & Assignment
**Priority**: CRITICAL
**Estimated**: 2 days

**Tasks**:
- [ ] Create `POST /api/owner/jobs` - Create job
  - Assigns to crew member
  - Sets scheduled date
  - Defines services list
- [ ] Create `PATCH /api/owner/jobs/:id` - Edit job
  - Can reassign crew
  - Can change date/services
- [ ] Create `GET /api/owner/jobs` - List all jobs
  - Filter by date range, crew, client, status
- [ ] Build job creation form on owner dashboard
  - Client selector (searchable dropdown)
  - Crew selector
  - Date picker
  - Services multi-select checkboxes
  - Notes textarea
- [ ] Build job list view
  - Group by date or crew
  - Color code by status
  - Quick actions (edit, cancel)

**Testing**:
- [ ] Create jobs for next week
- [ ] Assign to different crew members
- [ ] Edit job reassigns correctly
- [ ] Jobs appear in crew dashboard

---

### 1.4 Crew Dashboard - Connect to Backend
**Priority**: HIGH
**Estimated**: 2 days

**Current**: Crew dashboard uses mock data
**Goal**: Connect to real API

**Tasks**:
- [ ] Update `crew.html` to fetch from `/api/crew/:id/jobs`
  - Get crew ID from auth session
  - Pass today's date as parameter
  - Display real job data
- [ ] Implement "Start Job" button
  - Calls `PATCH /api/jobs/:id/start`
  - Updates UI to show "In Progress"
  - Records started_at timestamp
- [ ] Implement "Complete Job" button
  - Calls existing `PATCH /api/jobs/:id/complete`
  - Prompts for optional notes
  - Marks job as complete in UI
- [ ] Add Google Maps integration
  - "Get Directions" button opens Maps with address
- [ ] Add error handling
  - Show errors if API fails
  - Offline support (cache last fetch)

**Testing**:
- [ ] Login as crew member
- [ ] See today's jobs from database
- [ ] Start job updates status
- [ ] Complete job marks as done
- [ ] Directions open in Maps

---

### 1.5 Invoice Creation
**Priority**: HIGH
**Estimated**: 2 days

**Tasks**:
- [ ] Create `POST /api/owner/invoices` - Create invoice
  - Auto-generates invoice number
  - Calculates totals
  - Updates client balance
- [ ] Create `GET /api/owner/invoices/:id` - Get invoice details
- [ ] Build invoice creation form
  - Client selector (pre-fill if from client page)
  - Due date (default +30 days)
  - Line items table:
    - Description, quantity, price fields
    - Add/remove row buttons
    - Auto-calculate subtotal
  - Tax field (optional)
  - Total (calculated)
  - Notes
  - "Create from Job" option (pre-fills from job services)
- [ ] Build invoice detail view
  - Displays all invoice data
  - Shows payment history
  - "Record Payment" button
  - "Send to Client" button (email - optional)
  - Print/PDF option (future)

**Testing**:
- [ ] Create invoice manually
- [ ] Create invoice from completed job
- [ ] Line items calculate correctly
- [ ] Invoice appears in client dashboard

---

## Phase 2: Self-Service Features (Week 3-4)

### 2.1 Client Dashboard - Connect to Backend
**Priority**: MEDIUM
**Estimated**: 2 days

**Current**: Client dashboard uses mock data
**Goal**: Show real data

**Tasks**:
- [ ] Update `client.html` to fetch from `/api/client/:id/dashboard`
  - Get client ID from auth session
  - Display real upcoming jobs
  - Display real service history with photos
- [ ] Fetch and display invoices
  - Calls `/api/client/:id/invoices`
  - Shows unpaid invoices prominently
  - Lists payment history
- [ ] Add balance summary
  - Total amount due
  - Last payment date
  - Payment method used

**Testing**:
- [ ] Login as client
- [ ] See real jobs and invoices
- [ ] Data matches what owner sees

---

### 2.2 Payment Recording (Owner)
**Priority**: MEDIUM
**Estimated**: 1 day

**Tasks**:
- [ ] Create `POST /api/owner/invoices/:id/payment` - Record payment
  - Creates payment record
  - Updates invoice status
  - Updates client balance
- [ ] Build "Record Payment" modal on invoice page
  - Amount field (default to invoice total)
  - Payment method dropdown
  - Transaction ID field (optional)
  - Date picker (default today)
  - Notes
- [ ] Update invoice list to show paid status
- [ ] Add payment history tab on client detail page

**Testing**:
- [ ] Record cash payment
- [ ] Record check payment
- [ ] Record Cash App payment
- [ ] Partial payment works
- [ ] Balance updates correctly

---

### 2.3 Waitlist Management
**Priority**: MEDIUM
**Estimated**: 2 days

**Tasks**:
- [ ] Deploy `create_waitlist_table.sql` to Supabase
- [ ] Verify `/api/waitlist` endpoint works (should already exist)
- [ ] Create `GET /api/owner/waitlist` - View all waitlist
- [ ] Create `PATCH /api/owner/waitlist/:id` - Update status
- [ ] Create `POST /api/owner/waitlist/:id/convert` - Convert to client
- [ ] Build waitlist view on owner dashboard
  - Table showing all signups
  - Status badges (new, contacted, converted, etc.)
  - Filter by status
  - Sort by date
- [ ] Build "Convert to Client" flow
  - Button on waitlist entry
  - Pre-fills add client form
  - Marks waitlist as converted
- [ ] Add waitlist count to owner metrics

**Testing**:
- [ ] Submit waitlist form on website
- [ ] Entry appears in owner dashboard
- [ ] Can update status
- [ ] Convert creates real client

---

### 2.4 Client Payment (Self-Service)
**Priority**: MEDIUM
**Estimated**: 2 days

**Tasks**:
- [ ] Create `POST /api/client/invoices/:id/pay` - Mark as paid
  - For external payments (Cash App, Zelle, PayPal)
  - Sets status to 'pending verification'
- [ ] Build payment modal on client invoice page
  - Payment method selector
  - For Cash App: Show $cashtag and instructions
  - For Zelle: Show email/phone
  - For PayPal: Show PayPal.me link
  - "I've Sent Payment" button
- [ ] Show pending verification message
- [ ] Owner dashboard shows pending payments badge

**Testing**:
- [ ] Client marks invoice as paid
- [ ] Status changes to pending
- [ ] Owner sees in pending list

---

## Phase 3: Enhanced Features (Week 5-6)

### 3.1 Payment Verification (Owner)
**Priority**: LOW
**Estimated**: 1 day

**Tasks**:
- [ ] Create `PATCH /api/owner/payments/:id/verify` - Verify payment
- [ ] Create `GET /api/owner/payments/pending` - List pending
- [ ] Build pending payments view
  - Shows unverified payments
  - Confirm/reject buttons
  - Option to adjust amount
- [ ] Confirmation updates invoice & balance
- [ ] Rejection notifies client

**Testing**:
- [ ] Verify pending payment
- [ ] Invoice marked as paid
- [ ] Balance updates

---

### 3.2 Photo Upload (Crew)
**Priority**: LOW
**Estimated**: 2 days

**Tasks**:
- [ ] Integrate Supabase Storage
  - Create `job-photos` bucket
  - Set up upload policy
- [ ] Update `POST /api/jobs/:id/photo` endpoint
  - Upload to Supabase Storage
  - Save URL in job_photos table
- [ ] Build photo upload UI in crew dashboard
  - Before/after photo type selector
  - Camera/library picker
  - Preview before upload
  - Multiple photo support
- [ ] Display photos in client dashboard
  - Before/after image comparison
  - Lightbox for full size

**Testing**:
- [ ] Upload photo from mobile
- [ ] Photo appears in client dashboard
- [ ] Multiple photos per job work

---

### 3.3 Owner Metrics Dashboard
**Priority**: LOW
**Estimated**: 1 day

**Tasks**:
- [ ] Update owner.html to call `/api/owner/metrics`
  - Replace mock data with real API
- [ ] Display KPI cards:
  - Active clients count
  - Jobs this week
  - Total outstanding
  - Revenue this month
  - New waitlist signups
  - Active crew count
- [ ] Add recent activity feed
  - Query activity_log table
  - Show last 10 actions

**Testing**:
- [ ] Metrics display real data
- [ ] Numbers match database counts

---

## Phase 4: Polish & Launch (Week 7-8)

### 4.1 Testing & Bug Fixes
**Priority**: CRITICAL
**Estimated**: 3 days

**Tasks**:
- [ ] End-to-end testing of all workflows
- [ ] Mobile responsiveness check
- [ ] Cross-browser testing
- [ ] Fix any bugs found
- [ ] Performance optimization
- [ ] Security review

---

### 4.2 Documentation & Training
**Priority**: HIGH
**Estimated**: 2 days

**Tasks**:
- [ ] Update README with deployment instructions
- [ ] Create user guide for owner
- [ ] Create user guide for crew
- [ ] Create user guide for clients
- [ ] Record demo videos (optional)

---

### 4.3 Production Deployment
**Priority**: CRITICAL
**Estimated**: 2 days

**Tasks**:
- [ ] Deploy database to production Supabase
- [ ] Configure production environment variables
- [ ] Deploy server to hosting (Fly.io, Railway, etc.)
- [ ] Set up custom domain
- [ ] Configure SSL certificate
- [ ] Test production environment
- [ ] Go live!

---

## Optional Future Enhancements

### Low Priority (Post-Launch)
- [ ] Stripe integration for card payments
- [ ] Email notifications (invoice sent, payment received)
- [ ] SMS reminders for crew (job starting soon)
- [ ] Recurring job templates
- [ ] Calendar view of jobs
- [ ] Revenue reports and charts
- [ ] Customer ratings/feedback
- [ ] Mobile app (React Native)

### Explicitly Out of Scope
- ❌ AI-powered scheduling
- ❌ Chatbots
- ❌ Automated notifications
- ❌ BMAD agent system
- ❌ Machine learning features

---

## Development Workflow

### Daily Process
1. Pick task from current phase
2. Create API endpoint (if needed)
3. Test endpoint with curl/Postman
4. Build UI component
5. Connect UI to API
6. Test in browser
7. Fix bugs
8. Commit & push
9. Move to next task

### Git Workflow
```bash
# Start feature
git checkout -b feature/client-management

# Make changes
git add .
git commit -m "feat: add client creation form"

# Push feature
git push origin feature/client-management

# Merge to main when complete
```

### Testing Checklist per Feature
- [ ] Works on desktop Chrome
- [ ] Works on mobile Safari
- [ ] API returns correct data
- [ ] Error handling works
- [ ] Loading states show
- [ ] Success messages appear
- [ ] Data persists to database
- [ ] RLS policies enforced

---

## Success Criteria

### Phase 1 Complete When:
- ✅ Owner can add/edit clients
- ✅ Owner can create and assign jobs
- ✅ Crew sees real jobs on dashboard
- ✅ Crew can mark jobs complete
- ✅ Owner can create invoices
- ✅ Owner can record payments

### Phase 2 Complete When:
- ✅ Clients see their jobs and invoices
- ✅ Clients can mark invoices as paid
- ✅ Owner can manage waitlist
- ✅ Owner can convert waitlist to clients

### Phase 3 Complete When:
- ✅ Crew can upload photos
- ✅ Clients see job photos
- ✅ Owner dashboard shows real metrics
- ✅ Payment verification works

### Launch Ready When:
- ✅ All Phase 1-3 features work
- ✅ No critical bugs
- ✅ Mobile responsive
- ✅ Production environment configured
- ✅ User guides written

---

## Time Estimate

- **Phase 1**: 2 weeks (core features)
- **Phase 2**: 2 weeks (self-service)
- **Phase 3**: 2 weeks (enhancements)
- **Phase 4**: 2 weeks (polish & launch)

**Total**: ~8 weeks for full featured system

**MVP** (Phase 1 only): ~2 weeks

---

## Next Immediate Steps

1. ✅ Deploy `schema_enhancements.sql` to Supabase
2. ✅ Deploy `create_waitlist_table.sql` to Supabase
3. Start Phase 1.1: Client Management API
4. Build Phase 1.2: Client Management UI
5. Continue with roadmap phases

---

Last updated: 2025-11-17
