#!/usr/bin/env bash
# Fix Cloud Run "failed to start and listen on PORT=8080"
# Cause: Docker COPY was shipping Cloud Shell node_modules into the image.
set -euo pipefail
ROOT="$HOME/MARKETINGDEPT"
test -f "$ROOT/clearpath-publisher/package.json"

echo "=== Fix container start (drop host node_modules, harden Docker) ==="

# 1) Never send host node_modules / junk into the build
cat > "$ROOT/.dockerignore" <<'EOF'
**/node_modules
**/npm-debug.log
**/.git
**/.gitignore
**/data/uploads
**/data/*.json
**/.env
**/.env.*
**/*.md
**/README*
**/.DS_Store
**/dist
**/coverage
EOF

# 2) Dockerfile: install deps in image only; never overwrite with host modules
cat > "$ROOT/Dockerfile" <<'EOF'
FROM node:22-slim
WORKDIR /app

COPY clearpath-publisher/package.json clearpath-publisher/package-lock.json ./clearpath-publisher/
RUN cd clearpath-publisher && npm ci --omit=dev

COPY clearpath-publisher ./clearpath-publisher
COPY dashboard-glassmorphism ./dashboard-glassmorphism

# Belt: if anything leaked, wipe and reinstall clean
RUN rm -rf clearpath-publisher/node_modules \
  && cd clearpath-publisher && npm ci --omit=dev

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0
EXPOSE 8080

CMD ["node", "clearpath-publisher/server.js"]
EOF

# 3) Prove server boots locally in Cloud Shell before spending a Cloud Build
cd "$ROOT/clearpath-publisher"
if [[ ! -d node_modules/express ]]; then
  npm ci --omit=dev
fi
# Date fix (ZIP)
find "$ROOT" -print0 | xargs -0 touch -t 202601011200.00 2>/dev/null || true

echo "Local boot check…"
PORT=8080 HOST=127.0.0.1 timeout 4 node server.js >/tmp/cp-boot.log 2>&1 || true
if ! grep -q "ClearPath team social console" /tmp/cp-boot.log; then
  echo "LOCAL BOOT FAILED — paste this log to Rick:"
  cat /tmp/cp-boot.log
  exit 1
fi
echo "Local boot OK."
cat /tmp/cp-boot.log

echo "Deploying europe-west1…"
gcloud config set project gen-lang-client-0282858983
gcloud run deploy clearpath-automation-console \
  --source "$ROOT" \
  --region europe-west1 \
  --allow-unauthenticated \
  --port 8080 \
  --timeout 300 \
  --cpu 1 \
  --memory 512Mi \
  --quiet

echo "Waiting for health…"
for i in $(seq 1 20); do
  sleep 5
  H=$(curl -sS https://fuckweasel.net/api/health || true)
  echo "try $i: $(echo "$H" | tr ',' '\n' | grep console || echo none)"
  echo "$H" | grep -q social-team-private && {
    echo "SUCCESS — hard-refresh Incognito https://fuckweasel.net"
    exit 0
  }
done

echo "Still failing — last logs:"
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="clearpath-automation-console"' \
  --project=gen-lang-client-0282858983 \
  --limit=25 \
  --format='value(textPayload)' 2>/dev/null | head -40 || true
exit 1
