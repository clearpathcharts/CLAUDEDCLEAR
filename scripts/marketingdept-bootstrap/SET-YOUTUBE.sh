#!/usr/bin/env bash
# Set YouTube OAuth on clearpath-automation-console without wiping other secrets.
# Usage:
#   YOUTUBE_CLIENT_ID=... YOUTUBE_CLIENT_SECRET=... YOUTUBE_REFRESH_TOKEN=... bash SET-YOUTUBE.sh
set -euo pipefail
PROJECT=gen-lang-client-0282858983
REGION=europe-west1
SVC=clearpath-automation-console

: "${YOUTUBE_CLIENT_ID:?Set YOUTUBE_CLIENT_ID}"
: "${YOUTUBE_CLIENT_SECRET:?Set YOUTUBE_CLIENT_SECRET}"
: "${YOUTUBE_REFRESH_TOKEN:?Set YOUTUBE_REFRESH_TOKEN}"
PRIVACY="${YOUTUBE_PRIVACY:-unlisted}"

gcloud config set project "$PROJECT"
gcloud run services update "$SVC" \
  --region "$REGION" \
  --update-env-vars "YOUTUBE_CLIENT_ID=${YOUTUBE_CLIENT_ID},YOUTUBE_CLIENT_SECRET=${YOUTUBE_CLIENT_SECRET},YOUTUBE_REFRESH_TOKEN=${YOUTUBE_REFRESH_TOKEN},YOUTUBE_PRIVACY=${PRIVACY},PUBLIC_BASE_URL=https://fuckweasel.net" \
  --quiet

echo "Waiting for youtubeReady…"
for i in $(seq 1 20); do
  sleep 3
  S=$(curl -sS https://fuckweasel.net/api/secrets/status || true)
  echo "try $i: $(echo "$S" | head -c 200)"
  if echo "$S" | grep -q '"youtubeReady":true'; then
    echo "SUCCESS — YouTube Dispatch ready. Upload MP4 → pick YouTube → Dispatch now."
    exit 0
  fi
done
echo "Updated — hard-refresh fuckweasel and check /api/secrets/status"
exit 0
