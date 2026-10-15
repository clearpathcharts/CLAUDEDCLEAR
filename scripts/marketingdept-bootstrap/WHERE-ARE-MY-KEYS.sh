#!/usr/bin/env bash
# Shows WHICH Cloud Run service has Telegram/Discord/YouTube env NAMES set.
# Does NOT print secret values — only yes/no.
set -euo pipefail
PROJECT=gen-lang-client-0282858983
REGION=europe-west1
gcloud config set project "$PROJECT"

check_service() {
  local svc="$1"
  echo ""
  echo "======== $svc ========"
  local json
  json="$(gcloud run services describe "$svc" --region "$REGION" --format=json 2>/dev/null || echo '{}')"
  python3 - <<PY
import json,sys
d=json.loads('''$(echo "$json" | python3 -c 'import json,sys; print(json.dumps(json.load(sys.stdin)))')''')
envs=((d.get("spec") or {}).get("template") or {}).get("spec",{}).get("containers") or [{}]
envs=(envs[0].get("env") or [])
names={e.get("name"): bool((e.get("value") or "").strip() or e.get("valueFrom")) for e in envs if e.get("name")}
want=[
  "TELEGRAM_BOT_TOKEN","TELEGRAM_CHAT_ID","DISCORD_WEBHOOK_URL",
  "YOUTUBE_CLIENT_ID","YOUTUBE_CLIENT_SECRET","YOUTUBE_REFRESH_TOKEN",
  "REDDIT_CLIENT_ID","SESSION_SECRET","TEAM_USERS",
  "SOCIAL_TELEGRAM_BOT_TOKEN","SOCIAL_DISCORD_WEBHOOK_URL",
]
print("service exists:", bool(d.get("metadata")))
for w in want:
  print(f"  {w}: {'YES' if names.get(w) else 'no'}")
extra=sorted(n for n in names if any(x in n for x in ("TELEGRAM","DISCORD","YOUTUBE","WEBHOOK","REDDIT")))
print("  all social-ish names:", ", ".join(extra) if extra else "(none)")
PY
}

check_service clearpath-automation-console
check_service clear-path-markets-science

echo ""
echo "Fuckweasel.net needs keys on: clearpath-automation-console"
echo "If YES only on clear-path-markets-science, we must copy them over (names below)."
echo ""
echo "Next: open"
echo "https://console.cloud.google.com/run/detail/europe-west1/clearpath-automation-console/revisions?project=$PROJECT"
