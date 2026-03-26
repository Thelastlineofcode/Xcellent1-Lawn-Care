#!/usr/bin/env bash
set -euo pipefail

# Deploy backend to Fly.io first, then deploy Cloudflare Worker proxy.
# Required env:
# - APP_ENV=production
# - DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_JWT_SECRET
# - ORIGIN_URL (Fly app URL, e.g. https://<app>.fly.dev)

if [[ -z "${ORIGIN_URL:-}" ]]; then
  echo "ORIGIN_URL not set. Example: https://xcellent1-lawn-care-rpneaa.fly.dev"
  exit 1
fi

echo "[1/2] Deploying Fly.io app..."
./scripts/deploy_fly.sh

echo "[2/2] Deploying Cloudflare Worker..."
./scripts/deploy_cloudflare.sh

echo "✅ Fly.io + Cloudflare deployments complete."
