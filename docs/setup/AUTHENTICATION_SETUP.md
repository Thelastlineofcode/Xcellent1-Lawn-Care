# Authentication Setup Guide

## Overview

This application now uses **Supabase Auth** for secure user authentication with role-based access control. All dashboards and API endpoints are protected and require valid authentication.

## What Was Implemented

### 1. Database Changes
- ✅ Added `auth_user_id` column to `users` table to link with Supabase Auth
- ✅ Created comprehensive RLS (Row Level Security) policies for role-based data access
- ✅ Added helper function `auth.user_role()` for easy role checking in policies

### 2. Backend Security
- ✅ Removed hardcoded credentials from `server.ts`
- ✅ Implemented JWT verification in `supabase_auth.ts`
- ✅ Created `requireAuth()` middleware for protected routes
- ✅ Protected all API endpoints with role-based authorization:
  - `/api/v1/quotes/estimate` - Owner only
  - `/api/owner/metrics` - Owner only
  - `/api/status` - Owner only
  - `/api/crew/:id/jobs` - Crew (own jobs) or Owner
  - `/api/client/:id/dashboard` - Client (own data) or Owner
  - `/api/jobs/:id/photo` - Crew or Owner
  - `/api/jobs/:id/complete` - Crew or Owner

### 3. Frontend Security
- ✅ Created login page (`/static/login.html`) with Supabase Auth integration
- ✅ Added authentication checks to `owner.html` dashboard
- ✅ Created reusable `auth-helper.js` module for all pages
- ✅ Added logout functionality
- ⏳ **TODO**: Add auth checks to `crew.html`, `client.html`, and `dashboard.html`
- ⏳ **TODO**: Update `portal-index.html` with login link

### 4. Configuration
- ✅ Created `.env.example` template
- ✅ Verified `.env` is in `.gitignore`

## Setup Instructions

### Step 1: Update Database Schema

Run the updated schema in your Supabase SQL Editor:

```bash
# The schema file is located at: db/schema.sql
```

Key changes in the schema:
- New column: `users.auth_user_id`
- New RLS policies for all tables
- Helper function for role-based access

### Step 2: Enable Supabase Auth

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers**
3. Enable **Email** provider
4. Configure email templates (optional)

### Step 3: Add JWT Secret to Environment

1. Go to **Project Settings** > **API**
2. Copy the **JWT Secret** (under "Config")
3. Add it to your `.env` file:

```bash
SUPABASE_JWT_SECRET=your_jwt_secret_here
```

### Step 4: Create User Accounts

You need to create Supabase Auth users and link them to your database users table.

#### Option A: Via Supabase Dashboard (Recommended for Initial Setup)

1. Go to **Authentication** > **Users** > **Add User**
2. Create users with these emails (matching your database):
   - `owner@xcellent1.com` - Password: (choose a secure password)
   - `marcus@xcellent1.com` - Password: (choose a secure password)
   - `priya@xcellent1.com` - Password: (choose a secure password)
   - `sarah@example.com` - Password: (choose a secure password)

3. After creating each user, update the database to link them:

```sql
-- Get the Supabase auth user ID from Authentication > Users
-- Then update your users table:

UPDATE users
SET auth_user_id = 'PASTE_AUTH_USER_ID_HERE'
WHERE email = 'owner@xcellent1.com';

-- Repeat for each user
```

#### Option B: Via SQL Function (Automated)

Create a helper function to sync users:

```sql
-- This function creates Supabase Auth users programmatically
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION create_auth_user(
  user_email TEXT,
  user_password TEXT,
  user_id_to_link UUID
)
RETURNS TEXT AS $$
DECLARE
  new_auth_id UUID;
BEGIN
  -- Create auth user (requires admin privileges)
  INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
  VALUES (
    user_email,
    crypt(user_password, gen_salt('bf')),
    NOW()
  )
  RETURNING id INTO new_auth_id;

  -- Link to users table
  UPDATE users
  SET auth_user_id = new_auth_id
  WHERE id = user_id_to_link;

  RETURN new_auth_id::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example usage:
SELECT create_auth_user(
  'owner@xcellent1.com',
  'SecurePassword123!',
  (SELECT id FROM users WHERE email = 'owner@xcellent1.com')
);
```

### Step 5: Test Authentication

1. Start your Deno server:
```bash
deno run --allow-net --allow-read --allow-write --allow-env server.ts
```

