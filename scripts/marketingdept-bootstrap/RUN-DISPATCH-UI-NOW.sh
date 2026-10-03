#!/usr/bin/env bash
# Paste THIS tiny file into Cloud Shell (or run the one-liner at the bottom).
# It pulls DEPLOY-NO-CURSOR-UI.sh and redeploys fuckweasel.net WITHOUT Cursor paste UI.
set -euo pipefail
echo "=== FIX: remove Paste-into-Cursor UI on fuckweasel.net ==="
echo "Needs: Cloud Shell + gcloud on project gen-lang-client-0282858983"
echo "Needs: ~/MARKETINGDEPT already present (from earlier deploys)"

if [[ ! -f "$HOME/MARKETINGDEPT/clearpath-publisher/package.json" ]]; then
  echo "ERROR: ~/MARKETINGDEPT missing. Clone MARKETINGDEPT into \$HOME first, then re-run."
  exit 1
fi

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  echo "Downloading deploy script via gh…"
  gh api \
    "repos/clearpathcharts/CLAUDEDCLEAR/contents/scripts/marketingdept-bootstrap/DEPLOY-NO-CURSOR-UI.sh?ref=cursor/marketing-team-auth-bootstrap-2373" \
    --jq .content | base64 -d > "$HOME/DEPLOY-NO-CURSOR-UI.sh"
else
  echo "gh not logged in."
  echo "Open Raw, then:  cat > ~/DEPLOY-NO-CURSOR-UI.sh   (paste)   Ctrl+D"
  echo "https://github.com/clearpathcharts/CLAUDEDCLEAR/blob/cursor/marketing-team-auth-bootstrap-2373/scripts/marketingdept-bootstrap/DEPLOY-NO-CURSOR-UI.sh"
  exit 1
fi

chmod +x "$HOME/DEPLOY-NO-CURSOR-UI.sh"
bash "$HOME/DEPLOY-NO-CURSOR-UI.sh"
