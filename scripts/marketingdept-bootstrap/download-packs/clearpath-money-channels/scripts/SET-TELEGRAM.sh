#!/usr/bin/env bash
# Add Telegram bot keys to Cloud Run WITHOUT wiping TEAM_USERS / SESSION_SECRET.
# Usage in Cloud Shell:
#   export TELEGRAM_BOT_TOKEN='123456:ABC...'
#   export TELEGRAM_CHAT_ID='@yourchannel'   # or numeric id
#   bash ~/CLAUDEDCLEAR-fix/scripts/marketingdept-bootstrap/SET-TELEGRAM.sh
set -euo pipefail
: "${TELEGRAM_BOT_TOKEN:?Set TELEGRAM_BOT_TOKEN first}"
: "${TELEGRAM_CHAT_ID:?Set TELEGRAM_CHAT_ID first}"

gcloud config set project gen-lang-client-0282858983
gcloud run services update clearpath-automation-console \
  --region europe-west1 \
  --update-env-vars "TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN},TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID},PUBLIC_BASE_URL=https://fuckweasel.net" \
  --quiet

echo "Waiting for Telegram ready…"
for i in $(seq 1 20); do
  sleep 4
  # health may be auth-gated on older revision — try both
  H=$(curl -sS https://fuckweasel.net/api/health || true)
  echo "try $i: $(echo "$H" | tr ',' '\n' | grep -E 'telegram|ready|console' | head -5 || echo "$H" | head -c 120)"
  echo "$H" | grep -q '"id":"telegram"' && echo "$H" | grep -q '"ready":true' && {
    echo "SUCCESS — Telegram is ready. Hard-refresh fuckweasel.net and Dispatch again (Telegram only first)."
    exit 0
  }
done
echo "Updated env — hard-refresh anyway. If still not ready, open Cloud Run Variables and confirm both names spell exactly TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID."
exit 0
