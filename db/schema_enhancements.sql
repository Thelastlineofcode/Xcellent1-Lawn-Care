-- Schema Enhancements for User Stories
-- Run this after deploying the main schema.sql
-- Adds columns and tables needed for client management, pricing, and job tracking

-- ============================================
-- CLIENTS TABLE ENHANCEMENTS
-- ============================================

-- Add pricing configuration (JSON field for custom pricing per client)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pricing_config JSONB DEFAULT '{
  "base_price": 60,
  "add_ons": {}
}'::jsonb;

COMMENT ON COLUMN clients.pricing_config IS 'Custom pricing for this client. Example: {"base_price": 60, "add_ons": {"trimming": 20, "mulch": 50, "leaf_removal": 30}}';

-- ============================================
-- JOBS TABLE ENHANCEMENTS
-- ============================================

-- Add job tracking timestamps
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON COLUMN jobs.started_at IS 'When crew member started working on this job';
COMMENT ON COLUMN jobs.assigned_at IS 'When job was assigned to crew';

-- ============================================
-- INVOICES TABLE ENHANCEMENTS
-- ============================================

-- Ensure invoice_number is properly indexed
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

-- Add invoice metadata
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_terms INT DEFAULT 30; -- days until due

COMMENT ON COLUMN invoices.sent_at IS 'When invoice was sent to client';
COMMENT ON COLUMN invoices.payment_terms IS 'Number of days from creation until payment is due';

-- ============================================
-- PAYMENTS TABLE ENHANCEMENTS
-- ============================================

-- Add payment verification fields
ALTER TABLE payments ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT true;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'));

COMMENT ON COLUMN payments.verified IS 'For external payments (Cash App, Zelle), has owner verified receipt?';
COMMENT ON COLUMN payments.verified_at IS 'When payment was verified by owner';
COMMENT ON COLUMN payments.verified_by IS 'Which owner/admin verified the payment';

-- Index for finding unverified payments
CREATE INDEX IF NOT EXISTS idx_payments_unverified ON payments(verified, created_at) WHERE verified = false;

