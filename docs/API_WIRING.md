# API Wiring Documentation

> Complete API endpoint mapping and data flow documentation for Xcellent1 Lawn
> Care.

## Quick Reference

| Dashboard        | URL                             | API Endpoints Used              |
| ---------------- | ------------------------------- | ------------------------------- |
| Home/Landing     | `/static/home.html`             | `POST /api/waitlist`            |
| Owner Dashboard  | `/static/owner.html`            | `GET /api/owner/metrics`        |
| Manage Clients   | `/static/manage-clients.html`   | `GET/POST /api/owner/clients`   |
| Manage Jobs      | `/static/manage-jobs.html`      | `GET/POST /api/owner/jobs`      |
| Manage Invoices  | `/static/manage-invoices.html`  | `GET/POST /api/owner/invoices`  |
| Manage Waitlist  | `/static/manage-waitlist.html`  | `GET/PATCH /api/owner/waitlist` |
| Pending Payments | `/static/pending-payments.html` | `GET/PATCH /api/owner/payments` |
| Crew Dashboard   | `/static/crew.html`             | `GET /api/crew/:id/jobs`        |
| Client Portal    | `/static/client.html`           | `GET /api/client/invoices`      |

---

## Data Flows

### 1. Waitlist Flow (Public → Owner)

```
[home.html] → POST /api/waitlist → [waitlist table]
                                           ↓
[manage-waitlist.html] ← GET /api/owner/waitlist
                                           ↓
                    PATCH /api/owner/waitlist/:id (update status)
                                           ↓
                    POST /api/owner/waitlist/:id/convert → [users + clients tables]
```

**Form Fields:**

- name, email, phone, property_address (required)
- property_city, property_state, property_zip, preferred_service_plan, notes
  (optional)

### 2. Client Management Flow

```
[manage-clients.html] → POST /api/owner/clients → [users + clients tables]
                      ← GET /api/owner/clients
                      → PUT /api/owner/clients/:id (update)
```

### 3. Job Scheduling Flow

```
[manage-jobs.html] → POST /api/owner/jobs → [jobs table]
                   ← GET /api/owner/jobs
                   → PATCH /api/owner/jobs/:id (update)
                                    ↓
[crew.html] ← GET /api/crew/:id/jobs (filtered by crew_id, date)
            → PATCH /api/jobs/:id/start (status → in_progress)
            → POST /api/jobs/:id/photo → [job_photos table]
            → PATCH /api/jobs/:id/complete (status → completed)
```

### 4. Invoice & Payment Flow

```
[manage-invoices.html] → POST /api/owner/invoices → [invoices table]
                       ← GET /api/owner/invoices
                                    ↓
[client.html] ← GET /api/client/invoices (filtered by user)
              → POST /api/client/invoices/:id/mark-payment → [payments table]
                                    ↓
[pending-payments.html] ← GET /api/owner/payments/pending
                        → PATCH /api/owner/payments/:id/verify (approve/reject)
```

---

## API Endpoints

### Public Endpoints (No Auth)

#### `POST /api/waitlist`

Join the service waitlist.

**Request:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-123-4567",
  "property_address": "123 Main St",
  "property_city": "Dallas",
  "property_state": "TX",
  "property_zip": "75001",
  "preferred_service_plan": "weekly",
  "notes": "Large backyard"
}
```

**Response:**

```json
{
  "ok": true,
  "id": "uuid",
  "message": "Successfully added to waitlist!"
}
```

---

### Owner Endpoints (Requires `owner` role)

#### `GET /api/owner/metrics`

Get business KPIs.

**Response:**

```json
{
  "ok": true,
  "metrics": {
    "total_clients": 15,
    "active_jobs_today": 5,
    "revenue_this_month": 2500.00,
    "pending_payments": 3,
    "waitlist_count": 8
  }
}
```

#### `GET /api/owner/clients`

List all clients.

**Query Params:** `?search=name&status=active`

#### `POST /api/owner/clients`

Create new client.

#### `GET /api/owner/waitlist`

List waitlist entries.

**Query Params:** `?status=pending&search=name`

#### `PATCH /api/owner/waitlist/:id`

Update waitlist entry status/notes.

**Request:**

```json
{
  "status": "contacted",
  "notes": "Called on 12/1"
}
```

#### `POST /api/owner/waitlist/:id/convert`

Convert waitlist entry to client.

**Request:**

```json
{
  "service_plan": "weekly"
}
```

#### `GET /api/owner/jobs`

List all jobs.

**Query Params:** `?date=2025-12-01&status=scheduled&crew_id=uuid`

#### `POST /api/owner/jobs`

Create new job.

#### `GET /api/owner/invoices`

List all invoices.

**Query Params:** `?client_id=uuid&status=unpaid`

#### `POST /api/owner/invoices`

Create invoice.

#### `POST /api/owner/invoices/:id/payment`

Record payment.

#### `GET /api/owner/payments/pending`

List payments pending verification.

#### `PATCH /api/owner/payments/:id/verify`

Approve or reject payment.

**Request:**

```json
{
  "action": "approve"
}
```

---

### Crew Endpoints (Requires `crew` role)

#### `GET /api/crew/:id/jobs`

Get crew's jobs for a date.

**Query Params:** `?date=2025-12-01`

#### `PATCH /api/jobs/:id/start`

Start a job (also available to owner).

#### `POST /api/jobs/:id/photo`

Upload job photo.

**Request:** `multipart/form-data`

- `photo`: File
- `photo_type`: `before` | `after`

---

### Client Endpoints (Requires `client` role)

#### `GET /api/client/invoices`

Get client's invoices.

#### `POST /api/client/invoices/:id/mark-payment`

Report payment sent.

**Request:**

```json
{
  "payment_method": "cashapp",
  "transaction_id": "ABC123",
  "notes": "Paid via Cash App"
}
```

---

## Authentication

All protected endpoints require JWT token:

```http
Authorization: Bearer <supabase-jwt-token>
```

The token is obtained from Supabase Auth on login and contains:

- `sub`: User ID
- `role`: User role (`owner`, `crew`, `client`)

---

## Database Tables

| Table          | Purpose                      |
| -------------- | ---------------------------- |
| `users`        | All users with roles         |
| `clients`      | Client property/billing info |
| `jobs`         | Scheduled work               |
| `job_photos`   | Before/after photos          |
| `invoices`     | Billing records              |
| `payments`     | Payment tracking             |
| `waitlist`     | Prospective clients          |
| `applications` | Job applicants               |

---

## Environment Variables

```env
# Required for database
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres

# Required for auth
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Optional
PORT=8000
```

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "ok": false,
  "error": "Error message here"
}
```

**HTTP Status Codes:**

- `400` - Bad Request (validation error)
- `401` - Unauthorized (no/invalid token)
- `403` - Forbidden (wrong role)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error
- `503` - Database not connected

---

## Testing the API

### Health Check

```bash
curl http://localhost:8000/health
```

### Waitlist Signup

```bash
curl -X POST http://localhost:8000/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "555-0000",
    "property_address": "123 Test St"
  }'
```

### Owner Endpoints (with auth)

```bash
curl http://localhost:8000/api/owner/waitlist \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

_Last Updated: December 2025_
