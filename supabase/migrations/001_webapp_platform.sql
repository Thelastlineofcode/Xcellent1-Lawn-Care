-- Webapp Platform Realize Spec — Module 1 + 3
-- Linked Issue: #27
-- Date: 2026-04-01
-- Gate 2: wiki/hitl/realize-webapp-platform-2026-04-01.md

-- =============================================
-- New Tables
-- =============================================

CREATE TABLE IF NOT EXISTS worker_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  equipment_owned JSONB DEFAULT '[]',
  availability JSONB DEFAULT '{}',
  service_areas TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS performance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES users(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  jobs_completed INT DEFAULT 0,
  jobs_on_time INT DEFAULT 0,
  quality_score DECIMAL(4,2),
  status TEXT DEFAULT 'green' CHECK (status IN ('green', 'yellow', 'red')),
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_type TEXT CHECK (recipient_type IN ('owner', 'crew', 'customer')),
  recipient_id UUID,
  channel TEXT CHECK (channel IN ('sms', 'email', 'push')),
  event_type TEXT NOT NULL,
  ref_id TEXT,
  payload JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced'))
);

-- =============================================
-- Extend existing jobs table
-- =============================================

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completion_photo_url TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS crew_en_route_at TIMESTAMPTZ;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- =============================================
-- Enable Supabase Realtime on key tables
-- =============================================

-- Enable realtime for jobs table
DO $$
BEGIN
  -- jobs
  IF to_regclass('public.jobs') IS NOT NULL THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
    EXCEPTION WHEN duplicate_object THEN
      -- already added
    END;
  END IF;

  -- leads (only if the table exists in this project)
  IF to_regclass('public.leads') IS NOT NULL THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
    EXCEPTION WHEN duplicate_object THEN
      -- already added
    END;
  END IF;
END;
$$;

-- =============================================
-- Indexes for performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_performance_scores_worker ON performance_scores(worker_id, period_start);
CREATE INDEX IF NOT EXISTS idx_notifications_log_event ON notifications_log(event_type, sent_at);
CREATE INDEX IF NOT EXISTS idx_worker_applications_status ON worker_applications(status);

-- Dedupe: avoid sending same notification twice for same ref
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_log_dedupe
  ON notifications_log(event_type, channel, recipient_type, ref_id)
  WHERE ref_id IS NOT NULL;

-- =============================================
-- RLS Policies
-- =============================================

-- Worker applications: owner can view all, applicants can view own
ALTER TABLE worker_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_can_view_all_applications" ON worker_applications
  FOR SELECT USING (
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'owner'
  );

CREATE POLICY "applicant_can_view_own" ON worker_applications
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "public_can_insert_worker_applications" ON worker_applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "owner_can_update_applications" ON worker_applications
  FOR UPDATE USING (
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'owner'
  );

-- Performance scores: owner can view all, crew can view own
ALTER TABLE performance_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_can_view_all_scores" ON performance_scores
  FOR SELECT USING (
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'owner'
  );

CREATE POLICY "crew_can_view_own_scores" ON performance_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = performance_scores.worker_id
        AND u.auth_user_id = auth.uid()
        AND u.role = 'crew'
    )
  );

-- Notifications log: owner can view all
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_can_view_notifications" ON notifications_log
  FOR SELECT USING (
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'owner'
  );
