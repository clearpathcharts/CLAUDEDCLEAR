#!/usr/bin/env bash
# Restores FULL publisher (including mediaStore.js), fixes Docker ignore, redeploys.
# Run from Cloud Shell after: gh repo clone ... CLAUDEDCLEAR-fix
set -euo pipefail

ROOT="${HOME}/MARKETINGDEPT"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUNDLE="${SCRIPT_DIR}/publisher-bundle"

echo "=== Fix container start — restore full publisher + redeploy ==="

if [[ ! -f "$BUNDLE/clearpath-publisher/lib/mediaStore.js" ]]; then
  echo "ERROR: publisher-bundle missing at $BUNDLE"
  echo "Re-clone: gh repo clone clearpathcharts/CLAUDEDCLEAR ~/CLAUDEDCLEAR-fix -- --depth 1 --branch cursor/marketing-team-auth-bootstrap-2373"
  exit 1
fi

mkdir -p "$ROOT"
echo "Copying complete publisher-bundle → $ROOT"
# Overwrite publisher + dashboard + Docker files; keep any other MARKETINGDEPT junk out of the way
rm -rf "$ROOT/clearpath-publisher"
mkdir -p "$ROOT/clearpath-publisher"
tar -C "$BUNDLE" -cf - clearpath-publisher dashboard-glassmorphism Dockerfile .dockerignore \
  | tar -C "$ROOT" -xf -

test -f "$ROOT/clearpath-publisher/lib/mediaStore.js"
test -f "$ROOT/clearpath-publisher/lib/dispatch.js"
test -f "$ROOT/clearpath-publisher/server.js"
test -f "$ROOT/clearpath-publisher/views/login.html"
test -f "$ROOT/dashboard-glassmorphism/src/script.js"
! grep -qx 'server.js' "$ROOT/.dockerignore"
! grep -qx 'package.json' "$ROOT/.dockerignore"
! grep -q "Paste into Cursor and say PUBLISH THIS" "$ROOT/dashboard-glassmorphism/src/script.js"
grep -q "Dispatch now" "$ROOT/dashboard-glassmorphism/src/script.js"
echo "Files OK (mediaStore present)."

# ZIP date fix
find "$ROOT" -print0 | xargs -0 touch -t 202601011200.00 2>/dev/null || true

cd "$ROOT/clearpath-publisher"
echo "Installing npm deps for local boot check…"
npm ci --omit=dev

echo "Local boot check…"
PORT=8080 HOST=127.0.0.1 timeout 5 node server.js >/tmp/cp-boot.log 2>&1 || true
if ! grep -q "ClearPath team social console" /tmp/cp-boot.log; then
  echo "LOCAL BOOT FAILED — send Rick this log:"
  cat /tmp/cp-boot.log
  exit 1
fi
echo "Local boot OK."
grep -E 'console|Team auth|channels' /tmp/cp-boot.log || true

echo "Deploying to Cloud Run europe-west1…"
gcloud config set project gen-lang-client-0282858983
gcloud run deploy clearpath-automation-console \
  --source "$ROOT" \
  --region europe-west1 \
  --allow-unauthenticated \
  --port 8080 \
  --timeout 300 \
  --memory 512Mi \
  --quiet

echo "Waiting for site…"
for i in $(seq 1 24); do
  sleep 3
  H=$(curl -sS https://fuckweasel.net/api/health || true)
  R=$(curl -sS https://fuckweasel.net/api/auth/roster || true)
  L=$(curl -sS https://fuckweasel.net/login || true)
  echo "try $i: health=$(echo "$H" | tr ',' '\n' | grep console || echo auth_gated_or_down) roster=$(echo "$R" | head -c 80)"
  if echo "$H$R" | grep -q social-team-private || echo "$R" | grep -q '"configured":true' || echo "$L" | grep -q "Sign in — ClearPath"; then
    echo "SUCCESS — hard-refresh Incognito https://fuckweasel.net (Ctrl+Shift+R)"
    echo "Expect: Queue → Dispatch now. No Cursor paste. No mission checkboxes."
    echo "Login with brent/dustin/brian/owner (passwords Rick set on Cloud Run)."
    exit 0
  fi
done

echo "Deploy finished but health not ready — recent logs:"
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="clearpath-automation-console"' \
  --project=gen-lang-client-0282858983 \
  --limit=20 \
  --format='value(textPayload)' 2>/dev/null | head -30 || true
exit 1
