-- Migration: Add premium access to users table
-- Created: 2024-12-19

-- Add premium access columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_premium_access BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_purchased_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

-- Create premium_purchases table for tracking
CREATE TABLE IF NOT EXISTS premium_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    email VARCHAR(255) NOT NULL,
    stripe_session_id VARCHAR(255) UNIQUE,
    stripe_payment_intent VARCHAR(255),
    amount_cents INTEGER DEFAULT 999,
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, refunded
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_premium_purchases_email ON premium_purchases(email);
CREATE INDEX IF NOT EXISTS idx_premium_purchases_session ON premium_purchases(stripe_session_id);

-- RLS Policies
ALTER TABLE premium_purchases ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own purchases
CREATE POLICY "Users can view own purchases" ON premium_purchases
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Allow service role to insert/update
CREATE POLICY "Service role can manage purchases" ON premium_purchases
    FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE premium_purchases IS 'Tracks $9.99 AI Assistant premium purchases';
