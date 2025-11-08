-- Xcellent1 Lawn Care - Supabase Database Schema
-- PostgreSQL 15+
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (crew, owner, client, applicant)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('crew', 'owner', 'client', 'applicant')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'invited', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications table (worker recruitment)
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  notes TEXT,
  source TEXT DEFAULT 'careers',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'screening', 'interview', 'offer', 'hired', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients table (customer accounts)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  property_address TEXT NOT NULL,
  property_city TEXT,
  property_state TEXT,
  property_zip TEXT,
  service_plan TEXT DEFAULT 'weekly' CHECK (service_plan IN ('weekly', 'biweekly', 'monthly', 'seasonal', 'one-time')),
  balance_due DECIMAL(10,2) DEFAULT 0.00,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs table (work assignments)
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  crew_id UUID REFERENCES users(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  services TEXT[] NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
  duration_minutes INT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job photos table (before/after)
CREATE TABLE IF NOT EXISTS job_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after', 'issue', 'equipment')),
  photo_url TEXT NOT NULL,
  photo_storage_path TEXT,
  file_size_kb INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table (billing)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'overdue', 'cancelled')),
  line_items JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- Payments table (payment tracking)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash_app', 'zelle', 'paypal', 'card', 'cash', 'check')),
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outbox events table (event sourcing)
CREATE TABLE IF NOT EXISTS outbox_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  ref_id TEXT,
  payload JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created ON applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_crew ON jobs(crew_id);
CREATE INDEX IF NOT EXISTS idx_jobs_client ON jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_date ON jobs(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_photos_job ON job_photos(job_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox_events(status);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policies (examples - adjust based on auth setup)
-- Owner can see everything
CREATE POLICY "Owners can view all" ON users FOR SELECT USING (true);
CREATE POLICY "Owners can view all jobs" ON jobs FOR SELECT USING (true);

-- Crew can only see their own jobs
CREATE POLICY "Crew can view own jobs" ON jobs FOR SELECT 
  USING (crew_id = auth.uid());

-- Clients can only see their own data
CREATE POLICY "Clients can view own account" ON clients FOR SELECT 
  USING (user_id = auth.uid());
CREATE POLICY "Clients can view own jobs" ON jobs FOR SELECT 
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));
CREATE POLICY "Clients can view own photos" ON job_photos FOR SELECT 
  USING (job_id IN (SELECT id FROM jobs WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())));

-- Insert demo data (optional)
INSERT INTO users (email, phone, name, role) VALUES
  ('owner@xcellent1.com', '555-0001', 'Business Owner', 'owner'),
  ('marcus@xcellent1.com', '555-0002', 'Marcus T.', 'crew'),
  ('priya@xcellent1.com', '555-0003', 'Priya K.', 'crew'),
  ('sarah@example.com', '555-1234', 'Sarah Martinez', 'client')
ON CONFLICT DO NOTHING;

-- Create demo client
INSERT INTO clients (user_id, property_address, property_city, property_state, property_zip, service_plan, balance_due)
SELECT 
  id, 
  '123 Oak Street', 
  'Austin', 
  'TX', 
  '78701', 
  'weekly', 
  125.00
FROM users WHERE email = 'sarah@example.com'
ON CONFLICT DO NOTHING;

-- Create demo jobs
INSERT INTO jobs (client_id, crew_id, scheduled_date, services, status, completed_at)
SELECT 
  c.id,
  (SELECT id FROM users WHERE email = 'marcus@xcellent1.com'),
  CURRENT_DATE,
  ARRAY['Mowing', 'Edging', 'Trimming'],
  'completed',
  NOW() - INTERVAL '2 hours'
FROM clients c WHERE c.property_address = '123 Oak Street'
ON CONFLICT DO NOTHING;

-- Create demo photos
INSERT INTO job_photos (job_id, uploaded_by, photo_type, photo_url)
SELECT 
  j.id,
  (SELECT id FROM users WHERE email = 'marcus@xcellent1.com'),
  'before',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
FROM jobs j
WHERE j.scheduled_date = CURRENT_DATE
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO job_photos (job_id, uploaded_by, photo_type, photo_url)
SELECT 
  j.id,
  (SELECT id FROM users WHERE email = 'marcus@xcellent1.com'),
  'after',
  'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=400'
FROM jobs j
WHERE j.scheduled_date = CURRENT_DATE
LIMIT 1
ON CONFLICT DO NOTHING;

-- Functions for common queries

-- Get crew daily jobs
CREATE OR REPLACE FUNCTION get_crew_jobs(crew_uuid UUID, job_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  job_id UUID,
  client_name TEXT,
  property_address TEXT,
  scheduled_time TIME,
  services TEXT[],
  notes TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id,
    u.name,
    c.property_address,
    j.scheduled_time,
    j.services,
    j.notes,
    j.status
  FROM jobs j
  JOIN clients c ON j.client_id = c.id
  JOIN users u ON c.user_id = u.id
  WHERE j.crew_id = crew_uuid
    AND j.scheduled_date = job_date
  ORDER BY j.scheduled_time ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Get owner metrics
CREATE OR REPLACE FUNCTION get_owner_metrics()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'active_crew', (SELECT COUNT(*) FROM users WHERE role = 'crew' AND status = 'active'),
    'new_applications', (SELECT COUNT(*) FROM applications WHERE created_at > NOW() - INTERVAL '7 days'),
    'jobs_this_week', (SELECT COUNT(*) FROM jobs WHERE scheduled_date >= DATE_TRUNC('week', CURRENT_DATE)),
    'photos_today', (SELECT COUNT(*) FROM job_photos WHERE created_at::DATE = CURRENT_DATE),
    'total_clients', (SELECT COUNT(*) FROM clients WHERE status = 'active')
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Get client dashboard data
CREATE OR REPLACE FUNCTION get_client_dashboard(client_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'client', (SELECT row_to_json(c.*) FROM clients c WHERE c.id = client_uuid),
    'balance_due', (SELECT balance_due FROM clients WHERE id = client_uuid),
    'recent_jobs', (
      SELECT json_agg(row_to_json(j.*))
      FROM (
        SELECT id, scheduled_date, services, status
        FROM jobs
        WHERE client_id = client_uuid
        ORDER BY scheduled_date DESC
        LIMIT 10
      ) j
    ),
    'photos', (
      SELECT json_agg(row_to_json(p.*))
      FROM (
        SELECT jp.id, jp.photo_type, jp.photo_url, jp.created_at, j.scheduled_date as job_date
        FROM job_photos jp
        JOIN jobs j ON jp.job_id = j.id
        WHERE j.client_id = client_uuid
        ORDER BY jp.created_at DESC
        LIMIT 20
      ) p
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'All system users: crew, owners, clients, applicants';
COMMENT ON TABLE applications IS 'Worker job applications from careers page';
COMMENT ON TABLE clients IS 'Customer accounts with property and billing info';
COMMENT ON TABLE jobs IS 'Work assignments with crew, client, and service details';
COMMENT ON TABLE job_photos IS 'Before/after photos uploaded by crew';
COMMENT ON TABLE invoices IS 'Customer billing and invoices';
COMMENT ON TABLE payments IS 'Payment tracking (Cash App, Zelle, PayPal, etc)';
COMMENT ON TABLE outbox_events IS 'Event sourcing for BMAD agent communication';
