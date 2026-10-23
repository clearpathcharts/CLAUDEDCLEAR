#!/usr/bin/env bash
# Paste ONLY this small file into a FRESH Cloud Shell (do not paste DEPLOY-NO-CURSOR-UI.sh).
set -euo pipefail
echo "=== Tiny fix: download deploy script, then redeploy fuckweasel UI ==="

if [[ ! -f "$HOME/MARKETINGDEPT/clearpath-publisher/package.json" ]]; then
  echo "ERROR: ~/MARKETINGDEPT is missing."
  echo "In Cloud Shell run:  ls ~/MARKETINGDEPT"
  echo "If missing, tell Rick — need recover clone first."
  exit 1
fi

echo "Downloading DEPLOY-NO-CURSOR-UI.sh via GitHub…"
if command -v gh >/dev/null 2>&1; then
  # Login once if needed:  gh auth login
  gh api \
    "repos/clearpathcharts/CLAUDEDCLEAR/contents/scripts/marketingdept-bootstrap/DEPLOY-NO-CURSOR-UI.sh?ref=cursor/marketing-team-auth-bootstrap-2373" \
    --jq .content | base64 -d > "$HOME/DEPLOY-NO-CURSOR-UI.sh"
else
  echo "Installing gh is optional — cloning repo instead…"
  rm -rf "$HOME/CLAUDEDCLEAR-bootstrap"
  git clone --depth 1 --branch cursor/marketing-team-auth-bootstrap-2373 \
    https://github.com/clearpathcharts/CLAUDEDCLEAR.git "$HOME/CLAUDEDCLEAR-bootstrap"
  cp "$HOME/CLAUDEDCLEAR-bootstrap/scripts/marketingdept-bootstrap/DEPLOY-NO-CURSOR-UI.sh" \
    "$HOME/DEPLOY-NO-CURSOR-UI.sh"
fi

chmod +x "$HOME/DEPLOY-NO-CURSOR-UI.sh"
wc -c "$HOME/DEPLOY-NO-CURSOR-UI.sh"
echo "Starting deploy (this takes a few minutes)…"
bash "$HOME/DEPLOY-NO-CURSOR-UI.sh"
