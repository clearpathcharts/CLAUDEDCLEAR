#!/usr/bin/env bash
# Apply ClearPath full-file upload into a local MARKETINGDEPT clone, then optionally redeploy.
# Run from CLAUDEDCLEAR repo root OR pass MARKETINGDEPT path:
#   bash scripts/marketingdept-bootstrap/install-media-upload.sh /path/to/MARKETINGDEPT
#   DEPLOY=1 REGION=europe-west1 bash scripts/marketingdept-bootstrap/install-media-upload.sh ~/MARKETINGDEPT
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$HERE/media-upload"
DEST="${1:-}"

if [[ -z "$DEST" ]]; then
  if [[ -d "$HERE/../../MARKETINGDEPT/clearpath-publisher" ]]; then
    DEST="$(cd "$HERE/../../MARKETINGDEPT" && pwd)"
  elif [[ -d "$HOME/MARKETINGDEPT/clearpath-publisher" ]]; then
    DEST="$HOME/MARKETINGDEPT"
  else
    echo "Usage: $0 /path/to/MARKETINGDEPT"
    exit 1
  fi
fi

PUB="$DEST/clearpath-publisher"
UI="$DEST/dashboard-glassmorphism/src"
test -d "$PUB" || { echo "Not a MARKETINGDEPT tree: $DEST"; exit 1; }

echo "==> Installing ClearPath media upload into $DEST"
mkdir -p "$PUB/lib" "$PUB/adapters" "$PUB/scripts" "$PUB/data" "$UI" "$DEST/scripts"

cp -f "$SRC/lib/mediaStore.js" "$PUB/lib/mediaStore.js"
cp -f "$SRC/lib/dispatch.js" "$PUB/lib/dispatch.js"
cp -f "$SRC/adapters/telegram.js" "$PUB/adapters/telegram.js"
cp -f "$SRC/adapters/discord.js" "$PUB/adapters/discord.js"
cp -f "$SRC/adapters/youtube.js" "$PUB/adapters/youtube.js"
cp -f "$SRC/scripts/test-media-upload.mjs" "$PUB/scripts/test-media-upload.mjs"
cp -f "$SRC/data/.gitignore" "$PUB/data/.gitignore"
cp -f "$HERE/server.js" "$PUB/server.js"
cp -f "$SRC/env.example" "$PUB/.env.example"
cp -f "$SRC/dashboard/script.js" "$UI/script.js"
cp -f "$SRC/dashboard/style.css" "$UI/style.css"
if [[ -f "$SRC/dashboard/index.html" ]]; then
  cp -f "$SRC/dashboard/index.html" "$UI/index.html"
fi
mkdir -p "$DEST/docs"
if [[ -f "$HERE/CHANNEL_API_SETUP.md" ]]; then
  cp -f "$HERE/CHANNEL_API_SETUP.md" "$DEST/docs/CHANNEL_API_SETUP.md"
fi
cp -f "$SRC/cloud-shell-media-upload.sh" "$DEST/scripts/cloud-shell-media-upload.sh"
chmod +x "$DEST/scripts/cloud-shell-media-upload.sh"

# Ensure npm script exists
node -e '
const fs = require("fs");
const p = process.argv[1];
const pkg = JSON.parse(fs.readFileSync(p, "utf8"));
pkg.scripts = pkg.scripts || {};
pkg.scripts["test:media"] = "node scripts/test-media-upload.mjs";
fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + "\n");
' "$PUB/package.json"

(cd "$PUB" && npm run test:media) || echo "warn: media self-test failed"

if [[ "${DEPLOY:-0}" == "1" ]]; then
  PROJECT="${GCP_PROJECT:-gen-lang-client-0282858983}"
  REGION="${REGION:-europe-west1}"
  SERVICE="${SERVICE:-clearpath-automation-console}"
  echo "==> Deploying $SERVICE ($REGION)"
  gcloud config set project "$PROJECT"
  gcloud run deploy "$SERVICE" --source "$DEST" --region "$REGION" --allow-unauthenticated --quiet
  URL="$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')"
  echo "Health:"
  curl -sS "$URL/api/health" | head -c 800 || true
  echo
  echo "Set optional: PUBLIC_BASE_URL=$URL MEDIA_MAX_MB=28 GCS_MEDIA_BUCKET=..."
fi

echo "Done. Composer → Upload video → Dispatch. YouTube is optional."
