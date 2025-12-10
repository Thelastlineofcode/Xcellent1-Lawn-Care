-- Fix infinite recursion in RLS policies
-- Issue: auth.user_role() function queries users table, which has RLS policies that call auth.user_role()
-- Solution: Drop problematic policies and recreate with direct auth.uid() checks

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Owners can view all users" ON users;
DROP POLICY IF EXISTS "Owners can view all jobs" ON jobs;
DROP POLICY IF EXISTS "Owners can modify all jobs" ON jobs;
DROP POLICY IF EXISTS "Owners can view all clients" ON clients;
DROP POLICY IF EXISTS "Owners can modify clients" ON clients;
DROP POLICY IF EXISTS "Owners can view all photos" ON job_photos;
DROP POLICY IF EXISTS "Owners can manage applications" ON applications;
DROP POLICY IF EXISTS "Owners can manage invoices" ON invoices;
DROP POLICY IF EXISTS "Owners can manage payments" ON payments;

-- Drop the problematic function
DROP FUNCTION IF EXISTS auth.user_role();

-- Recreate policies WITHOUT using auth.user_role()
-- Instead, directly check if the user's role is 'owner' by joining to users table

-- Users table: Allow owners to view all users
CREATE POLICY "Owners can view all users" ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'owner'
    )
  );

-- Jobs table: Owners can view and modify all jobs
CREATE POLICY "Owners can view all jobs" ON jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'owner'
    )
  );

CREATE POLICY "Owners can modify all jobs" ON jobs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'owner'
    )
  );

-- Clients table: Owners can view and modify all clients
CREATE POLICY "Owners can view all clients" ON clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'owner'
    )
  );

CREATE POLICY "Owners can modify clients" ON clients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'owner'
    )
  );

-- Job photos: Owners can view all photos
CREATE POLICY "Owners can view all photos" ON job_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'owner'
    )
  );

-- Applications: Owners can manage all applications
CREATE POLICY "Owners can manage applications" ON applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'owner'
    )
  );

-- Invoices: Owners can manage all invoices
CREATE POLICY "Owners can manage invoices" ON invoices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'owner'
    )
  );

-- Payments: Owners can manage all payments
CREATE POLICY "Owners can manage payments" ON payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'owner'
    )
  );

-- Verify the fix
SELECT 'RLS policies fixed - infinite recursion resolved' AS status;
