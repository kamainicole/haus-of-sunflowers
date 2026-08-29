#!/usr/bin/env bash
# Weekly manual backup — a second, Supabase-independent copy of your
# research, on top of Supabase's own automated daily backups.
#
# Requires the SUPABASE_DB_URL environment variable, which you'll find
# in your Supabase project under Project Settings -> Database ->
# Connection string (the "URI" one, with your password filled in).
# Do NOT commit that URL anywhere — export it in your shell instead:
#
#   export SUPABASE_DB_URL="postgresql://postgres:[password]@[host]:5432/postgres"
#
set -euo pipefail

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "Error: SUPABASE_DB_URL is not set. See comments at the top of this script."
  exit 1
fi

TIMESTAMP=$(date +"%Y-%m-%d_%H%M")
OUT_DIR="./backups"
mkdir -p "$OUT_DIR"

echo "Backing up database to $OUT_DIR/haus-of-sunflowers_$TIMESTAMP.sql ..."
pg_dump "$SUPABASE_DB_URL" \
  --schema=research --schema=dissertation --schema=internal --schema=api \
  --no-owner --no-privileges \
  -f "$OUT_DIR/haus-of-sunflowers_$TIMESTAMP.sql"

echo "Done. Store this file somewhere other than this machine (e.g. an external drive or cloud storage you control)."
