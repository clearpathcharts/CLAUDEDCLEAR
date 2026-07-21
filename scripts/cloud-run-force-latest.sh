#!/usr/bin/env bash
# Pin 100% traffic to the latest Cloud Run revision, CLEAR revision tags,
# then bulk-delete older revisions in batches.
#
# Why the first version only deleted ~1 revision:
# Cloud Run refuses to delete any revision that still has a traffic TAG
# (even at 0%). We must --clear-tags before deletes will succeed.
#
# Run in Google Cloud Shell:
#   chmod +x scripts/cloud-run-force-latest.sh
#   PROJECT=gen-lang-client-0282858983 \
#   SERVICE=clear-path-markets-science \
#   REGION=europe-west1 \
#   BATCH_SIZE=100 \
#   ./scripts/cloud-run-force-latest.sh
#
# Re-run until "Nothing left to delete."

set -uo pipefail

SERVICE="${SERVICE:-clear-path-markets-science}"
REGION="${REGION:-europe-west1}"
PROJECT="${PROJECT:-gen-lang-client-0282858983}"
BATCH_SIZE="${BATCH_SIZE:-100}"
KEEP="${KEEP:-1}"
WAIT_SECS="${WAIT_SECS:-8}"

if [[ -n "$PROJECT" ]]; then
  gcloud config set project "$PROJECT" >/dev/null
fi

echo "==> Project:  ${PROJECT}"
echo "==> Service:  ${SERVICE} (${REGION})"
echo "==> Batch:    ${BATCH_SIZE} | Keep newest: ${KEEP}"

echo "==> Listing ALL revisions (newest first)..."
ALL_REVS=()
while IFS= read -r rev; do
  [[ -n "$rev" ]] && ALL_REVS+=("$rev")
done < <(gcloud run revisions list \
  --service="$SERVICE" \
  --region="$REGION" \
  --sort-by="~metadata.creationTimestamp" \
  --format='value(metadata.name)' \
  --limit=999)

TOTAL="${#ALL_REVS[@]}"
if [[ "$TOTAL" -eq 0 ]]; then
  echo "ERROR: no revisions found" >&2
  exit 1
fi

# Prefer the service's actual serving revision over list order
SERVING="$(gcloud run services describe "$SERVICE" \
  --region="$REGION" \
  --format='value(status.latestReadyRevisionName)' 2>/dev/null || true)"
LATEST="${SERVING:-${ALL_REVS[0]}}"

echo "==> Found ${TOTAL} revisions"
echo "==> Serving / keep target: ${LATEST}"

echo "==> Step 1/3: send 100% traffic to LATEST (not a pinned old name)"
gcloud run services update-traffic "$SERVICE" \
  --region="$REGION" \
  --to-latest

echo "==> Step 2/3: CLEAR all revision URL tags (required — tagged revs cannot be deleted)"
gcloud run services update-traffic "$SERVICE" \
  --region="$REGION" \
  --clear-tags

echo "==> Waiting ${WAIT_SECS}s for traffic/tag update to settle..."
sleep "$WAIT_SECS"

echo "==> Traffic targets now:"
gcloud run services describe "$SERVICE" \
  --region="$REGION" \
  --format='yaml(status.traffic)'

# Rebuild deletable list: everything except the KEEP newest, never the serving revision
DELETABLE=()
for ((i=KEEP; i<TOTAL; i++)); do
  rev="${ALL_REVS[$i]}"
  if [[ "$rev" == "$LATEST" ]]; then
    continue
  fi
  DELETABLE+=("$rev")
done

PENDING="${#DELETABLE[@]}"
if [[ "$PENDING" -eq 0 ]]; then
  echo "Nothing left to delete. Only the newest revision(s) remain."
  exit 0
fi

# Take only this batch
END=$BATCH_SIZE
if [[ "$END" -gt "$PENDING" ]]; then
  END="$PENDING"
fi

echo "==> Step 3/3: deleting ${END} of ${PENDING} old revision(s)..."

DELETED=0
FAILED=0
FAILED_NAMES=()

for ((i=0; i<END; i++)); do
  rev="${DELETABLE[$i]}"
  echo "---- deleting ${rev} (${DELETED}/${END} ok so far) ----"
  ERR_FILE="$(mktemp)"
  if gcloud run revisions delete "$rev" --region="$REGION" --quiet 2>"$ERR_FILE"; then
    DELETED=$((DELETED + 1))
    echo "OK  ${rev}"
  else
    FAILED=$((FAILED + 1))
    FAILED_NAMES+=("$rev")
    echo "FAIL ${rev}" >&2
    sed 's/^/     /' "$ERR_FILE" >&2 || true
  fi
  rm -f "$ERR_FILE"
done

echo ""
echo "==> Batch result: deleted=${DELETED}  failed=${FAILED}  still_pending≈$((PENDING - DELETED))"
if [[ "$FAILED" -gt 0 ]]; then
  echo "==> Failed revisions (usually still tagged or still 'latest'):"
  printf '     %s\n' "${FAILED_NAMES[@]}"
  echo "Tip: re-run this script. If the same names keep failing, open each in Console → Revisions and remove any tag/URL."
fi

LEFT=$((PENDING - DELETED))
if [[ "$LEFT" -gt 0 ]]; then
  echo "Re-run the same command to delete the next batch of up to ${BATCH_SIZE}."
else
  echo "All old revisions cleared (kept newest ${KEEP})."
fi

echo "Done. Live traffic should be on: ${LATEST}"
