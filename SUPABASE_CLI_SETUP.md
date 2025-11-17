# Supabase CLI Setup Guide

**Status**: Supabase CLI installed ✅ (v2.58.5)
**Project**: Not linked yet ⚠️

---

## 📋 Current Situation

### ✅ What's Ready:
- Supabase CLI binary downloaded and available (`./supabase`)
- .env.example template exists
- Authentication code ready in codebase
- Database schema ready to deploy

### ❌ What's Missing:
- `.env` file with actual Supabase credentials
- Supabase CLI not authenticated
- Project not linked to CLI

---

## 🚀 Quick Setup Options

### **Option 1: Use Existing Supabase Project (Recommended)**

If you already have a Supabase project with the owner user configured:

#### Step 1: Login to Supabase CLI

```bash
./supabase login
```

This will open a browser to authenticate with your Supabase account.

#### Step 2: Link Your Project

```bash
./supabase link --project-ref YOUR_PROJECT_REF
```

You can find your project ref in your Supabase dashboard URL:
`https://app.supabase.com/project/YOUR_PROJECT_REF/...`

#### Step 3: Get Environment Variables

```bash
# Get all env vars in one command
./supabase status --output env > .env

# Or manually get specific values:
./supabase projects api-keys --project-ref YOUR_PROJECT_REF
```

#### Step 4: Verify .env File

```bash
cat .env
```

Should contain:
```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
API_URL=https://YOUR_PROJECT.supabase.co
DB_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
```

#### Step 5: Add Missing Variables

Edit `.env` and add:
```env
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
DATABASE_URL=${DB_URL}

# Get JWT Secret from: https://app.supabase.com/project/YOUR_PROJECT/settings/api
SUPABASE_JWT_SECRET=your_jwt_secret_here
```

---

### **Option 2: Manual Configuration (If CLI Doesn't Work)**

#### Step 1: Create .env File

```bash
cp .env.example .env
```

#### Step 2: Get Credentials from Supabase Dashboard

Visit: https://app.supabase.com/project/YOUR_PROJECT/settings/api

Copy these values:

| Field | Location | Variable Name |
|-------|----------|---------------|
| **Project URL** | API Settings → Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| **anon public** | API Settings → anon/public key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **JWT Secret** | API Settings → Config → JWT Secret | `SUPABASE_JWT_SECRET` |

#### Step 3: Get Database Connection String

Visit: https://app.supabase.com/project/YOUR_PROJECT/settings/database

Copy the **Connection String** (Pooler mode for production, Direct mode for local dev)

Format:
```
postgresql://postgres:[YOUR-PASSWORD]@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
```

#### Step 4: Edit .env File

```bash
nano .env
```

Paste your actual values:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...your_actual_key
SUPABASE_JWT_SECRET=your_actual_jwt_secret

# Database
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"
```

---

## 🧪 Test the Configuration

### 1. Test Supabase Connection

```bash
# Start the server
deno run --allow-all server.ts

# In another terminal, test the health endpoint
curl http://localhost:8000/health
```

Expected response:
```json
{
  "ok": true,
  "supabase": {
    "configured": true,
    "url": "https://YOUR_PROJECT.supabase.co",
    "reachable": true
  }
}
```

### 2. Test Config Endpoint

```bash
curl http://localhost:8000/config.js
```

Should return:
```javascript
window.__ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "https://...",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJ..."
};
```

### 3. Test Login Page

Visit: http://localhost:8000/static/login.html

Try logging in with:
- **Email**: owner@xcellent1.com
- **Password**: (the password you configured in Supabase)

---

## 🔧 Deploy Database Schema

Once your .env is configured and you can connect:

### Option A: Via Supabase CLI

```bash
# Make sure you're linked to the project
./supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
./supabase db push

# Or run specific SQL file
./supabase db execute -f db/schema.sql
```

### Option B: Via Supabase Dashboard

1. Go to: https://app.supabase.com/project/YOUR_PROJECT/sql/new
2. Copy contents of `db/schema.sql`
3. Paste and run
4. Then run `db/create_auth_users.sql` to create auth users
5. Then run `db/add_new_users.sql` to add more users

---

## 📝 Supabase CLI Cheat Sheet

```bash
# Login to Supabase
./supabase login

# List your projects
./supabase projects list

# Link to a project
./supabase link --project-ref YOUR_PROJECT_REF

# Get project status
./supabase status

# Get API keys
./supabase projects api-keys

# Run SQL query
./supabase db execute -f your-file.sql

# Start local development (optional)
./supabase start

# Generate TypeScript types from database
./supabase gen types typescript --local > types/supabase.ts
```

---

## 🎯 Next Steps After Setup

1. ✅ Verify `.env` file exists with correct credentials
2. ✅ Test server startup: `deno run --allow-all server.ts`
3. ✅ Test health endpoint shows Supabase configured
4. ✅ Deploy database schema
5. ✅ Create auth users
6. ✅ Test login at `/static/login.html`
7. ✅ Access owner dashboard

---

## ⚠️ Troubleshooting

### "Supabase client not configured" Warning

**Cause**: Missing or incorrect env vars
**Fix**: Verify all required vars are in `.env`:
```bash
grep SUPABASE .env
```

### "Database connection failed"

**Cause**: Wrong DATABASE_URL or password
**Fix**: Check connection string in Supabase dashboard

### "JWT verification error"

**Cause**: Wrong SUPABASE_JWT_SECRET
**Fix**: Get the correct JWT Secret from Supabase dashboard → Settings → API → Config → JWT Secret

### "User profile not found"

**Cause**: Auth user exists but not linked to database user
**Fix**: Run `db/create_auth_users.sql` to link them

---

## 📂 Files Reference

| File | Purpose |
|------|---------|
| `.env` | Your actual credentials (git-ignored) |
| `.env.example` | Template with placeholders |
| `db/schema.sql` | Database schema with RLS |
| `db/create_auth_users.sql` | Links existing users to auth |
| `db/add_new_users.sql` | Adds 8 new users |
| `supabase_auth.ts` | Server-side JWT verification |
| `web/static/auth-helper.js` | Client-side auth module |
| `web/static/login.html` | Login page |

