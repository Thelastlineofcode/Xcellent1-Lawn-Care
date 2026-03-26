-- Waitlist table for prospective clients
-- This allows potential customers to sign up for service before becoming full clients

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  property_address TEXT NOT NULL,
  property_city TEXT,
  property_state TEXT,
  property_zip TEXT,
  preferred_service_plan TEXT CHECK (preferred_service_plan IN ('weekly', 'biweekly', 'monthly', 'seasonal', 'one-time')),
  notes TEXT,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'converted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  converted_client_id UUID REFERENCES clients(id) ON DELETE SET NULL
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created ON waitlist(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Owners can manage waitlist" ON waitlist FOR ALL
  USING (auth.user_role() = 'owner');

-- Allow public inserts (for website signup form)
CREATE POLICY "Public can join waitlist" ON waitlist FOR INSERT
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON waitlist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE waitlist IS 'Prospective clients waiting to sign up for service';
