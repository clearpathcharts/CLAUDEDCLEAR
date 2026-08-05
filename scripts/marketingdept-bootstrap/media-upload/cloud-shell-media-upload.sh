#!/usr/bin/env bash
# Install ClearPath full-file upload on the Cloud Shell MARKETINGDEPT clone, then redeploy.
# Usage (Cloud Shell, in MARKETINGDEPT repo root):
#   bash scripts/cloud-shell-media-upload.sh
# Or paste after cloning — this script expects clearpath-publisher/ already present.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUB="$ROOT/clearpath-publisher"
UI="$ROOT/dashboard-glassmorphism/src"
PROJECT="${GCP_PROJECT:-gen-lang-client-0282858983}"
REGION="${CLOUD_RUN_REGION:-europe-west1}"
SERVICE="${CLOUD_RUN_SERVICE:-clearpath-automation-console}"

echo "==> ClearPath media upload install at $ROOT"

test -f "$PUB/server.js" || { echo "missing clearpath-publisher/server.js"; exit 1; }
test -f "$UI/script.js" || { echo "missing dashboard script.js"; exit 1; }

# Prefer git pull if the branch with media upload is available; otherwise files
# must already be present from a paste/sync.
if git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "==> git status"
  git -C "$ROOT" status -sb || true
fi

# Smoke-test media store if node present
if command -v node >/dev/null 2>&1; then
  (cd "$PUB" && npm run test:media) || echo "warn: media self-test failed (continuing)"
fi

echo "==> Deploy $SERVICE to $REGION (social-only image with file upload)"
gcloud config set project "$PROJECT"
gcloud run deploy "$SERVICE" \
  --source "$ROOT" \
  --region "$REGION" \
  --allow-unauthenticated \
  --quiet

echo "==> Health check"
URL="$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')"
curl -sS "$URL/api/health" | head -c 800 || true
echo
echo "Done. Open Publish → pick an MP4 → it hosts on ClearPath (YouTube optional)."
echo "Optional env: MEDIA_MAX_MB=28 PUBLIC_BASE_URL=$URL GCS_MEDIA_BUCKET=your-bucket"
