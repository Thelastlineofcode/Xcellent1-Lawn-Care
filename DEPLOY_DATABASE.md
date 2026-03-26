# Database Deployment Guide

This guide will walk you through deploying the Xcellent1 Lawn Care database
schema to your Supabase project.

## Prerequisites

✅ **Environment configured** - You have `.env.local` file with Supabase
credentials (copy from `.env.local.example`) ✅ **Supabase project** - You have
a Supabase project at: `https://utivthfrwgtjatsusopw.supabase.co` ✅ **Owner
account** - You mentioned ✅ **Local env** - Copy `.env.local.example` to
`.env.local` and populate Supabase credentials ✅ **Validate env** - Run
`scripts/check_env.sh` to verify local env before starting the server there's
already an owner user in Supabase Auth

## Deployment Options

### Option 1: Supabase Dashboard (Recommended)

This is the easiest method and requires no additional setup.

#### Steps:

1. **Go to SQL Editor**
   - Open https://supabase.com/dashboard/project/utivthfrwgtjatsusopw/sql
   - Click "New Query"

2. **Deploy Main Schema**
   - Copy the contents of `db/schema.sql`
   - Paste into the SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - Wait for confirmation: "Success. No rows returned"

3. **Create Auth User Function**
   - Click "New Query" again
   - Copy the contents of `db/create_auth_users.sql`
   - Paste and Run
   - This creates the helper function to link users to Supabase Auth

4. **Link Existing Owner**
   - In the same SQL Editor, run:
   ```sql
   -- Link the existing owner auth user to the database user
   UPDATE public.users
   SET auth_user_id = (
     SELECT id FROM auth.users
     WHERE email = 'owner@xcellent1.com'
     LIMIT 1
   )
   WHERE email = 'owner@xcellent1.com';
   ```

5. **Add New Users**
   - Click "New Query"
   - Copy contents of `db/add_new_users.sql`
   - Paste and Run
   - This adds 3 crew members and 5 clients with auth accounts

6. **Verify Deployment**
   ```sql
   -- Check all users
   SELECT email, name, role, auth_user_id FROM public.users;

   -- Check clients
   SELECT u.name, u.email, c.property_address, c.service_plan
   FROM users u
   JOIN clients c ON c.user_id = u.id
   WHERE u.role = 'client';
   ```

### Option 2: Using psql (Alternative)

If you prefer command line:

```bash
# Set password
export PGPASSWORD='Parkplace1030$'

# Deploy schema
psql -h db.utivthfrwgtjatsusopw.supabase.co \
     -U postgres \
     -d postgres \
     -p 5432 \
     -f db/schema.sql

# Create auth function
psql -h db.utivthfrwgtjatsusopw.supabase.co \
     -U postgres \
     -d postgres \
     -p 5432 \
     -f db/create_auth_users.sql

# Add new users
psql -h db.utivthfrwgtjatsusopw.supabase.co \
     -U postgres \
     -d postgres \
     -p 5432 \
     -f db/add_new_users.sql
```

## What Gets Deployed

### 1. Database Schema (`db/schema.sql`)

Creates these tables with Row Level Security (RLS):

- **users** - All system users (crew, owner, client, applicant)
- **applications** - Worker job applications
- **clients** - Customer accounts with property info
- **jobs** - Work assignments
- **job_photos** - Before/after photos
- **invoices** - Billing
- **payments** - Payment tracking
- **outbox_events** - Event sourcing

### 2. Initial Demo Data

Includes 4 demo users:

- `owner@xcellent1.com` - Business Owner (owner role)
- `marcus@xcellent1.com` - Marcus T. (crew)
- `priya@xcellent1.com` - Priya K. (crew)
- `sarah@example.com` - Sarah Martinez (client with demo job)

### 3. New Users (`db/add_new_users.sql`)

Adds 8 additional users:

**Crew Members (3):**

- James Wilson - james.wilson@xcellent1.com
- Maria Garcia - maria.garcia@xcellent1.com
- David Chen - david.chen@xcellent1.com

**Clients (5):**

- John Smith - 123 Oak Street, LaPlace, LA 70068 (weekly)
- Emily Johnson - 456 Maple Avenue, LaPlace, LA 70068 (biweekly)
- Michael Brown - 789 Pine Road, LaPlace, LA 70079 (weekly)
- Lisa Davis - 321 Elm Drive, LaPlace, LA 70068 (monthly)
- Robert Miller - 654 Cedar Lane, LaPlace, LA 70079 (biweekly)

All new users get Supabase Auth accounts with default password:
`XcellentLawn2024!`

## Default Passwords

⚠️ **IMPORTANT**: All auto-created auth users use the password:
`XcellentLawn2024!`

Users should change their password on first login.

To change the default password in the script before deployment:

- Edit `db/add_new_users.sql`
- Find the line: `user_password := 'XcellentLawn2024!';`
- Change to your preferred default password

## Verify Authentication Works

After deployment, you can test the authentication:

1. **Start the server**:
   ```bash
   deno task dev
   ```

2. **Open the login page**:
   ```
   http://localhost:8000/login.html
   ```

3. **Test login** with any user:
   - Email: `owner@xcellent1.com`
   - Password: `XcellentLawn2024!` (or whatever was set in Supabase Auth)

4. **Check authentication** in browser console:
   - Should see redirect to appropriate dashboard
   - JWT token should be stored in localStorage

## Troubleshooting

### "Auth user already exists" error

If you see this when linking the owner:

```sql
-- Check auth users
SELECT id, email FROM auth.users WHERE email = 'owner@xcellent1.com';

-- Manually link if needed
UPDATE public.users
SET auth_user_id = 'AUTH_UUID_HERE'
WHERE email = 'owner@xcellent1.com';
```

### "Function already exists" warnings

These are safe to ignore. The `CREATE OR REPLACE` statements will update
existing functions.

### RLS Policy errors

If you get RLS policy errors, it means policies already exist. You can:

1. Drop existing policies first:
   ```sql
   DROP POLICY IF EXISTS "Users can view own profile" ON users;
   ```
2. Or skip the schema.sql and just run add_new_users.sql

### Can't connect via psql

If DNS resolution fails, use the Supabase Dashboard method instead.

## Next Steps

After deployment:

1. ✅ Test login at http://localhost:8000/login.html
2. ✅ Verify owner can access owner dashboard
3. ✅ Verify crew can see their jobs
4. ✅ Verify clients can view their account
5. ✅ Ask all users to change their default passwords

## Security Notes

- 🔒 All tables have Row Level Security (RLS) enabled
- 🔒 Users can only access data appropriate to their role
- 🔒 JWT tokens are verified server-side using SUPABASE_JWT_SECRET
- 🔒 Passwords are hashed using bcrypt
- 🔒 Default passwords should be changed immediately

## Support

If you encounter issues:

1. Check Supabase logs:
   https://supabase.com/dashboard/project/utivthfrwgtjatsusopw/logs
2. Review AUTH_CONFIG_REVIEW.md for authentication setup details
3. Check that .env has correct SUPABASE_JWT_SECRET
