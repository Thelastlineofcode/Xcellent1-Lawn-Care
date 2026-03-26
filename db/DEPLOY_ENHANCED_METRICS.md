# Deploy Enhanced Owner Metrics

This guide explains how to deploy the enhanced database functions that power all
dashboard metrics.

## What's Being Added

The `enhanced_owner_metrics.sql` file adds:

### 1. Enhanced `get_owner_metrics()` Function

Returns complete business KPIs including:

- **Financial**: `revenue_this_month`, `revenue_last_month`,
  `accounts_receivable`, `profit_margin`
- **Operational**: `jobs_this_week`, `jobs_last_week`, `active_crew`,
  `total_clients`, `photos_today`
- **Hiring**: `new_applications`, `retention_90day`
- **Calculated**: `revenue_growth_pct`, `jobs_growth_pct`

### 2. New `get_crew_performance()` Function

Returns performance metrics for each crew member:

- Jobs completed (total and this week)
- Photos uploaded
- Average rating (placeholder for now)
- Current status

### 3. Performance Indexes

- `idx_invoices_paid_at` - Speeds up revenue queries
- `idx_invoices_status_amount` - Speeds up accounts receivable queries

## Deployment Methods

### Option 1: Supabase CLI (Recommended)

```bash
# Make sure you're logged in
supabase login

# Link to your project (if not already linked)
supabase link --project-ref utivthfrwgtjatsusopw

# Run the migration
supabase db push db/enhanced_owner_metrics.sql
```

### Option 2: Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Open your project: **Xcellent1 Lawn Care**
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy the entire contents of `db/enhanced_owner_metrics.sql`
6. Paste into the editor
7. Click **Run** (or press Cmd/Ctrl + Enter)

### Option 3: psql Command Line

```bash
# Using the connection string from your .env file
psql "postgresql://postgres:[password]@db.utivthfrwgtjatsusopw.supabase.co:5432/postgres" \
  -f db/enhanced_owner_metrics.sql
```

## Verification

After deployment, verify the functions work correctly:

### Test 1: Check Owner Metrics

```sql
SELECT get_owner_metrics();
```

Expected output (JSON):

```json
{
  "active_crew": 3,
  "new_applications": 5,
  "jobs_this_week": 24,
  "jobs_last_week": 22,
  "photos_today": 12,
  "total_clients": 28,
  "revenue_this_month": 8400.00,
  "revenue_last_month": 7200.00,
  "accounts_receivable": 650.00,
  "retention_90day": 100,
  "profit_margin": 40,
  "revenue_growth_pct": 16.7,
  "jobs_growth_pct": 9.1,
  "interviews_scheduled": 0,
  "open_positions": 0
}
```

### Test 2: Check Crew Performance

```sql
SELECT * FROM get_crew_performance();
```

Expected output:

```
 crew_id | crew_name  | crew_role | jobs_completed | jobs_this_week | photos_uploaded | avg_rating | status
---------+------------+-----------+----------------+----------------+-----------------+------------+--------
 uuid... | Marcus T.  | crew      |             42 |             12 |              84 |       4.50 | active
 uuid... | Priya K.   | crew      |             38 |             10 |              76 |       4.50 | active
```

## Rollback (If Needed)

If you need to rollback to the original metrics function:

```sql
-- Restore original get_owner_metrics function
CREATE OR REPLACE FUNCTION get_owner_metrics()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'active_crew', (SELECT COUNT(*) FROM users WHERE role = 'crew' AND status = 'active'),
    'new_applications', (SELECT COUNT(*) FROM applications WHERE created_at > NOW() - INTERVAL '7 days'),
    'jobs_this_week', (SELECT COUNT(*) FROM jobs WHERE scheduled_date >= DATE_TRUNC('week', CURRENT_DATE)),
    'photos_today', (SELECT COUNT(*) FROM job_photos WHERE created_at::DATE = CURRENT_DATE),
    'total_clients', (SELECT COUNT(*) FROM clients WHERE status = 'active')
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Drop crew performance function
DROP FUNCTION IF EXISTS get_crew_performance();
```

## Impact on Dashboards

Once deployed, the owner dashboard will immediately start showing:

### Live Data

- ✅ Real revenue numbers from invoices
- ✅ Accounts receivable from unpaid invoices
- ✅ Week-over-week job growth percentages
- ✅ Month-over-month revenue growth percentages
- ✅ Crew retention rates
- ✅ Crew performance metrics with real job counts

### Smart Alerts

The dashboard will dynamically generate alerts:

- Revenue growth/decline notifications
- Outstanding invoice reminders
- Application review prompts
- Job volume updates

## Notes

- **Profit Margin**: Currently set to a placeholder value of 40%. To calculate
  real profit margin, you'll need to track job costs (labor, equipment,
  materials).
- **Interviews/Open Positions**: Set to 0 for now. Requires additional tracking
  tables to implement.
- **Crew Ratings**: Placeholder at 4.5. Requires a ratings system to implement.

## Support

If you encounter issues during deployment:

1. Check that you have the required tables: `invoices`, `payments`, `jobs`,
   `users`, `clients`, `applications`, `job_photos`
2. Verify RLS policies aren't blocking function execution
3. Check Supabase logs in Dashboard → Database → Logs

## Next Steps

After deployment:

1. Restart your server: `deno task start`
2. Login to owner dashboard at: `/static/owner.html`
3. Verify all KPIs are showing real data
4. Check that crew performance section populates with active crew members
