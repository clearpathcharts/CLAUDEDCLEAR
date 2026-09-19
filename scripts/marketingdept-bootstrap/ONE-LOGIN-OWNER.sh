#!/usr/bin/env bash
# Collapse fuckweasel logins to a single owner account.
# Keeps existing owner password if present; otherwise OwnerChangeMe1 (or OWNER_PASS).
# Does NOT wipe Discord/Telegram/SESSION_SECRET.
set -euo pipefail
PROJECT=gen-lang-client-0282858983
REGION=europe-west1
SVC=clearpath-automation-console
OWNER_USER="${OWNER_USER:-owner}"
OWNER_PASS="${OWNER_PASS:-}"

gcloud config set project "$PROJECT"

echo "Reading current TEAM_USERS…"
gcloud run services describe "$SVC" --region "$REGION" --format=json > /tmp/cp_svc.json
NEW_USERS=$(
OWNER_USER="$OWNER_USER" OWNER_PASS="$OWNER_PASS" python3 - <<'PY'
import json, os, sys
d=json.load(open("/tmp/cp_svc.json"))
envs=((d.get("spec") or {}).get("template") or {}).get("spec",{}).get("containers") or [{}]
envs=envs[0].get("env") or []
cur=""
for e in envs:
    if e.get("name")=="TEAM_USERS":
        cur=(e.get("value") or "").strip()
        break
owner_user=(os.environ.get("OWNER_USER") or "owner").strip().lower() or "owner"
owner_pass=(os.environ.get("OWNER_PASS") or "").strip()
if not owner_pass and cur:
    for part in cur.split(","):
        bits=part.strip().split(":")
        if len(bits)>=2 and bits[0].strip().lower()==owner_user:
            owner_pass=bits[1]
            break
if not owner_pass:
    owner_pass="OwnerChangeMe1"
print(f"{owner_user}:{owner_pass}:owner")
print(f"Single login → {owner_user}", file=sys.stderr)
PY
)

echo "Updating Cloud Run TEAM_USERS to single owner (other users removed)…"
gcloud run services update "$SVC" \
  --region "$REGION" \
  --update-env-vars "TEAM_USERS=${NEW_USERS}" \
  --quiet

echo "Waiting for roster…"
for i in $(seq 1 20); do
  sleep 3
  R=$(curl -sS https://fuckweasel.net/api/auth/roster || true)
  echo "try $i: $R"
  if OWNER_USER="$OWNER_USER" R="$R" python3 - <<'PY'
import json, os, sys
try:
    d=json.loads(os.environ["R"])
except Exception:
    sys.exit(1)
users=[str(u).lower() for u in (d.get("users") or [])]
want=os.environ.get("OWNER_USER","owner").lower()
sys.exit(0 if d.get("configured") and users==[want] else 1)
PY
  then
    echo ""
    echo "SUCCESS — only one login: ${OWNER_USER}"
    echo "Hard-refresh https://fuckweasel.net/login"
    exit 0
  fi
done
echo "Updated — hard-refresh login. Wait ~30s if roster still shows old names."
exit 0
