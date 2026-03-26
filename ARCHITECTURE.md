# Xcellent1 Lawn Care - Architecture Documentation

## Product Philosophy

### Simple Business Management - No AI Needed

This application is designed as a straightforward field service management
system. The owner explicitly **does not want AI features** - just practical
dashboards for:

1. **Owner**: Manage clients, schedule jobs, create invoices, track payments
2. **Crew**: View daily job list, mark jobs complete, upload photos
3. **Clients**: View their services, invoices, and pay bills online
4. **Waitlist**: Capture and convert website signups

### Explicitly Out of Scope

- ❌ AI-powered scheduling or optimization
- ❌ Chatbots or virtual assistants
- ❌ Automated notifications (beyond basic email)
- ❌ Predictive analytics or forecasting
- ❌ BMAD agents (experimental AI system in `/bmad/` directory)
- ❌ Machine learning features

**Focus**: Manual control with simple, reliable tools.

---

## Server Architecture

### Active Server Implementation

**Primary Server**: `/server.ts` (root directory)

This is the production server with full Supabase authentication, role-based
access control, and comprehensive API endpoints.

**To start the server:**

```bash
deno task start   # Production
deno task dev     # Development with auto-reload
```

### File Status

| File                | Status     | Purpose                           |
| ------------------- | ---------- | --------------------------------- |
| `/server.ts`        | ✅ ACTIVE  | Production server - use this      |
| `/web/server.ts`    | ⚠️ ARCHIVE | Legacy minimal server - not used  |
| `/api-endpoints.ts` | ⚠️ ARCHIVE | Experimental endpoints - not used |

### Why Multiple Server Files Exist

The project went through several iterations:

1. **web/server.ts** - Initial lightweight server for static file serving
2. **api-endpoints.ts** - Experimental API design with different auth pattern
3. **server.ts** (root) - Final production server combining best of both

**Decision**: Root `/server.ts` is the canonical implementation.

---

## Database Architecture

### Active Schema

**Primary Schema**: `/db/schema.sql`

This schema includes:

- ✅ Supabase Auth integration via `auth_user_id` foreign keys
- ✅ Row Level Security (RLS) policies
- ✅ Helper functions (`get_crew_jobs`, `get_owner_metrics`, etc.)
- ✅ Role-based access control (owner, crew, client, applicant)

### Schema Status

| File                      | Status       | Purpose                              |
| ------------------------- | ------------ | ------------------------------------ |
| `/db/schema.sql`          | ✅ ACTIVE    | Production schema - use this         |
| `/database-schema.sql`    | ⚠️ LEGACY    | Old schema without auth integration  |
| `/db/database-schema.sql` | ⚠️ DUPLICATE | Exact copy of `/database-schema.sql` |

**Decision**: Use `/db/schema.sql` as it has proper auth integration and matches
server.ts implementation.

### Key Schema Features

**Tables:**

- `users` - All system users with `auth_user_id` linking to Supabase Auth
- `clients` - Customer accounts with property information
- `jobs` - Work assignments with crew and client relationships
- `job_photos` - Before/after photos linked to jobs
- `invoices` & `payments` - Billing system
- `applications` - Worker recruitment
- `outbox_events` - Event sourcing for async operations

**Authentication Flow:**

```
Supabase Auth (auth.users)
         ↓
    auth_user_id (FK)
         ↓
   public.users (role, email, name)
         ↓
Role-based RLS policies
```

---

## Authentication Architecture

### Flow

1. **Login** (`login.html`)
   - User enters email/password
   - Calls Supabase `signInWithPassword()`
   - Receives JWT token
   - Queries `users` table for role
   - Redirects to role-specific dashboard

2. **Protected Routes** (server.ts)
   - Middleware validates JWT signature using `SUPABASE_JWT_SECRET`
   - Looks up user profile in `users` table
   - Checks role-based permissions
   - Returns 401/403 if unauthorized

3. **Frontend Protection** (`auth-helper.js`)
   - Validates session on page load
   - Redirects to login if not authenticated
   - Stores session in localStorage

### Roles

| Role        | Access                                           |
| ----------- | ------------------------------------------------ |
| `owner`     | Full access to all data and operations           |
| `crew`      | View assigned jobs, upload photos, complete jobs |
| `client`    | View own jobs, invoices, payments                |
| `applicant` | Limited access (future feature)                  |

