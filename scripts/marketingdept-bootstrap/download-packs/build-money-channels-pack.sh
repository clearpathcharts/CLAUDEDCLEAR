#!/usr/bin/env bash
# Rebuild clearpath-money-channels/ folder + zip from current bootstrap tree.
set -euo pipefail
BOOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACK_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/clearpath-money-channels"
OUT_ZIP="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/clearpath-money-channels.zip"

rm -rf "$PACK_ROOT"
mkdir -p "$PACK_ROOT"/{scripts,env-templates,publisher-bundle}

cp "$BOOT/MONEY-CHANNELS.txt" "$BOOT/CLOUD-SHELL-FIX.txt" "$PACK_ROOT/"
for f in FIX-CONTAINER-START.sh ONE-LOGIN-OWNER.sh SET-YOUTUBE.sh SET-META.sh SET-TIKTOK.sh SHOW-AND-FIX-KEYS.sh SET-TELEGRAM.sh WHERE-ARE-MY-KEYS.sh; do
  cp "$BOOT/$f" "$PACK_ROOT/scripts/"
  chmod +x "$PACK_ROOT/scripts/$f"
done

tar -C "$BOOT/publisher-bundle" -cf - . | tar -C "$PACK_ROOT/publisher-bundle" -xf -

cat > "$PACK_ROOT/env-templates/youtube.env" <<'EOF'
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REFRESH_TOKEN=
YOUTUBE_PRIVACY=unlisted
EOF
cat > "$PACK_ROOT/env-templates/meta.env" <<'EOF'
META_PAGE_ID=
META_PAGE_ACCESS_TOKEN=
META_IG_USER_ID=
META_APP_ID=
EOF
cat > "$PACK_ROOT/env-templates/tiktok.env" <<'EOF'
TIKTOK_ACCESS_TOKEN=
TIKTOK_PRIVACY_LEVEL=SELF_ONLY
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
EOF

cp "$(dirname "${BASH_SOURCE[0]}")/clearpath-money-channels/RUN-REDEPLOY.sh" "$PACK_ROOT/RUN-REDEPLOY.sh" 2>/dev/null || true
# Always write RUN-REDEPLOY + START-HERE from templates embedded below
cat > "$PACK_ROOT/RUN-REDEPLOY.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
PACK="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="${HOME}/MARKETINGDEPT"
BUNDLE="$PACK/publisher-bundle"
test -f "$BUNDLE/clearpath-publisher/lib/mediaStore.js"
mkdir -p "$ROOT"
rm -rf "$ROOT/clearpath-publisher"
tar -C "$BUNDLE" -cf - clearpath-publisher dashboard-glassmorphism Dockerfile .dockerignore | tar -C "$ROOT" -xf -
find "$ROOT" -print0 | xargs -0 touch -t 202601011200.00 2>/dev/null || true
cd "$ROOT/clearpath-publisher"
npm ci --omit=dev
PORT=8080 HOST=127.0.0.1 timeout 5 node server.js >/tmp/cp-boot.log 2>&1 || true
grep -q "ClearPath team social console" /tmp/cp-boot.log || { cat /tmp/cp-boot.log; exit 1; }
gcloud config set project gen-lang-client-0282858983
gcloud run deploy clearpath-automation-console --source "$ROOT" --region europe-west1 --allow-unauthenticated --port 8080 --timeout 300 --memory 512Mi --quiet
for i in $(seq 1 24); do
  sleep 3
  H=$(curl -sS https://fuckweasel.net/api/health || true)
  echo "try $i: $(echo "$H" | head -c 140)"
  echo "$H" | grep -q '"ok":true' && echo "$H" | grep -q mediaUpload && { echo SUCCESS; exit 0; }
done
exit 0
EOF
chmod +x "$PACK_ROOT/RUN-REDEPLOY.sh"

cp "$BOOT/download-packs/clearpath-money-channels/START-HERE.txt" "$PACK_ROOT/START-HERE.txt" 2>/dev/null || cat > "$PACK_ROOT/START-HERE.txt" <<'EOF'
See MONEY-CHANNELS.txt and RUN-REDEPLOY.sh
EOF

# Prefer keeping the human START-HERE if we already wrote it in pack root from prior build
if [[ ! -s "$PACK_ROOT/START-HERE.txt" ]] || ! grep -q "DOWNLOAD PACK" "$PACK_ROOT/START-HERE.txt" 2>/dev/null; then
  cat > "$PACK_ROOT/START-HERE.txt" <<'EOF'
CLEARPATH MONEY CHANNELS — DOWNLOAD PACK
Upload/unzip this folder to Cloud Shell, then: bash RUN-REDEPLOY.sh
Fill env-templates/*.env and run scripts/SET-YOUTUBE.sh (then SET-META / SET-TIKTOK).
Full checklist: MONEY-CHANNELS.txt
EOF
fi

find "$PACK_ROOT" -print0 | xargs -0 touch -t 202601011200.00 2>/dev/null || true
rm -f "$OUT_ZIP"
( cd "$(dirname "$PACK_ROOT")" && zip -r -q "$(basename "$OUT_ZIP")" "$(basename "$PACK_ROOT")" -x '*/node_modules/*' '*/.git/*' )
cp -f "$OUT_ZIP" /opt/cursor/artifacts/clearpath-money-channels.zip 2>/dev/null || true
echo "Built $OUT_ZIP ($(du -h "$OUT_ZIP" | awk '{print $1}'))"
