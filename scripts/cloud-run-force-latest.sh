#!/usr/bin/env bash
# Force Cloud Run to serve ONLY the latest revision, then bulk-delete older ones.
# Designed for services with ~100–200+ revisions (console has no easy "delete 100").
#
# Run in Google Cloud Shell:
#   chmod +x scripts/cloud-run-force-latest.sh
#   ./scripts/cloud-run-force-latest.sh
#
# Optional:
#   SERVICE=clear-path-markets-science \
#   REGION=europe-west1 \
#   PROJECT=gen-lang-client-0282858983 \
#   BATCH_SIZE=100 \
#   KEEP=1 \
#   ./scripts/cloud-run-force-latest.sh
#
# BATCH_SIZE=100  → delete up to 100 old revisions per run (re-run until gone)
# KEEP=1          → keep only the newest revision (set KEEP=3 to keep last 3)

set -euo pipefail

SERVICE="${SERVICE:-clear-path-markets-science}"
REGION="${REGION:-europe-west1}"
PROJECT="${PROJECT:-gen-lang-client-0282858983}"
BATCH_SIZE="${BATCH_SIZE:-100}"
KEEP="${KEEP:-1}"

if [[ -n "$PROJECT" ]]; then
  gcloud config set project "$PROJECT" >/dev/null
fi

echo "==> Project: ${PROJECT}"
echo "==> Service: ${SERVICE} (${REGION})"
echo "==> Batch size: ${BATCH_SIZE} | Keep newest: ${KEEP}"

echo "==> Listing revisions..."
mapfile -t ALL_REVS < <(gcloud run revisions list \
  --service="$SERVICE" \
  --region="$REGION" \
  --sort-by="~metadata.creationTimestamp" \
  --format='value(metadata.name)')

TOTAL="${#ALL_REVS[@]}"
if [[ "$TOTAL" -eq 0 ]]; then
  echo "ERROR: no revisions found" >&2
  exit 1
fi

LATEST="${ALL_REVS[0]}"
echo "==> Found ${TOTAL} revisions. Latest: ${LATEST}"

echo "==> Routing 100% traffic to latest revision first (required before deletes)"
gcloud run services update-traffic "$SERVICE" \
  --region="$REGION" \
  --to-revisions="${LATEST}=100"

echo "==> Traffic after pin:"
gcloud run services describe "$SERVICE" \
  --region="$REGION" \
  --format='yaml(status.traffic)'

# Everything after the KEEP newest revisions is deletable
DELETABLE=("${ALL_REVS[@]:$KEEP}")
PENDING="${#DELETABLE[@]}"
if [[ "$PENDING" -eq 0 ]]; then
  echo "Nothing to delete. Only ${KEEP} revision(s) remain."
  exit 0
fi

# This run only takes the first BATCH_SIZE of the deletable list
BATCH=("${DELETABLE[@]:0:$BATCH_SIZE}")
echo "==> Deleting ${#BATCH[@]} of ${PENDING} old revision(s) this run..."

FAILED=0
for rev in "${BATCH[@]}"; do
  [[ -z "$rev" ]] && continue
  if [[ "$rev" == "$LATEST" ]]; then
    echo "Skipping latest ${rev}"
    continue
  fi
  echo "Deleting ${rev}..."
  if ! gcloud run revisions delete "$rev" --region="$REGION" --quiet; then
    echo "WARN: could not delete ${rev} (may still have traffic or be protected)" >&2
    FAILED=$((FAILED + 1))
  fi
done

REMAINING=$((PENDING - ${#BATCH[@]} + FAILED))
echo "==> Batch complete. Approx remaining old revisions: ${REMAINING}"
if [[ "$REMAINING" -gt 0 ]]; then
  echo "Re-run the same command to delete the next ${BATCH_SIZE}."
else
  echo "All old revisions cleared (kept newest ${KEEP})."
fi

echo "Done. Users now hit ${LATEST}."
