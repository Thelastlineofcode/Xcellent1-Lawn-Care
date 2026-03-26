#!/usr/bin/env bash
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "No DATABASE_URL set — skipping migrations"
  exit 0
fi

echo "Applying migrations to DATABASE_URL"
psql "$DATABASE_URL" -f "db/migrations/2025-12-10-0001-initial-schema.sql"
echo "Migrations applied."
