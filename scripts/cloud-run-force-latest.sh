#!/usr/bin/env bash
# Force Cloud Run to serve ONLY the latest revision, then delete older ones.
# Run in Google Cloud Shell (or any machine with gcloud authenticated).
#
# Usage:
#   chmod +x scripts/cloud-run-force-latest.sh
#   ./scripts/cloud-run-force-latest.sh
#
# Optional overrides:
#   SERVICE=clear-path-markets-science REGION=europe-west1 PROJECT=806874867326 \
#     ./scripts/cloud-run-force-latest.sh

set -euo pipefail

SERVICE="${SERVICE:-clear-path-markets-science}"
REGION="${REGION:-europe-west1}"
PROJECT="${PROJECT:-}"

if [[ -n "$PROJECT" ]]; then
  gcloud config set project "$PROJECT" >/dev/null
fi

echo "==> Listing revisions for ${SERVICE} (${REGION})"
gcloud run revisions list \
  --service="$SERVICE" \
  --region="$REGION" \
  --format="table(name,status.conditions[0].status,metadata.creationTimestamp)"

LATEST="$(gcloud run revisions list \
  --service="$SERVICE" \
  --region="$REGION" \
  --sort-by="~metadata.creationTimestamp" \
  --limit=1 \
  --format='value(metadata.name)')"

if [[ -z "$LATEST" ]]; then
  echo "ERROR: could not find any revisions for ${SERVICE}" >&2
  exit 1
fi

echo "==> Routing 100% traffic to latest revision: ${LATEST}"
gcloud run services update-traffic "$SERVICE" \
  --region="$REGION" \
  --to-revisions="${LATEST}=100"

echo "==> Current traffic split:"
gcloud run services describe "$SERVICE" \
  --region="$REGION" \
  --format='yaml(status.traffic)'

echo "==> Deleting older revisions (keeping latest)..."
OLDER="$(gcloud run revisions list \
  --service="$SERVICE" \
  --region="$REGION" \
  --sort-by="~metadata.creationTimestamp" \
  --format='value(metadata.name)' | tail -n +2 || true)"

if [[ -z "${OLDER}" ]]; then
  echo "No older revisions to delete."
else
  while IFS= read -r rev; do
    [[ -z "$rev" ]] && continue
    echo "Deleting ${rev}..."
    gcloud run revisions delete "$rev" --region="$REGION" --quiet || true
  done <<< "$OLDER"
fi

echo "==> Done. Users hitting the service URL now get ${LATEST}."
echo "Note: phone/laptop browsers may still briefly show a cached HTML shell;"
echo "this repo now sends Cache-Control: no-store on HTML so that self-corrects on refresh."