---

## API Endpoints

### Current Implementation (server.ts)

**Public Endpoints:**

```
GET    /health                      - Health check
GET    /config.js                   - Runtime config for frontend
POST   /api/leads                   - Lead capture
POST   /api/waitlist                - Waitlist signup
POST   /api/careers/apply           - Job applications
POST   /api/service-inquiry         - Service request form
```

**Protected Endpoints:**

```
GET    /api/crew/:id/jobs           [crew, owner]   - Get crew's daily jobs
GET    /api/owner/metrics           [owner]         - Business KPIs
GET    /api/client/:id/dashboard    [client, owner] - Client dashboard data
POST   /api/jobs/:id/photo          [crew, owner]   - Upload job photo
PATCH  /api/jobs/:id/complete       [crew, owner]   - Mark job complete
POST   /api/v1/quotes/estimate      [owner]         - Generate quote
GET    /api/status                  [owner]         - System status
```

### Endpoint Architecture

All protected endpoints use this pattern:

```typescript
const authResult = await requireAuth(req, ["allowed", "roles"]);
if (!authResult.authorized) {
  return authResult.response; // 401 or 403
}
const { auth } = authResult;
// Handle request with authenticated user
```

---

## Frontend Architecture

### Pages

**Public Pages:**

- `index.html` - Landing page (redirects to home.html)
- `home.html` - Marketing homepage
- `shop.html` - Product catalog
- `careers.html` - Job applications
- `login.html` - Authentication
- `blog-*.html` - Educational content

**Protected Pages:**

- `owner.html` - Business dashboard (KPIs, metrics, quick actions)
- `crew.html` - Daily job list with navigation and photo upload
- `client.html` - Client portal (jobs, photos, invoices)
- `dashboard.html` - Hiring manager dashboard

**Management Pages (Owner Only):**

- `manage-clients.html` - Client management (CRUD operations)
- `manage-jobs.html` - Job scheduling and assignment
- `manage-invoices.html` - Invoice creation and payment tracking

### Dashboard Data Flow

**Current Status:**

| Dashboard | Fetch Implemented                    | Backend Ready      | Status   |
| --------- | ------------------------------------ | ------------------ | -------- |
| Owner     | ✅ Calls `/api/owner/metrics`        | ✅ Yes             | Complete |
| Crew      | ✅ Calls `/api/crew/:id/jobs`        | ✅ Endpoint exists | Complete |
| Client    | ✅ Calls `/api/client/:id/dashboard` | ✅ Endpoint exists | Complete |

**Management Pages:**

| Page                 | Purpose                  | Status      |
| -------------------- | ------------------------ | ----------- |
| manage-clients.html  | Add/edit/list clients    | ✅ Complete |
| manage-jobs.html     | Schedule & assign jobs   | ✅ Complete |
| manage-invoices.html | Create & manage invoices | ✅ Complete |

---

## File Structure

```
/
├── server.ts                 ✅ ACTIVE - Production server
├── deno.json                 ✅ ACTIVE - Deno configuration
├── .env                      ⚠️  LOCAL - Environment variables (gitignored)
├── .env.example              ✅ ACTIVE - Environment template
│
├── db/
│   ├── schema.sql            ✅ ACTIVE - Production database schema
│   ├── create_auth_users.sql ✅ ACTIVE - Link users to Supabase Auth
│   ├── add_new_users.sql     ✅ ACTIVE - Add crew/client users
│   └── migrations/           ✅ ACTIVE - Migration files
│
├── web/
│   ├── static/               ✅ ACTIVE - All frontend files
│   │   ├── *.html            ✅ ACTIVE - Web pages
│   │   ├── styles.css        ✅ ACTIVE - Global styles
│   │   ├── auth-helper.js    ✅ ACTIVE - Frontend auth
│   │   └── images/           ✅ ACTIVE - Assets
│   │
│   └── server.ts             ⚠️  ARCHIVE - Legacy server (not used)
│
├── bmad/                     ⚠️  EXPERIMENTAL - AI agents (incomplete)
├── database-schema.sql       ⚠️  ARCHIVE - Old schema
├── api-endpoints.ts          ⚠️  ARCHIVE - Experimental endpoints
│
└── docs/
    ├── DEPLOY_DATABASE.md    ✅ ACTIVE - Database deployment guide
    ├── SUPABASE_CLI_SETUP.md ✅ ACTIVE - Supabase CLI guide
    └── AUTH_CONFIG_REVIEW.md ✅ ACTIVE - Authentication review
```

