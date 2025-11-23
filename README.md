# Xcellent1 Lawn Care Management System

A complete lawn care business management platform built with Deno, Supabase, and vanilla JavaScript.

## 🚀 Features

### For Business Owners
- **Client Management** - Full CRUD operations, search, and filtering
- **Job Scheduling** - Assign jobs to crew, track status, and completion
- **Invoicing & Payments** - Create invoices, record payments, track balances
- **Waitlist Management** - Manage prospective clients and convert to customers
- **Payment Verification** - Approve or reject client-reported payments
- **Business Metrics** - Real-time KPIs and performance tracking

### For Crew Members
- **Daily Job List** - View assigned jobs with client details
- **Photo Upload** - Document before/after photos (Supabase Storage)
- **Job Status Updates** - Mark jobs as started/completed
- **Navigation Integration** - Quick links to client addresses

### For Clients
- **Self-Service Portal** - View balance, service history, and photos
- **Payment Marking** - Report payments sent via Cash App, Zelle, PayPal
- **Photo Gallery** - See before/after photos from completed jobs
- **Payment Options** - Direct links to payment apps

---

## 📋 Prerequisites

1. **Deno Runtime** (v1.x or later)
   - Install: https://deno.land/manual/getting_started/installation
   ```bash
   curl -fsSL https://deno.land/x/install/install.sh | sh
   ```

2. **Supabase Account** (Free tier works)
   - Sign up: https://supabase.com
   - Create a new project

3. **PostgreSQL Database** (via Supabase)
   - Automatically provided with Supabase project

4. **Git** (for deployment)
   ```bash
   git clone https://github.com/Thelastlineofcode/Xcellent1-Lawn-Care.git
   cd Xcellent1-Lawn-Care
   ```

---

## 🔧 Setup Instructions

### 1. Environment Variables

Create a `.env` file in the project root:

```env
# Database (from Supabase Project Settings → Database)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Supabase (from Supabase Project Settings → API)
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_JWT_SECRET=[YOUR-JWT-SECRET]

# Server
PORT=8000
```

**Finding Supabase Credentials**:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Settings** → **API**
   - Copy **URL** → SUPABASE_URL
   - Copy **anon/public** key → SUPABASE_ANON_KEY
4. Click **Settings** → **Database**
   - Copy **Connection string** → DATABASE_URL (replace [YOUR-PASSWORD])
5. Click **Settings** → **API** → **JWT Settings**
   - Copy **JWT Secret** → SUPABASE_JWT_SECRET

### 2. Database Setup

#### Option A: Supabase SQL Editor (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Run each SQL file in order:

```sql
-- 1. Core schema
\i db/schema.sql

-- 2. Waitlist feature
\i db/waitlist_schema.sql

-- 3. Enhanced metrics (if exists)
\i db/enhanced_owner_metrics.sql
```

Copy the contents of each file and run in the SQL Editor.

#### Option B: psql Command Line

```bash
# Ensure psql is installed
psql --version

# Run migrations
psql "$DATABASE_URL" -f db/schema.sql
psql "$DATABASE_URL" -f db/waitlist_schema.sql
psql "$DATABASE_URL" -f db/enhanced_owner_metrics.sql
```

### 3. Supabase Storage Setup

Follow the guide in `db/SETUP_SUPABASE_STORAGE.md` to:
1. Create the `job-photos` storage bucket
2. Set up public access policies
3. Configure upload permissions

**Quick Setup** (via Supabase Dashboard):
1. Go to **Storage** → **New Bucket**
2. Name: `job-photos`
3. Check ✅ **Public bucket**
4. Create bucket
5. Go to **Policies** tab
6. Add the policies from `db/SETUP_SUPABASE_STORAGE.md`

### 4. Authentication Setup

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider (enabled by default)
3. (Optional) Configure email templates for password reset, etc.

### 5. Create Demo Data (Optional)

The schema includes sample data for testing. To load it:

```sql
-- Already included in db/schema.sql (lines 195-248)
-- Creates owner, crew members, and a sample client
```

Or create users manually:
1. Go to **Authentication** → **Users** → **Add user**
2. Create test accounts for owner, crew, and client roles

---

## 🏃 Running Locally

### Start Development Server

```bash
# Load environment variables and start server
deno run --allow-net --allow-read --allow-write --allow-env server.ts
```

Or use the task runner:

```bash
deno task start
```

### Access the Application

- **Main Site**: http://localhost:8000/
- **Owner Dashboard**: http://localhost:8000/static/owner.html
- **Crew Dashboard**: http://localhost:8000/static/crew.html
- **Client Portal**: http://localhost:8000/static/client.html
- **Health Check**: http://localhost:8000/health

### Available Pages

**Owner**:
- `/static/owner.html` - Main dashboard with metrics
- `/static/manage-clients.html` - Client management
- `/static/manage-jobs.html` - Job scheduling
- `/static/manage-invoices.html` - Invoicing and payments
- `/static/manage-waitlist.html` - Prospect pipeline
- `/static/pending-payments.html` - Payment verification

**Crew**:
- `/static/crew.html` - Daily job list

