-- Supabase Auth User Creation Script
-- Run this in your Supabase SQL Editor to create auth users and link them to the users table
--
-- IMPORTANT: Change the passwords below before running!

-- Create function to create auth users and link them
CREATE OR REPLACE FUNCTION create_linked_auth_user(
  user_email TEXT,
  user_password TEXT
)
RETURNS TEXT AS $$
DECLARE
  new_auth_id UUID;
  db_user_id UUID;
BEGIN
  -- Get the database user ID
  SELECT id INTO db_user_id
  FROM public.users
  WHERE email = user_email;

  IF db_user_id IS NULL THEN
    RETURN 'ERROR: User with email ' || user_email || ' not found in users table';
  END IF;

  -- Check if auth user already exists
  IF EXISTS (SELECT 1 FROM public.users WHERE email = user_email AND auth_user_id IS NOT NULL) THEN
    RETURN 'SKIPPED: Auth user already linked for ' || user_email;
  END IF;

  -- Create auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    FALSE,
    '',
    ''
  )
  RETURNING id INTO new_auth_id;

  -- Link to users table
  UPDATE public.users
  SET auth_user_id = new_auth_id
  WHERE id = db_user_id;

  RETURN 'SUCCESS: Created auth user for ' || user_email || ' (auth_id: ' || new_auth_id || ')';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create auth users for each user in the database
-- CHANGE THESE PASSWORDS BEFORE RUNNING!

SELECT create_linked_auth_user('owner@xcellent1.com', 'Owner123!Secure');
SELECT create_linked_auth_user('marcus@xcellent1.com', 'Marcus123!Secure');
SELECT create_linked_auth_user('priya@xcellent1.com', 'Priya123!Secure');
SELECT create_linked_auth_user('sarah@example.com', 'Sarah123!Secure');

-- Verify the users were created and linked
SELECT
  u.name,
  u.email,
  u.role,
  u.auth_user_id,
  CASE
    WHEN u.auth_user_id IS NOT NULL THEN '✓ Linked'
    ELSE '✗ Not linked'
  END as link_status
FROM public.users u
ORDER BY u.role, u.name;

-- Clean up the function (optional - comment out if you want to keep it)
-- DROP FUNCTION IF EXISTS create_linked_auth_user(TEXT, TEXT);
