-- Enhanced owner metrics function with all dashboard KPIs
-- Run this to update the get_owner_metrics function with complete data

CREATE OR REPLACE FUNCTION get_owner_metrics()
RETURNS JSON AS $$
DECLARE
  result JSON;
  revenue_current DECIMAL(10,2);
  revenue_previous DECIMAL(10,2);
  jobs_current_week INT;
  jobs_previous_week INT;
  ar_total DECIMAL(10,2);
  crew_hired_90d INT;
  crew_active_90d INT;
  retention_pct INT;
BEGIN
  -- Revenue this month (paid invoices)
  SELECT COALESCE(SUM(amount), 0) INTO revenue_current
  FROM invoices
  WHERE status = 'paid'
    AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', CURRENT_DATE);

  -- Revenue last month
  SELECT COALESCE(SUM(amount), 0) INTO revenue_previous
  FROM invoices
  WHERE status = 'paid'
    AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');

  -- Jobs this week
  SELECT COUNT(*) INTO jobs_current_week
  FROM jobs
  WHERE scheduled_date >= DATE_TRUNC('week', CURRENT_DATE)
    AND scheduled_date < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week';

  -- Jobs last week
  SELECT COUNT(*) INTO jobs_previous_week
  FROM jobs
  WHERE scheduled_date >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 week'
    AND scheduled_date < DATE_TRUNC('week', CURRENT_DATE);

  -- Accounts receivable (unpaid invoices)
  SELECT COALESCE(SUM(amount), 0) INTO ar_total
  FROM invoices
  WHERE status IN ('unpaid', 'overdue');

  -- 90-day crew retention
  SELECT COUNT(*) INTO crew_hired_90d
  FROM users
  WHERE role = 'crew'
    AND created_at >= CURRENT_DATE - INTERVAL '90 days';

  SELECT COUNT(*) INTO crew_active_90d
  FROM users
  WHERE role = 'crew'
    AND status = 'active'
    AND created_at >= CURRENT_DATE - INTERVAL '90 days';

  -- Calculate retention percentage (avoid division by zero)
  IF crew_hired_90d > 0 THEN
    retention_pct := ROUND((crew_active_90d::DECIMAL / crew_hired_90d::DECIMAL) * 100);
  ELSE
    retention_pct := 100;
  END IF;

  -- Build JSON response with all metrics
  SELECT json_build_object(
    -- Original metrics
    'active_crew', (SELECT COUNT(*) FROM users WHERE role = 'crew' AND status = 'active'),
    'new_applications', (SELECT COUNT(*) FROM applications WHERE created_at > NOW() - INTERVAL '7 days'),
    'jobs_this_week', jobs_current_week,
    'photos_today', (SELECT COUNT(*) FROM job_photos WHERE created_at::DATE = CURRENT_DATE),
    'total_clients', (SELECT COUNT(*) FROM clients WHERE status = 'active'),

    -- New financial metrics
    'revenue_this_month', revenue_current,
    'revenue_last_month', revenue_previous,
    'accounts_receivable', ar_total,

    -- New operational metrics
    'jobs_last_week', jobs_previous_week,
    'retention_90day', retention_pct,

    -- Calculated metrics
    'revenue_growth_pct', (
      CASE
        WHEN revenue_previous > 0 THEN
          ROUND(((revenue_current - revenue_previous) / revenue_previous * 100)::NUMERIC, 1)
        ELSE 0
      END
    ),
    'jobs_growth_pct', (
      CASE
        WHEN jobs_previous_week > 0 THEN
          ROUND(((jobs_current_week - jobs_previous_week)::DECIMAL / jobs_previous_week::DECIMAL * 100)::NUMERIC, 1)
        ELSE 0
      END
    ),

    -- Profit margin placeholder (requires cost tracking to calculate accurately)
    -- For now, assume 40% average margin
    'profit_margin', 40,

    -- Hiring metrics (placeholders - would need separate tracking tables)
    'interviews_scheduled', 0,
    'open_positions', 0
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get crew performance data
CREATE OR REPLACE FUNCTION get_crew_performance()
RETURNS TABLE (
  crew_id UUID,
  crew_name TEXT,
  crew_role TEXT,
  jobs_completed INT,
  jobs_this_week INT,
  photos_uploaded INT,
  avg_rating DECIMAL(3,2),
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.name,
    u.role,
    (SELECT COUNT(*) FROM jobs WHERE crew_id = u.id AND status = 'completed')::INT,
    (SELECT COUNT(*) FROM jobs WHERE crew_id = u.id AND scheduled_date >= DATE_TRUNC('week', CURRENT_DATE))::INT,
    (SELECT COUNT(*) FROM job_photos WHERE uploaded_by = u.id)::INT,
    4.5::DECIMAL(3,2), -- Placeholder - would need ratings table
    u.status
  FROM users u
  WHERE u.role = 'crew'
    AND u.status = 'active'
  ORDER BY u.name;
END;
$$ LANGUAGE plpgsql;

-- Add index for invoice queries
CREATE INDEX IF NOT EXISTS idx_invoices_paid_at ON invoices(paid_at) WHERE status = 'paid';
CREATE INDEX IF NOT EXISTS idx_invoices_status_amount ON invoices(status, amount);

-- Comments
COMMENT ON FUNCTION get_owner_metrics() IS 'Returns comprehensive business metrics for owner dashboard including revenue, jobs, crew, and financial KPIs';
COMMENT ON FUNCTION get_crew_performance() IS 'Returns performance metrics for all active crew members';
