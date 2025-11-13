-- Xcellent1 Lawn Care - Database Schema
-- PostgreSQL / Supabase
-- Version: 1.0
-- Last Updated: 2025-11-09

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for location features (optional, for future route optimization)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT NOT NULL,
    neighborhood VARCHAR(100),
    property_size_sqft INTEGER,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paused', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);

-- Crews table
CREATE TABLE crews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'crew_member' CHECK (role IN ('crew_member', 'crew_lead', 'manager')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated')),
    pay_rate_cents INTEGER NOT NULL,
    hired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_crews_status ON crews(status);
CREATE INDEX idx_crews_phone ON crews(phone);

-- Jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    crew_id UUID REFERENCES crews(id) ON DELETE SET NULL,
    service_type VARCHAR(100) NOT NULL CHECK (service_type IN ('mowing', 'edging', 'trimming', 'cleanup', 'full_service')),
    date DATE NOT NULL,
    time_window VARCHAR(50), -- e.g., "9am-12pm", "1pm-4pm"
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled')),
    notes TEXT,
    before_photos TEXT[], -- Array of Supabase Storage URLs
    after_photos TEXT[], -- Array of Supabase Storage URLs
    duration_min INTEGER,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_jobs_customer ON jobs(customer_id);
CREATE INDEX idx_jobs_crew ON jobs(crew_id);
CREATE INDEX idx_jobs_date ON jobs(date);
CREATE INDEX idx_jobs_status ON jobs(status);

-- Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    amount_cents INTEGER NOT NULL,
    description TEXT NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'paid', 'overdue', 'cancelled')),
    payment_link TEXT, -- Stripe checkout URL
    paid_at TIMESTAMP WITH TIME ZONE,
    stripe_payment_intent_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_job ON invoices(job_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_stripe ON invoices(stripe_payment_intent_id);

-- Recurring schedules table
CREATE TABLE schedules_recurring (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    service_type VARCHAR(100) NOT NULL,
    frequency VARCHAR(50) NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_schedules_customer ON schedules_recurring(customer_id);
CREATE INDEX idx_schedules_active ON schedules_recurring(is_active);

-- ============================================================================
-- MESSAGING & EVENTS
-- ============================================================================

-- Events outbox for reliable messaging
CREATE TABLE events_outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(100) NOT NULL, -- e.g., "INVOICE_SENT", "JOB_COMPLETED"
    ref_id UUID, -- Reference to related entity (customer_id, job_id, etc.)
    payload JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempts INTEGER DEFAULT 0,
    next_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_outbox_status ON events_outbox(status);
CREATE INDEX idx_outbox_next_attempt ON events_outbox(next_attempt_at);

-- Chat sessions for AI agent
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    messages JSONB NOT NULL DEFAULT '[]', -- Array of {role, content, timestamp}
    context JSONB, -- Additional context for AI
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'escalated', 'closed')),
    escalated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_customer ON chat_sessions(customer_id);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);

-- ============================================================================
-- OWNER & BUSINESS METRICS
-- ============================================================================

-- Owner preferences
CREATE TABLE owner_prefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    weekly_sms_time TIME DEFAULT '18:00:00', -- 6pm Sunday digest
    weekly_email_time TIME DEFAULT '18:00:00',
    alert_critical_only BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads table (pre-customer)
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    service_type VARCHAR(100),
    lawn_size_sqft INTEGER,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'quoted', 'contacted', 'converted', 'rejected')),
    quote_low_cents INTEGER,
    quote_high_cents INTEGER,
    source VARCHAR(100), -- e.g., "website", "referral", "google"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);

-- ============================================================================
-- AGENT AUDIT & TRACKING
-- ============================================================================

-- Agent decisions audit log
CREATE TABLE agent_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_name VARCHAR(100) NOT NULL, -- e.g., "intake", "quote", "scheduler"
    action VARCHAR(100) NOT NULL, -- e.g., "QUOTE_GENERATED", "JOB_SCHEDULED"
    input_snapshot JSONB NOT NULL,
    output_snapshot JSONB NOT NULL,
    tool_calls JSONB, -- Array of tool calls made
    exit_status VARCHAR(50) CHECK (exit_status IN ('success', 'failure', 'escalated')),
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_agent_audit_agent ON agent_audit(agent_name);
CREATE INDEX idx_agent_audit_action ON agent_audit(action);
CREATE INDEX idx_agent_audit_created ON agent_audit(created_at);

