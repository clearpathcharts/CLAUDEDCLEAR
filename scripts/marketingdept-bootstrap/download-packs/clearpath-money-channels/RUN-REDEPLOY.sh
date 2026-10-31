#!/usr/bin/env bash
# Redeploy fuckweasel from this download pack (Cloud Shell or local with gcloud).
set -euo pipefail
PACK="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export ROOT="${HOME}/MARKETINGDEPT"
BUNDLE="$PACK/publisher-bundle"

if [[ ! -f "$BUNDLE/clearpath-publisher/lib/mediaStore.js" ]]; then
  echo "ERROR: publisher-bundle missing inside this pack"
  exit 1
fi

mkdir -p "$ROOT"
rm -rf "$ROOT/clearpath-publisher"
mkdir -p "$ROOT/clearpath-publisher"
tar -C "$BUNDLE" -cf - clearpath-publisher dashboard-glassmorphism Dockerfile .dockerignore \
  | tar -C "$ROOT" -xf -

test -f "$ROOT/clearpath-publisher/lib/mediaStore.js"
find "$ROOT" -print0 | xargs -0 touch -t 202601011200.00 2>/dev/null || true

cd "$ROOT/clearpath-publisher"
npm ci --omit=dev
PORT=8080 HOST=127.0.0.1 timeout 5 node server.js >/tmp/cp-boot.log 2>&1 || true
if ! grep -q "ClearPath team social console" /tmp/cp-boot.log; then
  echo "LOCAL BOOT FAILED:"
  cat /tmp/cp-boot.log
  exit 1
fi
echo "Local boot OK."

gcloud config set project gen-lang-client-0282858983
gcloud run deploy clearpath-automation-console \
  --source "$ROOT" \
  --region europe-west1 \
  --allow-unauthenticated \
  --port 8080 \
  --timeout 300 \
  --memory 512Mi \
  --quiet

for i in $(seq 1 24); do
  sleep 3
  H=$(curl -sS https://fuckweasel.net/api/health || true)
  echo "try $i: $(echo "$H" | head -c 140)"
  if echo "$H" | grep -q '"ok":true' && echo "$H" | grep -q 'mediaUpload'; then
    echo "SUCCESS — hard-refresh Incognito https://fuckweasel.net"
    exit 0
  fi
done
echo "Deploy finished; health still warming up."
exit 0
