#!/usr/bin/env bash
# Set TikTok Content Posting token without wiping other secrets.
# Usage:
#   TIKTOK_ACCESS_TOKEN=... bash SET-TIKTOK.sh
set -euo pipefail
PROJECT=gen-lang-client-0282858983
REGION=europe-west1
SVC=clearpath-automation-console

: "${TIKTOK_ACCESS_TOKEN:?Set TIKTOK_ACCESS_TOKEN}"
PRIVACY="${TIKTOK_PRIVACY_LEVEL:-SELF_ONLY}"
CLIENT_KEY="${TIKTOK_CLIENT_KEY:-}"
CLIENT_SECRET="${TIKTOK_CLIENT_SECRET:-}"

VARS="TIKTOK_ACCESS_TOKEN=${TIKTOK_ACCESS_TOKEN},TIKTOK_PRIVACY_LEVEL=${PRIVACY},PUBLIC_BASE_URL=https://fuckweasel.net"
if [[ -n "$CLIENT_KEY" ]]; then VARS="${VARS},TIKTOK_CLIENT_KEY=${CLIENT_KEY}"; fi
if [[ -n "$CLIENT_SECRET" ]]; then VARS="${VARS},TIKTOK_CLIENT_SECRET=${CLIENT_SECRET}"; fi

gcloud config set project "$PROJECT"
gcloud run services update "$SVC" \
  --region "$REGION" \
  --update-env-vars "$VARS" \
  --quiet

echo "Waiting for tiktokReady…"
for i in $(seq 1 20); do
  sleep 3
  S=$(curl -sS https://fuckweasel.net/api/secrets/status || true)
  echo "try $i: $(echo "$S" | head -c 200)"
  if echo "$S" | grep -q '"tiktokReady":true'; then
    echo "SUCCESS — TikTok Dispatch ready (privacy=${PRIVACY})."
    echo "Complete Content Posting API audit before PUBLIC_TO_EVERYONE."
    exit 0
  fi
done
echo "Updated — check https://fuckweasel.net/api/secrets/status"
exit 0
