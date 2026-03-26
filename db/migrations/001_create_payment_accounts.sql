-- Xcellent1 Lawn Care - Payment Accounts Migration
-- Run this in Supabase SQL Editor to enable payment account management

-- Payment accounts table (owner's connected payment methods)
CREATE TABLE IF NOT EXISTS payment_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('paypal', 'cash_app', 'stripe', 'square')),
  account_identifier TEXT NOT NULL,  -- Email for PayPal, $cashtag for Cash App, etc.
  account_name TEXT,  -- Display name/nickname for the account
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed', 'expired')),
  metadata JSONB,  -- Store service-specific data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, payment_method, account_identifier)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_accounts_user ON payment_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_accounts_method ON payment_accounts(payment_method);
CREATE INDEX IF NOT EXISTS idx_payment_accounts_primary ON payment_accounts(user_id, is_primary) WHERE is_primary = TRUE;

-- Enable Row Level Security
ALTER TABLE payment_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Owners can manage their own payment accounts
CREATE POLICY "Owners can manage their payment accounts" ON payment_accounts FOR ALL
  USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_payment_accounts_updated_at BEFORE UPDATE ON payment_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE payment_accounts IS 'Owner payment account connections (PayPal, Cash App, Stripe, Square)';
