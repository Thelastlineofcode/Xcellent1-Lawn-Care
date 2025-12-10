-- Initial schema for Xcellent1 Lawn Care (Sprint 1 foundation)
-- Created: 2025-12-10
BEGIN;

-- Users: owners, managers, crew
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Clients / Customers
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Jobs (scheduled services)
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id),
  scheduled_time TIMESTAMPTZ,
  services TEXT[],
  notes TEXT,
  status TEXT DEFAULT 'assigned',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id),
  client_id UUID REFERENCES clients(id),
  amount_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Outbox events for async processing (email, webhooks)
CREATE TABLE IF NOT EXISTS outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  ref_id UUID,
  payload JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Owner invitations (admin invites)
CREATE TABLE IF NOT EXISTS owner_invitations (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  invitation_token TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMIT;
