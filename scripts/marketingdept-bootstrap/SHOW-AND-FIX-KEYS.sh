#!/usr/bin/env bash
# Show Telegram/Discord/YouTube env NAMES on fuckweasel's service, remap wrong names, redeploy.
set -euo pipefail
PROJECT=gen-lang-client-0282858983
REGION=europe-west1
SVC=clearpath-automation-console
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

gcloud config set project "$PROJECT"

echo "=== Env names on $SVC (values hidden) ==="
gcloud run services describe "$SVC" --region "$REGION" --format=json > /tmp/cp_svc.json
python3 - <<'PY'
import json
d=json.load(open("/tmp/cp_svc.json"))
envs=((d.get("spec") or {}).get("template") or {}).get("spec",{}).get("containers") or [{}]
envs=envs[0].get("env") or []
raw={}
present=set()
print("Social / auth related:")
for e in envs:
    n=e.get("name") or ""
    val=e.get("value")
    has=bool((val or "").strip()) if val is not None else bool(e.get("valueFrom"))
    if val is not None:
        raw[n]=val
    if has:
        present.add(n)
    if has and any(x in n.upper() for x in ("TELEGRAM","DISCORD","YOUTUBE","CHAT","BOT","WEBHOOK","REDDIT","TEAM","SESSION")):
        print(f"  YES  {n}")
for need in ["TELEGRAM_BOT_TOKEN","TELEGRAM_CHAT_ID","DISCORD_WEBHOOK_URL","YOUTUBE_CLIENT_ID","YOUTUBE_CLIENT_SECRET","YOUTUBE_REFRESH_TOKEN"]:
    if need not in present:
        print(f"  no   {need}")
json.dump(raw, open("/tmp/cp_env_raw.json","w"))
PY

echo ""
echo "=== Remap wrong Telegram names → TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID ==="
UPDATE_ARGS=$(python3 - <<'PY'
import json
raw=json.load(open("/tmp/cp_env_raw.json"))
def first(*keys):
    for k in keys:
        v=(raw.get(k) or "").strip()
        if v: return k,v
    return None,""
parts=[]
tok_k, tok = first("TELEGRAM_BOT_TOKEN","TELEGRAM_TOKEN","BOT_TOKEN","SOCIAL_TELEGRAM_BOT_TOKEN")
chat_k, chat = first("TELEGRAM_CHAT_ID","TELEGRAM_CHAT_TOKEN","TELEGRAM_CHANNEL_ID","TELEGRAM_CHANNEL","CHAT_ID","SOCIAL_TELEGRAM_CHAT_ID")
if tok and not (raw.get("TELEGRAM_BOT_TOKEN") or "").strip():
    parts.append("TELEGRAM_BOT_TOKEN="+tok)
    print(f"Will copy token from {tok_k}", file=__import__("sys").stderr)
if chat and not (raw.get("TELEGRAM_CHAT_ID") or "").strip():
    parts.append("TELEGRAM_CHAT_ID="+chat)
    print(f"Will copy chat id from {chat_k}", file=__import__("sys").stderr)
if not parts:
    print("", end="")
else:
    print(",".join(parts))
PY
)

if [[ -n "${UPDATE_ARGS}" ]]; then
  gcloud run services update "$SVC" --region "$REGION" --update-env-vars "$UPDATE_ARGS" --quiet
  echo "Canonical Telegram names updated."
else
  echo "No remap (canonical already set, or Telegram values not found under any known name)."
fi

echo ""
echo "=== Redeploy publisher (accepts aliases + /api/secrets/status) ==="
bash "$SCRIPT_DIR/FIX-CONTAINER-START.sh"

echo ""
echo "=== Live secrets status (booleans only) ==="
curl -sS https://fuckweasel.net/api/secrets/status || true
echo
echo "Done. Hard-refresh fuckweasel. Ops should say Dispatch ready for: Discord, Telegram (if keys found)."
