#!/usr/bin/env bash
set -euo pipefail

# Deploy the Cloudflare Worker that fronts the Fly.io origin.
# Requirements: wrangler installed and CLOUDFLARE_API_TOKEN configured.

CF_DIR="${CF_DIR:-cf}"
ORIGIN_URL="${ORIGIN_URL:-}"

if [[ -z "$ORIGIN_URL" ]]; then
  echo "ORIGIN_URL not set. Example: https://xcellent1-lawn-care-rpneaa.fly.dev"
  exit 1
fi

if ! command -v wrangler >/dev/null 2>&1; then
  echo "wrangler is not installed. Install with: npm i -g wrangler"
  exit 1
fi

echo "Deploying Cloudflare Worker from $CF_DIR with origin $ORIGIN_URL"
cd "$CF_DIR"
wrangler deploy --var ORIGIN_URL:"$ORIGIN_URL"

echo "Cloudflare deployment finished."
