# Fix Supabase Database Connection on Fly.io

## Problem

The Fly.io deployment is failing to connect to Supabase with this error:

```
TLS connection failed with message: invalid peer certificate: UnknownIssuer
Defaulting to non-encrypted connection
❌ Failed to connect to database: Error: Unknown response for startup: N
```

## Solution: Update Fly.io Environment Variables

You need to set the correct Supabase connection string with SSL settings in your
Fly.io secrets.

### Step 1: Get Your Supabase Connection Details

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **Settings** → **Database**
3. Scroll down to **Connection String** section
4. Copy the **Connection Pooling** URI (this is better for serverless)

It will look like:

```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Step 2: Also Get Your JWT Secret

While you're in Supabase:

1. Go to **Settings** → **API**
2. Copy the **JWT Secret** (under "Config" section)

### Step 3: Set Fly.io Secrets

Run these commands in your terminal (replace the values with your actual
Supabase details):

```bash
# Set the database connection URL (use the pooling URL)
flyctl secrets set DATABASE_URL="postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require" --app xcellent1-lawn-care-rpneaa

# Set your Supabase credentials
flyctl secrets set NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co" --app xcellent1-lawn-care-rpneaa

flyctl secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_ANON_KEY_HERE" --app xcellent1-lawn-care-rpneaa

flyctl secrets set SUPABASE_JWT_SECRET="YOUR_JWT_SECRET_HERE" --app xcellent1-lawn-care-rpneaa
```

### Step 4: Alternative - Use Direct Connection with SSL

If the pooling URL doesn't work, try the direct connection URL:

```bash
flyctl secrets set DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres?sslmode=require" --app xcellent1-lawn-care-rpneaa
```

### Step 5: Restart the App

After setting the secrets, restart the Fly.io machines:

```bash
flyctl machine restart --app xcellent1-lawn-care-rpneaa
```

Or just redeploy:

```bash
flyctl deploy --app xcellent1-lawn-care-rpneaa
```

## Finding Your Values

### Your Supabase Project Details:

- **Project URL**: https://utivthfrwgtjatsusopw.supabase.co
- **Project Ref**: `utivthfrwgtjatsusopw`

You already have the ANON_KEY in your code:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0aXZ0aGZyd2d0amF0c3Vzb3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NTA4NDEsImV4cCI6MjA3ODEyNjg0MX0.hcIzoqBwYSMC-571NRBAd_WMQZumuxavJ282nCNQ7QM
```

### What You Need to Find:

1. **Database Password** - Go to Supabase Dashboard → Settings → Database →
   Reset password if needed
2. **JWT Secret** - Go to Supabase Dashboard → Settings → API → JWT Secret

## Complete Command Template

Once you have all the values, run:

```bash
# Replace these values:
# PROJECT_REF: utivthfrwgtjatsusopw
# YOUR_PASSWORD: Your database password
# YOUR_JWT_SECRET: From Supabase Settings → API → JWT Secret

flyctl secrets set \
  DATABASE_URL="postgresql://postgres.utivthfrwgtjatsusopw:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require" \
  NEXT_PUBLIC_SUPABASE_URL="https://utivthfrwgtjatsusopw.supabase.co" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0aXZ0aGZyd2d0amF0c3Vzb3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NTA4NDEsImV4cCI6MjA3ODEyNjg0MX0.hcIzoqBwYSMC-571NRBAd_WMQZumuxavJ282nCNQ7QM" \
  SUPABASE_JWT_SECRET="YOUR_JWT_SECRET" \
  --app xcellent1-lawn-care-rpneaa

# Then restart
flyctl machine restart --app xcellent1-lawn-care-rpneaa
```

## Verification

After setting the secrets and restarting, check the logs:

```bash
flyctl logs --app xcellent1-lawn-care-rpneaa
```

You should see:

```
✅ Connected to database successfully
```

Instead of:

```
❌ Failed to connect to database
⚠️ Running in fallback mode (in-memory storage)
```

## Troubleshooting

### If you get "password authentication failed":

1. Go to Supabase → Settings → Database
2. Click "Reset Database Password"
3. Copy the new password
4. Update the DATABASE_URL secret with the new password

### If you get SSL errors:

Try changing `sslmode=require` to `sslmode=disable` (not recommended for
production):

```bash
flyctl secrets set DATABASE_URL="postgresql://postgres.utivthfrwgtjatsusopw:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=disable" --app xcellent1-lawn-care-rpneaa
```

### Check Current Secrets

To see what secrets are currently set:

```bash
flyctl secrets list --app xcellent1-lawn-care-rpneaa
```

## Why This Matters

Without the database connection:

- ❌ User authentication won't work (can't verify users)
- ❌ All data is temporary (in-memory)
- ❌ Data is lost on restart
- ❌ Applications, jobs, clients aren't persisted

With the database connection:

- ✅ Full authentication works
- ✅ All data is persisted
- ✅ Users can log in and access their data
- ✅ Production-ready setup

---

**Status**: Needs configuration **Priority**: High - Required for authentication
to work **Estimated Time**: 5 minutes
