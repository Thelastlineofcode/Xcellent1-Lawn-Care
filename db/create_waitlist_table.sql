-- Waitlist Table for Website Signups
-- Run this in Supabase SQL Editor after deploying schema.sql

-- Create waitlist table for potential customers
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT NOT NULL,
  service_preference TEXT CHECK (service_preference IN ('weekly', 'biweekly', 'monthly', 'seasonal', 'one-time')),
  source TEXT, -- how did you hear about us
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'declined', 'not_serviceable')),
  notes TEXT,
  contacted_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  converted_to_client_id UUID REFERENCES clients(id), -- track which client they became
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created ON waitlist(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies - only owner can view waitlist
CREATE POLICY "Owners can view all waitlist entries" ON waitlist FOR SELECT
  USING (auth.user_role() = 'owner');

CREATE POLICY "Owners can manage waitlist" ON waitlist FOR ALL
  USING (auth.user_role() = 'owner');

-- Trigger for updated_at
CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON waitlist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment for documentation
COMMENT ON TABLE waitlist IS 'Potential customers who signed up via website waitlist form';

-- Sample query to view new signups
-- SELECT name, email, phone, service_preference, created_at
-- FROM waitlist
-- WHERE status = 'new'
-- ORDER BY created_at DESC;