2. Visit `http://localhost:8000/static/login.html`

3. Login with the owner credentials:
   - Email: `owner@xcellent1.com`
   - Password: (the password you set)

4. You should be redirected to `/static/owner.html`

5. Try accessing `/static/owner.html` directly without logging in - you should be redirected to login

### Step 6: Complete Remaining Pages

The following pages still need auth checks added:

1. **crew.html** - Import auth-helper.js and call `requireAuth('crew')`
2. **client.html** - Import auth-helper.js and call `requireAuth('client')`
3. **dashboard.html** - Import auth-helper.js and call `requireAuth('owner')`

Example for crew.html:
```html
<script type="module">
  import { requireAuth } from '/static/auth-helper.js';

  // Check auth on page load
  requireAuth('crew', '.crew-greeting');
</script>
```

## Security Features

### Authentication
- ✅ Supabase JWT tokens with signature verification
- ✅ Secure httpOnly session storage
- ✅ Automatic token refresh
- ✅ Password reset flow

### Authorization
- ✅ Role-based access control (owner, crew, client)
- ✅ Row-level security in database
- ✅ API endpoint protection
- ✅ Frontend route guards

### Best Practices
- ✅ No hardcoded credentials
- ✅ Environment variables for secrets
- ✅ CORS headers configured
- ✅ SQL injection protection (parameterized queries)
- ✅ XSS protection (input validation)

## Troubleshooting

### "Unauthorized" errors on API calls

**Problem**: API returns 401 Unauthorized

**Solutions**:
1. Check that JWT Secret is set in `.env`
2. Verify user's `auth_user_id` matches their Supabase Auth ID
3. Check browser console for token expiration
4. Ensure Authorization header is being sent:
```javascript
// Check in browser DevTools > Network > Headers
Authorization: Bearer eyJhbGc...
```

### User can't log in

**Problem**: "Invalid email or password" error

**Solutions**:
1. Verify email is confirmed in Supabase Dashboard
2. Check that auth user exists in **Authentication** > **Users**
3. Try password reset flow
4. Check Supabase logs for detailed error

### RLS policies blocking queries

**Problem**: Database queries return no results even though data exists

**Solutions**:
1. Verify `auth_user_id` is set correctly in users table
2. Check RLS policies are not too restrictive
3. Test queries as specific users:
```sql
-- Set auth context for testing
SET request.jwt.claims = '{"sub": "auth-user-id-here"}';

-- Run your query
SELECT * FROM jobs;
```

## API Authentication Flow

1. User logs in via `/static/login.html`
2. Supabase returns JWT access token
3. Frontend stores token in `window.supabaseSession`
4. All API calls include `Authorization: Bearer <token>` header
5. Backend verifies JWT signature
6. Backend fetches user profile from database
7. Backend checks user role matches endpoint requirements
8. Request processed or rejected with 401/403

## Next Steps

1. ✅ **DONE**: Database schema updated
2. ✅ **DONE**: Backend authentication implemented
3. ✅ **DONE**: Login page created
4. ✅ **DONE**: Owner dashboard protected
5. ⏳ **TODO**: Add auth to crew, client, and hiring dashboards
6. ⏳ **TODO**: Update portal-index.html
7. ⏳ **TODO**: Test all user roles and permissions
8. ⏳ **TODO**: Set up password reset page (optional)
9. ⏳ **TODO**: Add email verification flow (optional)
10. ⏳ **TODO**: Implement rate limiting on login endpoint (production)

## Support

For issues or questions:
1. Check Supabase documentation: https://supabase.com/docs/guides/auth
2. Review browser console for JavaScript errors
3. Check Deno server logs for backend errors
4. Verify database connection and RLS policies

## Security Checklist

Before going to production:

- [ ] Change all default passwords
- [ ] Add SUPABASE_JWT_SECRET to production environment
- [ ] Enable email verification
- [ ] Set up password complexity requirements
- [ ] Implement rate limiting on auth endpoints
- [ ] Add 2FA for owner accounts (optional)
- [ ] Configure session timeout
- [ ] Set up monitoring and alerts
- [ ] Review and test all RLS policies
- [ ] Conduct security audit

---

**Last Updated**: 2025-11-14
**Authentication System**: Supabase Auth + Custom RLS
**Status**: ⚠️ Partially Complete - Remaining dashboards need auth checks
