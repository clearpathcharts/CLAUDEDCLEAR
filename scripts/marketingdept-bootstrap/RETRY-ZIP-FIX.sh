#!/usr/bin/env bash
# Run this in Cloud Shell AFTER the "ZIP does not support timestamps before 1980" crash.
# Does NOT re-paste anything. Fixes dates, then redeploys.
set -euo pipefail
ROOT="${HOME}/MARKETINGDEPT"
test -f "$ROOT/clearpath-publisher/package.json"
echo "Fixing file dates (ZIP needs year >= 1980)…"
# Node_modules / .git often carry epoch dates from bad extracts or copies
find "$ROOT" -name .git -prune -o -print0 | xargs -0 touch -t 202601011200.00 2>/dev/null || true
find "$ROOT" -print0 | xargs -0 touch -t 202601011200.00 2>/dev/null || true
# Extra safety: only touch source we care about if find is huge
touch -t 202601011200.00 \
  "$ROOT/Dockerfile" \
  "$ROOT/clearpath-publisher/server.js" \
  "$ROOT/clearpath-publisher/lib/dispatch.js" \
  "$ROOT/dashboard-glassmorphism/src/script.js" \
  "$ROOT/dashboard-glassmorphism/src/index.html" \
  "$ROOT/dashboard-glassmorphism/src/style.css" 2>/dev/null || true
echo "Dates fixed. Deploying…"
gcloud config set project gen-lang-client-0282858983
gcloud run deploy clearpath-automation-console \
  --source "$ROOT" \
  --region europe-west1 \
  --allow-unauthenticated \
  --port 8080 \
  --quiet
echo "Waiting for health…"
for i in $(seq 1 20); do
  sleep 4
  H=$(curl -sS https://fuckweasel.net/api/health || true)
  echo "try $i: $(echo "$H" | tr ',' '\n' | grep console || echo none)"
  echo "$H" | grep -q social-team-private && {
    echo "SUCCESS — hard-refresh Incognito https://fuckweasel.net (Ctrl+Shift+R)"
    echo "Expect: Queue → Dispatch now. No Cursor paste. No mission checkboxes."
    exit 0
  }
done
echo FAIL; exit 1
