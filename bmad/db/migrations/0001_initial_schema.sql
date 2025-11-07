-- Initial schema for Xcellent1 Lawn Care
-- Tables: leads, events_outbox, invoices, processed_events, agent_audit

-- leads
CREATE TABLE IF NOT EXISTS leads (
  id text PRIMARY KEY,
  name text,
  phone text,
  email text,
  notes text,
  source text,
  created_at timestamptz DEFAULT now()
);

-- events_outbox
CREATE TABLE IF NOT EXISTS events_outbox (
  id text PRIMARY KEY,
  type text NOT NULL,
  payload jsonb,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  last_attempt_at timestamptz,
  next_attempt_at timestamptz
);

-- invoices
CREATE TABLE IF NOT EXISTS invoices (
  id text PRIMARY KEY,
  job_id text,
  amount_cents integer,
  currency text DEFAULT 'usd',
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now()
);

-- processed_events (for webhook/agent idempotency)
CREATE TABLE IF NOT EXISTS processed_events (
  id text PRIMARY KEY,
  source text NOT NULL,
  event_id text NOT NULL,
  processed_at timestamptz DEFAULT now()
);

-- agent_audit (observability for agent decisions)
CREATE TABLE IF NOT EXISTS agent_audit (
  id serial PRIMARY KEY,
  agent_name text NOT NULL,
  input_snapshot jsonb,
  actions jsonb,
  tool_calls jsonb,
  exit_status text,
  created_at timestamptz DEFAULT now()
);