**Client**:
- `/static/client.html` - Self-service portal

**Public**:
- `/` - Careers/job application page
- `/api/waitlist` - Prospect signup (API endpoint)

---

## 🚀 Deployment

### Deploy to Fly.io

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login to Fly**
   ```bash
   fly auth login
   ```

3. **Deploy** (fly.toml already configured)
   ```bash
   fly deploy
   ```

4. **Set Environment Variables**
   ```bash
   fly secrets set DATABASE_URL="postgresql://..."
   fly secrets set SUPABASE_URL="https://..."
   fly secrets set SUPABASE_ANON_KEY="..."
   fly secrets set SUPABASE_JWT_SECRET="..."
   ```

5. **Open App**
   ```bash
   fly open
   ```

### Deploy to Deno Deploy

1. **Install Deployctl**
   ```bash
   deno install --allow-all --no-check -r -f https://deno.land/x/deploy/deployctl.ts
   ```

2. **Login**
   ```bash
   deployctl login
   ```

3. **Deploy**
   ```bash
   deployctl deploy --project=xcellent1-lawn-care server.ts
   ```

4. **Set Environment Variables** (in Deno Deploy dashboard)
   - Go to https://dash.deno.com
   - Select your project
   - **Settings** → **Environment Variables**
   - Add all required variables

### Deploy to Railway

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   railway init
   ```

4. **Add Environment Variables**
   ```bash
   railway variables set DATABASE_URL="..."
   railway variables set SUPABASE_URL="..."
   # ... etc
   ```

5. **Deploy**
   ```bash
   railway up
   ```

---

## 📚 API Documentation

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <your-supabase-jwt-token>
```

### Endpoint Summary

**Public** (no auth required):
- `POST /api/waitlist` - Join waitlist

**Owner Only**:
- Client Management: `/api/owner/clients`
- Job Management: `/api/owner/jobs`
- Invoice Management: `/api/owner/invoices`
- Waitlist Management: `/api/owner/waitlist`
- Payment Verification: `/api/owner/payments`

**Crew Only**:
- Photo Upload: `/api/jobs/:id/photo`
- Job Updates: `/api/jobs/:id/start`, `/api/jobs/:id/complete`

**Client Only**:
- Invoices: `/api/client/invoices`
- Payment Marking: `/api/client/invoices/:id/mark-payment`

For complete API documentation, see `PHASES_1-3_COMPLETE.md`.

---

## 🗄️ Database Schema

### Core Tables
- `users` - All system users (owner, crew, clients, applicants)
- `clients` - Customer records with property and billing info
- `jobs` - Work assignments with crew and client details
- `job_photos` - Before/after photos
- `invoices` - Billing records
- `payments` - Payment tracking
- `waitlist` - Prospective clients
- `applications` - Job applicants
- `outbox_events` - Event sourcing for BMAD integration

### Key Relationships
```
users (1) → (many) clients
users (1) → (many) jobs (as crew)
clients (1) → (many) jobs
clients (1) → (many) invoices
jobs (1) → (many) job_photos
invoices (1) → (many) payments
```

See `db/schema.sql` for complete schema.

---

## 🧪 Testing

### Manual Testing Checklist

See `PHASES_1-3_COMPLETE.md` for comprehensive testing checklist covering:
- Phase 1: Client, Job, Invoice management
- Phase 2: Waitlist, Self-service payments
- Phase 3: Photo upload, Payment verification

### Test User Accounts

Create test accounts in Supabase Authentication:

```
Owner: owner@xcellent1.com / [password]
Crew: marcus@xcellent1.com / [password]
Client: sarah@example.com / [password]
```

Then link them in the `users` table with appropriate roles.

---

## 📖 User Guides

### For Owners
1. **Login**: Navigate to `/static/owner.html`
2. **View Dashboard**: See KPIs and recent activity
3. **Manage Clients**: Click "Manage Clients" → Add/Edit/Search
4. **Schedule Jobs**: Click "Manage Jobs" → Create job → Assign crew
5. **Create Invoices**: Click "Manage Invoices" → New invoice → Add line items
6. **Verify Payments**: Click "Pending Payments" → Approve/Reject
7. **Manage Waitlist**: Click "Manage Waitlist" → Convert prospects

### For Crew
1. **Login**: Navigate to `/static/crew.html`
2. **View Jobs**: See today's assigned jobs
3. **Navigate**: Click address to open in maps
4. **Upload Photos**: (Coming soon - integration with mobile camera)
5. **Update Status**: Mark jobs as started/completed

### For Clients
1. **Login**: Navigate to `/static/client.html`
2. **View Balance**: See current amount due
3. **View Photos**: See before/after photos from recent jobs
4. **Make Payment**: Use Cash App, Zelle, or PayPal quick links
5. **Mark Payment**: Click "I've Sent Payment" → Select method → Confirm

---

## 🔧 Troubleshooting

### Server won't start
- Check Deno is installed: `deno --version`
- Verify `.env` file exists with correct variables
- Check port 8000 is not in use: `lsof -i :8000`

