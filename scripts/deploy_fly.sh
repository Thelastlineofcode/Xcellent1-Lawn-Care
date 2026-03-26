#!/usr/bin/env bash
set -euo pipefail

# Simple Fly.io deploy script intended to run in CI or a gated workflow.
# Requirements: flyctl installed, FLY_API_TOKEN is set, APP_ENV=production (or staging)

if [[ -z "${APP_ENV:-}" ]]; then
  echo "APP_ENV not set. Please set APP_ENV=production or staging"
  exit 1
fi

echo "Starting predeploy checks..."
./scripts/predeploy_check.sh

echo "Setting Fly secrets (non-blocking - adjust as needed)..."
# Note: This tries to set secrets on the target Fly app; APP must be specified
if [[ -z "${FLY_APP_NAME:-}" ]]; then
  echo "FLY_APP_NAME not set. Using app name from fly.toml if present."
fi

# Example: set secrets that are required; adjust as needed
echo "Setting DATABASE_URL and SUPABASE env on Fly..."
flyctl secrets set DATABASE_URL="$DATABASE_URL" SUPABASE_URL="$SUPABASE_URL" SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" SUPABASE_JWT_SECRET="$SUPABASE_JWT_SECRET" --app ${FLY_APP_NAME:-}

echo "Deploying to Fly.io (remote-only)"
if [[ -n "${FLY_APP_NAME:-}" ]]; then
  flyctl deploy --app "$FLY_APP_NAME" --remote-only
else
  flyctl deploy --remote-only
fi

echo "Deployment finished."
