#!/usr/bin/env bash
set -euo pipefail

## Predeploy checks to ensure production env is properly configured.
echo "Running predeploy checks..."

REQUIRED=(
  "DATABASE_URL"
  "SUPABASE_URL"
  "SUPABASE_ANON_KEY"
  "SUPABASE_JWT_SECRET"
  "FLY_API_TOKEN"
  "APP_ENV"
)

MISSING=()
for v in "${REQUIRED[@]}"; do
  if [[ -z "${!v:-}" ]]; then
    MISSING+=("$v")
  fi
done

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "❌ Missing required environment variables: ${MISSING[*]}"
  echo "Please set them in your environment or CI secrets before deploying."
  exit 1
fi

if [[ "$APP_ENV" != "production" ]] && [[ "$APP_ENV" != "staging" ]]; then
  echo "⚠️ Warning: APP_ENV is set to $APP_ENV; recommended: 'staging' or 'production'"
fi

echo "✅ Predeploy checks passed."
