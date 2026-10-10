#!/usr/bin/env bash
# Add Chris + Pampling student logins on fuckweasel.net.
# Updates TEAM_USERS only — does NOT wipe Discord/Telegram/SESSION_SECRET.
set -euo pipefail

PROJECT="${PROJECT:-gen-lang-client-0282858983}"
REGION="${REGION:-europe-west1}"
SERVICE="${SERVICE:-clearpath-automation-console}"

CHRIS_USER="${CHRIS_USER:-chris}"
CHRIS_PASS="${CHRIS_PASS:-ChrisStudent1}"
PAMPLIN_USER="${PAMPLIN_USER:-pamplin}"
PAMPLIN_PASS="${PAMPLIN_PASS:-PamplinStudent1}"

gcloud config set project "$PROJECT"

echo "Reading current TEAM_USERS…"
CURRENT="$(gcloud run services describe "$SERVICE" --region "$REGION" --format=json \
  | python3 -c '
import json,sys
d=json.load(sys.stdin)
envs=(d.get("spec") or {}).get("template",{}).get("spec",{}).get("containers",[{}])[0].get("env") or []
print(next((e.get("value") or "" for e in envs if e.get("name")=="TEAM_USERS"), ""))
')"

if [[ -z "$CURRENT" ]]; then
  echo "TEAM_USERS empty — seeding base team + students"
  CURRENT="brent:BrentChangeMe1:member,dustin:DustinChangeMe1:member,brian:BrianChangeMe1:member,owner:OwnerChangeMe1:owner"
fi

NEW_USERS="$(
CURRENT_TEAM_USERS="$CURRENT" \
CHRIS_USER="$CHRIS_USER" CHRIS_PASS="$CHRIS_PASS" \
PAMPLIN_USER="$PAMPLIN_USER" PAMPLIN_PASS="$PAMPLIN_PASS" \
python3 - <<'PY'
import os
cur = (os.environ.get("CURRENT_TEAM_USERS") or "").strip().rstrip(",")
by = {}
for part in cur.split(","):
    part = part.strip()
    if not part:
        continue
    bits = part.split(":")
    if len(bits) < 2:
        continue
    user = bits[0].strip().lower()
    password = bits[1]
    role = bits[2].strip() if len(bits) > 2 else "member"
    if role not in ("owner", "member"):
        role = "member"
    if user and password:
        by[user] = (password, role)

chris = os.environ["CHRIS_USER"].strip().lower()
pamplin = os.environ["PAMPLIN_USER"].strip().lower()
by[chris] = (os.environ["CHRIS_PASS"], "member")
by[pamplin] = (os.environ["PAMPLIN_PASS"], "member")

order = ["owner", "brent", "dustin", "brian", chris, pamplin]
seen = set()
out = []
for u in order:
    if u in by and u not in seen:
        pw, role = by[u]
        out.append(f"{u}:{pw}:{role}")
        seen.add(u)
for u in sorted(by):
    if u not in seen:
        pw, role = by[u]
        out.append(f"{u}:{pw}:{role}")
print(",".join(out))
PY
)"

echo "Accounts will be: $(echo "$NEW_USERS" | tr ',' '\n' | cut -d: -f1 | paste -sd, -)"
echo "Updating Cloud Run TEAM_USERS only…"
gcloud run services update "$SERVICE" \
  --region "$REGION" \
  --update-env-vars "TEAM_USERS=${NEW_USERS}" \
  --quiet

echo "Waiting for roster…"
for i in $(seq 1 20); do
  sleep 3
  R=$(curl -sS https://fuckweasel.net/api/auth/roster || true)
  echo "try $i: $R"
  if echo "$R" | grep -q "\"${CHRIS_USER}\"" && echo "$R" | grep -q "\"${PAMPLIN_USER}\""; then
    echo ""
    echo "SUCCESS — students log in at https://fuckweasel.net/login"
    echo "  ${CHRIS_USER}    / ${CHRIS_PASS}"
    echo "  ${PAMPLIN_USER}  / ${PAMPLIN_PASS}"
    echo "Usernames are lowercase. Change passwords after class."
    exit 0
  fi
done
echo "FAIL — roster did not show students yet."
exit 1
