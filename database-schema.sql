-- Xcellent1 Lawn Care - Database Schema
-- Supabase SQL Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS
ALTER DATABASE postgres SET "app.settings.jwt_secret" = 'your-jwt-secret';

-- ============================================
-- CORE TABLES
-- ============================================

-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waitlist table
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip TEXT,
  service_date DATE,
  status TEXT DEFAULT 'pending', -- pending, contacted, booked, converted
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crew members table
CREATE TABLE crew (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- active, inactive, on_leave
  availability TEXT, -- Monday-Friday, weekends, custom
  hire_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  crew_id UUID REFERENCES crew(id) ON DELETE SET NULL,
  job_date DATE NOT NULL,
  job_time TEXT, -- "09:00-11:00"
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip TEXT,
  job_type TEXT, -- "mowing", "fertilizing", "aeration", "seeding"
  description TEXT,
  status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Job photos table
CREATE TABLE job_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT, -- "before", "after", "progress"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'draft', -- draft, sent, viewed, paid, overdue
  stripe_invoice_id TEXT,
  stripe_payment_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  due_date DATE
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, completed, failed, refunded
  stripe_payment_id TEXT,
  stripe_charge_id TEXT,
  payment_method TEXT, -- "stripe", "cash", "check"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Applications table (for crew hiring)
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  experience TEXT,
  availability TEXT,
  resume_url TEXT,
  message TEXT,
  status TEXT DEFAULT 'new', -- new, reviewed, rejected, hired
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES (for performance)
-- ============================================

CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_crew_id ON jobs(crew_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_date ON jobs(job_date);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_paid_at ON invoices(paid_at);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_waitlist_status ON waitlist(status);
CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_crew_status ON crew(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CUSTOMERS: Owner can see all, customers see own data (Phase 2)
-- ============================================

CREATE POLICY "customers_owner_all" ON customers
  AS PERMISSIVE FOR ALL USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'owner');

CREATE POLICY "customers_self" ON customers
  AS PERMISSIVE FOR SELECT USING (id = auth.uid());

-- ============================================
-- WAITLIST: Anyone can insert, owner can see all
-- ============================================

CREATE POLICY "waitlist_insert" ON waitlist
  AS PERMISSIVE FOR INSERT WITH CHECK (true);

CREATE POLICY "waitlist_owner_view" ON waitlist
  AS PERMISSIVE FOR SELECT USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'owner');

-- ============================================
-- CREW: Crew can see own record, owner sees all
-- ============================================

CREATE POLICY "crew_self" ON crew
  AS PERMISSIVE FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "crew_owner_all" ON crew
  AS PERMISSIVE FOR ALL USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'owner');

-- ============================================
-- JOBS: Crew sees own jobs, owner sees all
-- ============================================

CREATE POLICY "jobs_crew_own" ON jobs
  AS PERMISSIVE FOR SELECT USING (crew_id = (SELECT id FROM crew WHERE user_id = auth.uid()));

CREATE POLICY "jobs_crew_update_own" ON jobs
  AS PERMISSIVE FOR UPDATE USING (crew_id = (SELECT id FROM crew WHERE user_id = auth.uid()));

CREATE POLICY "jobs_owner_all" ON jobs
  AS PERMISSIVE FOR ALL USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'owner');

-- ============================================
-- JOB_PHOTOS: Crew can upload for own jobs, owner sees all
-- ============================================

CREATE POLICY "job_photos_crew_insert" ON job_photos
  AS PERMISSIVE FOR INSERT WITH CHECK (
    job_id IN (SELECT id FROM jobs WHERE crew_id = (SELECT id FROM crew WHERE user_id = auth.uid()))
  );

CREATE POLICY "job_photos_owner_all" ON job_photos
  AS PERMISSIVE FOR ALL USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'owner');

-- ============================================
-- INVOICES: Customer sees own (Phase 2), owner sees all
-- ============================================

CREATE POLICY "invoices_owner_all" ON invoices
  AS PERMISSIVE FOR ALL USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'owner');

CREATE POLICY "invoices_customer_own" ON invoices
  AS PERMISSIVE FOR SELECT USING (customer_id = auth.uid());

-- ============================================
-- PAYMENTS: Owner only
-- ============================================

CREATE POLICY "payments_owner_all" ON payments
  AS PERMISSIVE FOR ALL USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'owner');

-- ============================================
-- APPLICATIONS: Anyone can insert, owner can view
-- ============================================

CREATE POLICY "applications_insert" ON applications
  AS PERMISSIVE FOR INSERT WITH CHECK (true);

CREATE POLICY "applications_owner_view" ON applications
  AS PERMISSIVE FOR SELECT USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'owner');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for all tables with updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON waitlist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crew_updated_at BEFORE UPDATE ON crew
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TEST DATA (Optional - for development)
-- ============================================

-- Insert test customer
INSERT INTO customers (name, email, phone, address, city, state, zip)
VALUES ('John Doe', 'john@example.com', '(713) 555-1234', '123 Main St', 'Houston', 'TX', '77001');

-- Insert test crew member
INSERT INTO crew (name, email, phone, status, availability)
VALUES ('Mike Johnson', 'mike@example.com', '(713) 555-5678', 'active', 'Monday-Friday');

-- Insert test waitlist entry
INSERT INTO waitlist (name, email, phone, address, city, state, zip, service_date, status)
VALUES ('Jane Smith', 'jane@example.com', '(713) 555-9999', '456 Oak Ave', 'Houston', 'TX', '77002', '2025-11-20', 'pending');

-- ============================================
-- DONE
-- ============================================
-- Run this SQL in Supabase dashboard:
-- 1. Go to SQL Editor
-- 2. New Query
-- 3. Paste entire file
-- 4. Click "Run"
-- 5. Verify all tables created in Database > Tables
