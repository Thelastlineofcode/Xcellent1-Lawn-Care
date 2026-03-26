# Authentication Setup - Next Steps

All authentication code has been implemented! Here's what you need to do to
activate it:

## Step 1: Run the SQL Script to Create Auth Users

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to the **SQL Editor** (left sidebar)
3. Click **New query**
4. Open the file: `db/create_auth_users.sql`
5. **IMPORTANT**: Change the passwords in the script before running! Look for
   these lines:

```sql
SELECT create_linked_auth_user('owner@xcellent1.com', 'Owner123!Secure');
SELECT create_linked_auth_user('marcus@xcellent1.com', 'Marcus123!Secure');
SELECT create_linked_auth_user('priya@xcellent1.com', 'Priya123!Secure');
SELECT create_linked_auth_user('sarah@example.com', 'Sarah123!Secure');
```

Replace the passwords with your own secure passwords.

6. Run the script in Supabase SQL Editor
7. You should see success messages for each user created

## Step 2: Test the Login Flow

1. Start your Deno server:

```bash
deno run --allow-net --allow-read --allow-write --allow-env server.ts
```

2. Visit: http://localhost:8000/static/login.html

3. Try logging in with one of the accounts:
   - **Owner**: owner@xcellent1.com (with the password you set)
   - **Crew**: marcus@xcellent1.com or priya@xcellent1.com
   - **Client**: sarah@example.com

4. You should be redirected to the appropriate dashboard based on your role

## Step 3: Test Protected Routes

Try accessing a protected page directly without logging in:

- http://localhost:8000/static/owner.html
- http://localhost:8000/static/crew.html
- http://localhost:8000/static/client.html

You should be automatically redirected to the login page!

## What's Been Implemented

### ✅ Database

- Added `auth_user_id` column to link users with Supabase Auth
- Added Row Level Security (RLS) policies for role-based access
- Created helper function for role checking

### ✅ Backend (server.ts)

- Removed hardcoded credentials
- Added JWT verification middleware
- Protected all API endpoints with role-based authorization
- Uses Supabase Auth tokens for authentication

### ✅ Frontend

- ✅ **Login page** ([web/static/login.html](web/static/login.html)) with
  Supabase Auth
- ✅ **Auth helper** ([web/static/auth-helper.js](web/static/auth-helper.js))
  for reusable auth functions
- ✅ **Owner dashboard** ([web/static/owner.html](web/static/owner.html))
  protected
- ✅ **Crew dashboard** ([web/static/crew.html](web/static/crew.html)) protected
- ✅ **Client portal** ([web/static/client.html](web/static/client.html))
  protected
- ✅ **Hiring dashboard**
  ([web/static/dashboard.html](web/static/dashboard.html)) protected
- ✅ **Portal index**
  ([web/static/portal-index.html](web/static/portal-index.html)) updated with
  login link

### 🔐 Security Features

- JWT token verification
- Role-based access control (RBAC)
- Automatic token refresh
- Secure session management
- Password reset flow ready
- RLS policies in database
- No hardcoded credentials

## Troubleshooting

### "Unauthorized" errors

1. Check that `SUPABASE_JWT_SECRET` is set in your `.env` file
2. Get it from: Supabase Dashboard → Settings → API → JWT Secret
3. Make sure it's the JWT Secret, not the API key!

### Can't login

1. Verify the user exists in: Supabase Dashboard → Authentication → Users
2. Check that `auth_user_id` is set in your `users` table
3. Run this query in Supabase to check:

```sql
SELECT u.name, u.email, u.role, u.auth_user_id,
  CASE WHEN u.auth_user_id IS NOT NULL THEN '✓ Linked' ELSE '✗ Not linked' END as status
FROM users u;
```

### Still having issues?

Check the detailed guide in [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md)
for more troubleshooting steps.

## Environment Variables Checklist

Make sure your `.env` file has:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret  # ← Most important for auth!
```

## What's Next?

After authentication is working:

1. Test all user roles (owner, crew, client)
2. Test logout functionality
3. Try the password reset flow
4. Configure email templates in Supabase (optional)
5. Add rate limiting for production (optional)
6. Enable 2FA for owner accounts (optional)

---

**Status**: Ready to activate! Just run the SQL script and test. **Last
Updated**: 2025-11-14