### Database connection fails
- Verify DATABASE_URL is correct
- Check Supabase project is active
- Ensure PostgreSQL port (5432) is accessible
- Test connection: `psql "$DATABASE_URL" -c "SELECT 1"`

### Authentication errors
- Verify SUPABASE_JWT_SECRET is set
- Check JWT token is valid (use jwt.io to decode)
- Ensure user exists in `users` table with correct role
- Verify RLS policies are enabled

### Photos not uploading
- Check Supabase Storage bucket exists: `job-photos`
- Verify bucket is set to Public
- Check upload policies are configured
- See `db/SETUP_SUPABASE_STORAGE.md` for setup

### Payment verification not working
- Ensure payments have "Self-reported" in notes field
- Check client-marked payments in database
- Verify owner has authenticated access
- Check pending payments query results

---

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:8000/health
# Should return: {"status":"ok"}
```

### Database Status
```sql
-- Check table counts
SELECT
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM clients) as clients,
  (SELECT COUNT(*) FROM jobs) as jobs,
  (SELECT COUNT(*) FROM invoices) as invoices,
  (SELECT COUNT(*) FROM waitlist) as waitlist;
```

### Storage Usage
Check Supabase Dashboard:
- **Storage** → **job-photos** → View size
- Free tier: 1 GB limit

### Logs
**Fly.io**:
```bash
fly logs
```

**Deno Deploy**:
- View in dashboard: https://dash.deno.com

---

## 🛠️ Development

### Project Structure
```
Xcellent1-Lawn-Care/
├── server.ts                 # Main Deno server
├── supabase_auth.ts          # Authentication utilities
├── fly.toml                  # Fly.io configuration
├── deno.json                 # Deno configuration
├── .env                      # Environment variables (gitignored)
├── db/
│   ├── schema.sql           # Core database schema
│   ├── waitlist_schema.sql  # Waitlist feature schema
│   ├── enhanced_owner_metrics.sql # Business metrics functions
│   └── SETUP_SUPABASE_STORAGE.md # Storage setup guide
├── web/
│   └── static/
│       ├── owner.html              # Owner dashboard
│       ├── manage-clients.html     # Client management
│       ├── manage-jobs.html        # Job scheduling
│       ├── manage-invoices.html    # Invoicing
│       ├── manage-waitlist.html    # Waitlist management
│       ├── pending-payments.html   # Payment verification
│       ├── crew.html              # Crew dashboard
│       └── client.html            # Client portal
└── docs/
    └── PHASES_1-3_COMPLETE.md    # Implementation summary
```

### Adding New Features

1. **Database Changes**: Update `db/schema.sql` and create migration
2. **API Endpoint**: Add to `server.ts` with authentication
3. **UI**: Create or update HTML file in `web/static/`
4. **Testing**: Test manually with different user roles
5. **Documentation**: Update this README and PHASES document

### Code Style
- Use TypeScript for server-side code
- Vanilla JavaScript for frontend (no build step)
- ES modules for imports
- Parameterized SQL queries (prevent injection)
- Async/await for database operations
- RESTful API conventions

---

## 💰 Cost Estimates

### Free Tier (Current)
- **Supabase**: Free
  - Database: 500 MB
  - Storage: 1 GB
  - Auth: Unlimited
- **Fly.io**: Free
  - 3 shared VMs
  - Auto-sleep
- **Total**: $0/month

### Small Business (10-20 clients)
- **Supabase Pro**: $25/month
  - 8 GB database
  - 100 GB storage
  - Priority support
- **Fly.io**: Free (still within limits)
- **Total**: ~$25/month

### Growing Business (50+ clients)
- **Supabase Pro**: $25/month
- **Fly.io Dedicated**: $15-30/month
- **Total**: ~$40-55/month

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m "Add new feature"`
4. Push to branch: `git push origin feature/new-feature`
5. Open a Pull Request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 📧 Support

For issues, questions, or feature requests:
1. Check this README and `PHASES_1-3_COMPLETE.md`
2. Review `db/SETUP_SUPABASE_STORAGE.md` for storage issues
3. Open an issue on GitHub
4. Contact: support@xcellent1.com

---

## 🎯 Roadmap

### Phase 4 (In Progress)
- [ ] End-to-end testing
- [ ] Mobile responsiveness improvements
- [ ] Performance optimization
- [ ] Security audit
- [ ] User documentation

### Future Enhancements
- [ ] Email notifications (SendGrid/Resend)
- [ ] SMS notifications (Twilio)
- [ ] Direct card payments (Stripe)
- [ ] Route optimization for crew
- [ ] Automated recurring jobs
- [ ] Mobile native apps (React Native)
- [ ] Advanced analytics and reporting
- [ ] Client referral program

---

## 🏆 Acknowledgments

Built with:
- [Deno](https://deno.land) - Modern JavaScript/TypeScript runtime
- [Supabase](https://supabase.com) - Open source Firebase alternative
- [PostgreSQL](https://postgresql.org) - Powerful relational database
- [Fly.io](https://fly.io) - Global application platform

---

**Version**: 1.0.0 (Phases 1-3 Complete)
**Last Updated**: November 2025
