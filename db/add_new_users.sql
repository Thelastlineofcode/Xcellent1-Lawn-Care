-- Add New Users to Xcellent1 Lawn Care
-- This script adds additional crew members and clients to the system
-- Run this in Supabase SQL Editor

-- ============================================
-- CREW MEMBERS
-- ============================================

-- Add more crew members to the users table
INSERT INTO public.users (email, phone, name, role, status) VALUES
  ('james.wilson@xcellent1.com', '555-0004', 'James Wilson', 'crew', 'active'),
  ('maria.garcia@xcellent1.com', '555-0005', 'Maria Garcia', 'crew', 'active'),
  ('david.chen@xcellent1.com', '555-0006', 'David Chen', 'crew', 'active')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- CLIENTS
-- ============================================

-- Add more clients to the users table
INSERT INTO public.users (email, phone, name, role, status) VALUES
  ('john.smith@example.com', '555-2001', 'John Smith', 'client', 'active'),
  ('emily.johnson@example.com', '555-2002', 'Emily Johnson', 'client', 'active'),
  ('michael.brown@example.com', '555-2003', 'Michael Brown', 'client', 'active'),
  ('lisa.davis@example.com', '555-2004', 'Lisa Davis', 'client', 'active'),
  ('robert.miller@example.com', '555-2005', 'Robert Miller', 'client', 'active')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- CREATE CLIENT ACCOUNTS
-- ============================================

-- Link clients to their properties
-- First, create clients table entries for the new client users

WITH new_clients AS (
  SELECT id, name FROM public.users
  WHERE role = 'client' AND email IN (
    'john.smith@example.com',
    'emily.johnson@example.com',
    'michael.brown@example.com',
    'lisa.davis@example.com',
    'robert.miller@example.com'
  )
)
INSERT INTO public.clients (user_id, property_address, property_city, property_state, property_zip, service_plan, balance_due, status)
SELECT
  id,
  CASE name
    WHEN 'John Smith' THEN '123 Oak Street'
    WHEN 'Emily Johnson' THEN '456 Maple Avenue'
    WHEN 'Michael Brown' THEN '789 Pine Road'
    WHEN 'Lisa Davis' THEN '321 Elm Drive'
    WHEN 'Robert Miller' THEN '654 Cedar Lane'
  END,
  'LaPlace',
  'LA',
  CASE name
    WHEN 'John Smith' THEN '70068'
    WHEN 'Emily Johnson' THEN '70068'
    WHEN 'Michael Brown' THEN '70079'
    WHEN 'Lisa Davis' THEN '70068'
    WHEN 'Robert Miller' THEN '70079'
  END,
  CASE name
    WHEN 'John Smith' THEN 'weekly'
    WHEN 'Emily Johnson' THEN 'biweekly'
    WHEN 'Michael Brown' THEN 'weekly'
    WHEN 'Lisa Davis' THEN 'monthly'
    WHEN 'Robert Miller' THEN 'biweekly'
  END,
  0.00,
  'active'
FROM new_clients
ON CONFLICT DO NOTHING;

-- ============================================
-- CREATE SUPABASE AUTH USERS
-- ============================================

-- Use the create_linked_auth_user function from create_auth_users.sql
-- IMPORTANT: Change these passwords before running!

-- Crew Members
SELECT create_linked_auth_user('james.wilson@xcellent1.com', 'James123!Secure');
SELECT create_linked_auth_user('maria.garcia@xcellent1.com', 'Maria123!Secure');
SELECT create_linked_auth_user('david.chen@xcellent1.com', 'David123!Secure');

-- Clients
SELECT create_linked_auth_user('john.smith@example.com', 'John123!Secure');
SELECT create_linked_auth_user('emily.johnson@example.com', 'Emily123!Secure');
SELECT create_linked_auth_user('michael.brown@example.com', 'Michael123!Secure');
SELECT create_linked_auth_user('lisa.davis@example.com', 'Lisa123!Secure');
SELECT create_linked_auth_user('robert.miller@example.com', 'Robert123!Secure');

-- ============================================
-- VERIFY ALL USERS
-- ============================================

-- Check all users and their auth status
SELECT
  u.name,
  u.email,
  u.role,
  u.status,
  u.phone,
  CASE
    WHEN u.auth_user_id IS NOT NULL THEN '✓ Auth Linked'
    ELSE '✗ No Auth'
  END as auth_status,
  CASE
    WHEN u.role = 'client' THEN
      (SELECT COUNT(*) FROM public.clients c WHERE c.user_id = u.id)::TEXT || ' properties'
    ELSE '-'
  END as client_info
FROM public.users u
ORDER BY
  CASE u.role
    WHEN 'owner' THEN 1
    WHEN 'crew' THEN 2
    WHEN 'client' THEN 3
    ELSE 4
  END,
  u.name;

-- ============================================
-- USER SUMMARY
-- ============================================

-- Show count by role
SELECT
  role,
  COUNT(*) as total_users,
  COUNT(auth_user_id) as with_auth,
  COUNT(*) - COUNT(auth_user_id) as without_auth
FROM public.users
GROUP BY role
ORDER BY
  CASE role
    WHEN 'owner' THEN 1
    WHEN 'crew' THEN 2
    WHEN 'client' THEN 3
    ELSE 4
  END;

-- ============================================
-- CLEANUP (Optional)
-- ============================================

-- If you want to remove any test users, uncomment and modify:
-- DELETE FROM public.users WHERE email = 'test@example.com';

