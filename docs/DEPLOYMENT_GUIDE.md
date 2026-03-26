# Deployment Guide - Xcellent1 Lawn Care

## Quick Deploy to Production (Fly.io + Cloudflare)

### Prerequisites

- ✅ Fly.io account configured
- ✅ All environment variables set
- ✅ Database migrations run
- ✅ Code tested and committed

### Deploy Commands

```bash
# 1) Deploy backend on Fly
APP_ENV=production FLY_APP_NAME=<your-fly-app> ./scripts/deploy_fly.sh

# 2) Deploy Cloudflare worker proxy to front the Fly app
ORIGIN_URL=https://<your-fly-app>.fly.dev ./scripts/deploy_cloudflare.sh

# Optional: one command for both
APP_ENV=production FLY_APP_NAME=<your-fly-app> ORIGIN_URL=https://<your-fly-app>.fly.dev ./scripts/deploy_edge_stack.sh
```

### Post-Deployment Verification

1. **Check Site Loads**
   ```bash
   curl -I https://xcellent1lawncare.com
   ```
   Expected: `200 OK`

2. **Test Health Endpoint**
   ```bash
   curl https://xcellent1lawncare.com/health
   ```
   Expected: JSON with `ok: true`

3. **Verify Database Connection**
   - Log in as owner
   - Check dashboard loads
   - Verify metrics display

4. **Test Critical Flows**
   - [ ] Owner login
   - [ ] Client creation
   - [ ] Job scheduling
   - [ ] Invoice creation
   - [ ] Payment recording
   - [ ] Waitlist signup (public)

### Environment Variables (Already Set)

```bash
# Verify these are set in Fly.io
fly secrets list
```

Required secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `SUPABASE_JWT_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SENDGRID_API_KEY` (optional)

### Rollback Plan

If deployment fails:

```bash
# List deployments
fly releases

# Rollback to previous version
fly releases rollback <version>
```

### Monitoring

1. **View Logs**
   ```bash
   fly logs
   ```

2. **Check Status**
   ```bash
   fly status
   ```

3. **View Metrics**
   ```bash
   fly dashboard
   ```

### Current Deployment Status

- **Version**: 3.1.0
- **Last Deploy**: Pending
- **Branch**: test-main
- **Commit**: 33d29c7

### Deploy Checklist

- [x] All TypeScript errors fixed
- [x] Security hardening complete
- [x] Tests passing
- [x] Documentation updated
- [x] Code committed
- [ ] Deployed to production
- [ ] Post-deployment verification
- [ ] Owner notified

---

**Ready to deploy? Run: `fly deploy --ha=false`**
