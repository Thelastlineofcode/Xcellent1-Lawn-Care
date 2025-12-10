-- Create a test owner account for immediate testing
-- This creates both the Supabase Auth user and the users table entry
-- Run this in Supabase SQL Editor

-- First, you need to create the auth user in Supabase Auth Dashboard:
-- 1. Go to Authentication > Users in Supabase Dashboard
-- 2. Click "Add User" 
-- 3. Email: test@xcellent1.com
-- 4. Password: Test123!@# (or your choice)
-- 5. Auto Confirm User: YES
-- 6. Copy the User ID that gets created

-- Then run this SQL (replace YOUR_AUTH_USER_ID with the actual ID from step 6):

-- Option 1: If you already created the auth user, insert the profile
INSERT INTO users (auth_user_id, email, name, role, status)
VALUES (
  'YOUR_AUTH_USER_ID'::uuid,  -- Replace with actual auth user ID
  'test@xcellent1.com',
  'Test Owner',
  'owner',
  'active'
)
ON CONFLICT (auth_user_id) DO UPDATE
SET role = 'owner', status = 'active';

-- Verify the user was created
SELECT id, email, name, role, status, auth_user_id 
FROM users 
WHERE email = 'test@xcellent1.com';

-- OR Option 2: Quick test - use the existing demo owner if it exists
UPDATE users 
SET auth_user_id = NULL, status = 'active'
WHERE email = 'owner@xcellent1.com';

SELECT id, email, name, role, status 
FROM users 
WHERE email = 'owner@xcellent1.com';