---

## Environment Variables

### Required (Production)

```bash
# Server
PORT=8000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
SUPABASE_JWT_SECRET=[jwt_secret]
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

### Optional (Notifications)

```bash
# Email notifications (SendGrid)
SENDGRID_API_KEY=[key]

# SMS notifications (Twilio)
TWILIO_ACCOUNT_SID=[sid]
TWILIO_AUTH_TOKEN=[token]
TWILIO_PHONE_NUMBER=[number]
```

See `.env.example` for complete list.

---

## Development Workflow

### Initial Setup

```bash
# 1. Clone repository
git clone [repo-url]
cd Xcellent1-Lawn-Care

# 2. Copy environment template
cp .env.example .env

# 3. Configure Supabase credentials in .env
# Get these from: https://app.supabase.com/project/_/settings/api

# 4. Deploy database schema
# Use Supabase SQL Editor or psql to run: db/schema.sql

# 5. Create auth users
# Run: db/create_auth_users.sql
# Run: db/add_new_users.sql
```

### Running the Server

```bash
# Development (auto-reload on changes)
deno task dev

# Production
deno task start

# Type checking
deno task check
```

### Testing

```bash
# Run tests
deno task test

# Check health endpoint
curl http://localhost:8000/health
```

---

## Deployment

See deployment guides:

- `DEPLOY_DATABASE.md` - Supabase database deployment
- `SUPABASE_CLI_SETUP.md` - CLI configuration
- `README.md` - General setup instructions

---

## Known Issues & TODOs

### High Priority

1. ✅ **Connect frontend to backend** - COMPLETED
   - ✅ crew.html fetches from `/api/crew/:id/jobs`
   - ✅ client.html fetches from `/api/client/:id/dashboard`
   - ✅ owner.html uses `/api/owner/metrics`

2. ✅ **Management UIs Built** - COMPLETED
   - ✅ Client management page (add/edit/list)
   - ✅ Job scheduling and assignment page
   - ✅ Invoice creation and management page

3. **Photo storage**
   - Backend accepts uploads but doesn't store to Supabase Storage
   - TODO: Implement Supabase Storage integration

4. **Email/SMS notifications**
   - Placeholder TODOs in code
   - Need SendGrid/Twilio integration

### Medium Priority

1. **Payment processing**
   - Client dashboard has payment buttons but no processor
   - Consider Stripe integration

2. ✅ **Tests** - COMPLETED
   - ✅ Unit tests for auth logic
   - ✅ Integration tests for API endpoints
   - ✅ E2E user journey tests
   - Run with: `deno task test`

### Low Priority

1. **BMAD agents** (`bmad/` directory)
   - Experimental AI agent system
   - Incomplete implementation
   - Consider removing or completing

---

## Architecture Decisions

### Why Deno?

- Modern runtime with built-in TypeScript
- Secure by default (explicit permissions)
- Standard library includes HTTP server
- No package.json complexity

### Why Supabase?

- PostgreSQL with built-in auth
- Row Level Security for data isolation
- Real-time subscriptions (future feature)
- File storage for photos
- Generous free tier

### Why Root server.ts?

After experimenting with multiple approaches, root `server.ts` provides:

- ✅ Full Supabase integration
- ✅ JWT signature verification
- ✅ Role-based access control
- ✅ Comprehensive endpoint coverage
- ✅ Production-ready error handling

---

## Contributing

When modifying the codebase:

1. **Server changes**: Edit `/server.ts` (root)
2. **Database changes**: Edit `/db/schema.sql`, create migration
3. **Frontend changes**: Edit files in `/web/static/`
4. **Documentation**: Update this file and relevant guides

**Do not**:

- Modify `/web/server.ts` (archived)
- Modify `/database-schema.sql` (legacy)
- Use `/api-endpoints.ts` (experimental)

---

## Support

For questions or issues:

- Check `README.md` for basic setup
- Review deployment guides in root directory
- Check Supabase logs: https://app.supabase.com/project/_/logs

Last updated: 2025-11-17
