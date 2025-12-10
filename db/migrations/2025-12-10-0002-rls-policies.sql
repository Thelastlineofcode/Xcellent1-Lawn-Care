-- RLS Policies for Xcellent1 Lawn Care
-- Created: 2025-12-10
BEGIN;

-- Enable Row Level Security on key tables
ALTER TABLE IF EXISTS clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS outbox_events ENABLE ROW LEVEL SECURITY;

-- Example policy: Owners can access their own clients
CREATE POLICY IF NOT EXISTS clients_owner_policy ON clients
  USING (owner_id::text = current_setting('request.jwt.claims.sub', true));

-- Owners can see jobs belonging to their clients
CREATE POLICY IF NOT EXISTS jobs_owner_policy ON jobs
  USING (
    EXISTS (
      SELECT 1 FROM clients c WHERE c.id = jobs.client_id AND c.owner_id::text = current_setting('request.jwt.claims.sub', true)
    )
  );

-- Crew can select jobs assigned to them
CREATE POLICY IF NOT EXISTS jobs_crew_policy ON jobs
  USING (assigned_to::text = current_setting('request.jwt.claims.sub', true));

-- Owners can see invoices for their clients
CREATE POLICY IF NOT EXISTS invoices_owner_policy ON invoices
  USING (
    EXISTS (
      SELECT 1 FROM clients c WHERE c.id = invoices.client_id AND c.owner_id::text = current_setting('request.jwt.claims.sub', true)
    )
  );

-- Fallback: allow authenticated users for select on outbox events if they are owner or admin; implement later in fine-grain
CREATE POLICY IF NOT EXISTS outbox_owner_policy ON outbox_events
  USING (true);

COMMIT;