-- Processed events for idempotency
CREATE TABLE processed_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(255) NOT NULL UNIQUE, -- Stripe event id, Twilio message id, etc.
    event_type VARCHAR(100) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_processed_events_id ON processed_events(event_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules_recurring ENABLE ROW LEVEL SECURITY;
ALTER TABLE events_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_events ENABLE ROW LEVEL SECURITY;

-- Owner role: Full access to everything
CREATE POLICY owner_all_access ON customers FOR ALL TO authenticated
USING (auth.jwt() ->> 'role' = 'owner');

CREATE POLICY owner_all_crews ON crews FOR ALL TO authenticated
USING (auth.jwt() ->> 'role' = 'owner');

CREATE POLICY owner_all_jobs ON jobs FOR ALL TO authenticated
USING (auth.jwt() ->> 'role' = 'owner');

CREATE POLICY owner_all_invoices ON invoices FOR ALL TO authenticated
USING (auth.jwt() ->> 'role' = 'owner');

-- Crew role: Can view their own assigned jobs and update status
CREATE POLICY crew_view_own_jobs ON jobs FOR SELECT TO authenticated
USING (auth.jwt() ->> 'role' = 'crew' AND crew_id::text = auth.uid()::text);

CREATE POLICY crew_update_own_jobs ON jobs FOR UPDATE TO authenticated
USING (auth.jwt() ->> 'role' = 'crew' AND crew_id::text = auth.uid()::text);

-- Customer role: Can view their own data
CREATE POLICY customer_view_own ON customers FOR SELECT TO authenticated
USING (auth.uid()::text = id::text);

CREATE POLICY customer_view_own_jobs ON jobs FOR SELECT TO authenticated
USING (auth.uid()::text = customer_id::text);

CREATE POLICY customer_view_own_invoices ON invoices FOR SELECT TO authenticated
USING (auth.uid()::text = customer_id::text);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER crews_updated_at BEFORE UPDATE ON crews
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER schedules_recurring_updated_at BEFORE UPDATE ON schedules_recurring
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER events_outbox_updated_at BEFORE UPDATE ON events_outbox
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER owner_prefs_updated_at BEFORE UPDATE ON owner_prefs
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER leads_updated_at BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- SEED DATA (Optional - for development)
-- ============================================================================

-- Insert owner preferences
INSERT INTO owner_prefs (phone, email) VALUES
('+15049990001', 'owner@xcellent1lawncare.com');

-- Insert sample crew members (for testing)
-- INSERT INTO crews (name, phone, email, role, pay_rate_cents) VALUES
-- ('DeAndre Johnson', '+15049990010', 'deandre@xcellent1.com', 'crew_lead', 2000),
-- ('Marcus Williams', '+15049990011', 'marcus@xcellent1.com', 'crew_member', 1800);

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- Weekly revenue view
CREATE OR REPLACE VIEW weekly_revenue AS
SELECT 
    DATE_TRUNC('week', paid_at) as week,
    COUNT(*) as invoices_paid,
    SUM(amount_cents) / 100.0 as total_revenue
FROM invoices
WHERE status = 'paid'
GROUP BY week
ORDER BY week DESC;

-- Customer retention view
CREATE OR REPLACE VIEW customer_retention AS
SELECT 
    c.id,
    c.name,
    c.created_at,
    COUNT(j.id) as total_jobs,
    MAX(j.date) as last_job_date,
    CASE 
        WHEN MAX(j.date) < CURRENT_DATE - INTERVAL '30 days' THEN 'at_risk'
        WHEN MAX(j.date) < CURRENT_DATE - INTERVAL '60 days' THEN 'churned'
        ELSE 'active'
    END as retention_status
FROM customers c
LEFT JOIN jobs j ON c.id = j.customer_id
GROUP BY c.id, c.name, c.created_at;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE customers IS 'Customer master data with contact and property info';
COMMENT ON TABLE crews IS 'Crew members and their roles/pay rates';
COMMENT ON TABLE jobs IS 'Individual lawn care jobs with scheduling and completion tracking';
COMMENT ON TABLE invoices IS 'Billing and payment records linked to jobs';
COMMENT ON TABLE schedules_recurring IS 'Recurring service schedules for automated job creation';
COMMENT ON TABLE events_outbox IS 'Reliable message queue for notifications and webhooks';
COMMENT ON TABLE chat_sessions IS 'AI chat conversation history with customers';
COMMENT ON TABLE agent_audit IS 'Audit log for all AI agent decisions and actions';
COMMENT ON TABLE processed_events IS 'Idempotency tracking for external webhooks';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
