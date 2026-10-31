#!/usr/bin/env bash
# Set Facebook + Instagram Meta keys without wiping other secrets.
# Usage:
#   META_PAGE_ID=... META_PAGE_ACCESS_TOKEN=... META_IG_USER_ID=... bash SET-META.sh
set -euo pipefail
PROJECT=gen-lang-client-0282858983
REGION=europe-west1
SVC=clearpath-automation-console

: "${META_PAGE_ID:?Set META_PAGE_ID}"
: "${META_PAGE_ACCESS_TOKEN:?Set META_PAGE_ACCESS_TOKEN}"
META_IG_USER_ID="${META_IG_USER_ID:-}"
META_APP_ID="${META_APP_ID:-}"

VARS="META_PAGE_ID=${META_PAGE_ID},META_PAGE_ACCESS_TOKEN=${META_PAGE_ACCESS_TOKEN},PUBLIC_BASE_URL=https://fuckweasel.net"
if [[ -n "$META_IG_USER_ID" ]]; then VARS="${VARS},META_IG_USER_ID=${META_IG_USER_ID}"; fi
if [[ -n "$META_APP_ID" ]]; then VARS="${VARS},META_APP_ID=${META_APP_ID}"; fi

gcloud config set project "$PROJECT"
gcloud run services update "$SVC" \
  --region "$REGION" \
  --update-env-vars "$VARS" \
  --quiet

echo "Waiting for facebookReady…"
for i in $(seq 1 20); do
  sleep 3
  S=$(curl -sS https://fuckweasel.net/api/secrets/status || true)
  echo "try $i: $(echo "$S" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("resolved",{}))' 2>/dev/null || echo "$S" | head -c 180)"
  if echo "$S" | grep -q '"facebookReady":true'; then
    echo "SUCCESS — Facebook ready. Instagram ready only if META_IG_USER_ID was set."
    echo "App Review still required for non-tester public posting (Meta rule)."
    exit 0
  fi
done
echo "Updated — check https://fuckweasel.net/api/secrets/status"
exit 0