-- ============================================
-- ACTIVITY LOG TABLE (Optional - for tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  entity_type TEXT, -- 'job', 'invoice', 'client', 'payment', etc.
  entity_id UUID,
  metadata JSONB, -- additional data about the activity
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_log(activity_type);

-- Enable RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy - owner can see all activity
CREATE POLICY "Owners can view all activity" ON activity_log FOR SELECT
  USING (auth.user_role() = 'owner');

COMMENT ON TABLE activity_log IS 'Audit trail of all system activities for owner dashboard feed';

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate invoice status based on payments
CREATE OR REPLACE FUNCTION calculate_invoice_status(invoice_id UUID)
RETURNS TEXT AS $$
DECLARE
  invoice_amount DECIMAL;
  paid_amount DECIMAL;
  due_date DATE;
BEGIN
  SELECT amount, invoices.due_date INTO invoice_amount, due_date
  FROM invoices WHERE id = invoice_id;

  SELECT COALESCE(SUM(amount), 0) INTO paid_amount
  FROM payments WHERE payments.invoice_id = invoice_id AND verified = true;

  IF paid_amount >= invoice_amount THEN
    RETURN 'paid';
  ELSIF paid_amount > 0 THEN
    RETURN 'partial';
  ELSIF CURRENT_DATE > due_date THEN
    RETURN 'overdue';
  ELSE
    RETURN 'unpaid';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get client balance
CREATE OR REPLACE FUNCTION get_client_balance(client_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_invoiced DECIMAL;
  total_paid DECIMAL;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_invoiced
  FROM invoices WHERE client_id = client_uuid AND status != 'cancelled';

  SELECT COALESCE(SUM(p.amount), 0) INTO total_paid
  FROM payments p
  JOIN invoices i ON p.invoice_id = i.id
  WHERE i.client_id = client_uuid AND p.verified = true;

  RETURN total_invoiced - total_paid;
END;
$$ LANGUAGE plpgsql;

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_type TEXT,
  p_description TEXT,
  p_user_id UUID DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO activity_log (activity_type, description, user_id, entity_type, entity_id, metadata)
  VALUES (p_type, p_description, p_user_id, p_entity_type, p_entity_id, p_metadata)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View for unpaid invoices with age
CREATE OR REPLACE VIEW unpaid_invoices_with_age AS
SELECT
  i.*,
  c.property_address,
  u.name as client_name,
  u.email as client_email,
  CURRENT_DATE - i.due_date as days_overdue,
  CASE
    WHEN CURRENT_DATE > i.due_date THEN 'overdue'
    ELSE 'unpaid'
  END as computed_status,
  COALESCE(
    (SELECT SUM(amount) FROM payments WHERE invoice_id = i.id AND verified = true),
    0
  ) as amount_paid
FROM invoices i
JOIN clients c ON i.client_id = c.id
JOIN users u ON c.user_id = u.id
WHERE i.status IN ('unpaid', 'overdue', 'partial');

-- View for pending payment verifications
CREATE OR REPLACE VIEW pending_payment_verifications AS
SELECT
  p.*,
  i.invoice_number,
  i.amount as invoice_amount,
  u.name as client_name,
  u.email as client_email
FROM payments p
JOIN invoices i ON p.invoice_id = i.id
JOIN clients c ON i.client_id = c.id
JOIN users u ON c.user_id = u.id
WHERE p.verified = false
ORDER BY p.created_at DESC;

-- ============================================
-- UPDATE EXISTING FUNCTIONS
-- ============================================

-- Enhanced owner metrics function
CREATE OR REPLACE FUNCTION get_owner_metrics()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'active_crew', (
      SELECT COUNT(*) FROM users
      WHERE role = 'crew' AND status = 'active'
    ),
    'active_clients', (
      SELECT COUNT(*) FROM clients
      WHERE status = 'active'
    ),
    'new_waitlist', (
      SELECT COUNT(*) FROM waitlist
      WHERE created_at > NOW() - INTERVAL '30 days'
    ),
    'jobs_this_week', (
      SELECT COUNT(*) FROM jobs
      WHERE scheduled_date >= DATE_TRUNC('week', CURRENT_DATE)
        AND scheduled_date < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
    ),
    'jobs_today', (
      SELECT COUNT(*) FROM jobs
      WHERE scheduled_date = CURRENT_DATE
    ),
    'completed_today', (
      SELECT COUNT(*) FROM jobs
      WHERE completed_at::DATE = CURRENT_DATE
    ),
    'total_outstanding', (
      SELECT COALESCE(SUM(i.amount), 0) FROM invoices i
      WHERE i.status IN ('unpaid', 'overdue', 'partial')
    ),
    'overdue_amount', (
      SELECT COALESCE(SUM(i.amount), 0) FROM invoices i
      WHERE i.status = 'overdue'
    ),
    'revenue_this_month', (
      SELECT COALESCE(SUM(p.amount), 0) FROM payments p
      WHERE DATE_TRUNC('month', p.created_at) = DATE_TRUNC('month', CURRENT_DATE)
        AND p.verified = true
    ),
    'pending_verifications', (
      SELECT COUNT(*) FROM payments
      WHERE verified = false
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA FOR TESTING (Optional)
-- ============================================

-- Uncomment to insert sample waitlist entries
/*
INSERT INTO waitlist (name, email, phone, address, service_preference, source, status) VALUES
  ('Test Customer 1', 'test1@example.com', '555-1111', '100 Test St, LaPlace, LA 70068', 'weekly', 'Google', 'new'),
  ('Test Customer 2', 'test2@example.com', '555-2222', '200 Test Ave, LaPlace, LA 70068', 'biweekly', 'Referral', 'contacted'),
  ('Test Customer 3', 'test3@example.com', '555-3333', '300 Test Rd, LaPlace, LA 70068', 'monthly', 'Facebook', 'new')
ON CONFLICT DO NOTHING;
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify enhancements were applied
DO $$
BEGIN
  RAISE NOTICE 'Schema enhancements applied successfully!';
  RAISE NOTICE 'Tables created: waitlist, activity_log';
  RAISE NOTICE 'Columns added: clients.pricing_config, jobs.started_at, payments.verified';
  RAISE NOTICE 'Functions created: calculate_invoice_status, get_client_balance, log_activity';
  RAISE NOTICE 'Views created: unpaid_invoices_with_age, pending_payment_verifications';
END $$;
