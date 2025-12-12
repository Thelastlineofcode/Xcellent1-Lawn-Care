#!/usr/bin/env bash
# Check for required environment variables for local development

set -euo pipefail

ENV_FILE=.env.local
if [[ ! -f ${ENV_FILE} ]]; then
  echo "${ENV_FILE} not found. Create it by copying .env.local.example and filling your values:"
  echo "cp .env.local.example .env.local"
  exit 1
fi

source ${ENV_FILE}

MISSING=()
REQ=(SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_JWT_SECRET DATABASE_URL)
for v in "${REQ[@]}"; do
  if [[ -z "${!v:-}" ]]; then
    MISSING+=("$v")
  fi
done

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "❌ Missing required environment variables: ${MISSING[*]}"
  echo "Please set them in ${ENV_FILE} (do not commit)."
  exit 2
else
  echo "✅ Environment appears configured for local development.";
fi

exit 0
