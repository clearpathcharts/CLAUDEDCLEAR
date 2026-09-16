#!/usr/bin/env bash
# STANDALONE — paste this whole file into Google Cloud Shell.
# No git clone required. Deletes old Cloud Run revisions in batches of 100.
#
# Usage in Cloud Shell:
#   bash cloud-run-bulk-delete-standalone.sh
# Or paste everything below the next line into the Cloud Shell terminal.

set -uo pipefail

PROJECT="${PROJECT:-gen-lang-client-0282858983}"
SERVICE="${SERVICE:-clear-path-markets-science}"
REGION="${REGION:-europe-west1}"
BATCH_SIZE="${BATCH_SIZE:-100}"
KEEP="${KEEP:-1}"
WAIT_SECS="${WAIT_SECS:-10}"

gcloud config set project "$PROJECT" >/dev/null

echo "==> Project: $PROJECT"
echo "==> Service: $SERVICE ($REGION)"

echo "==> Counting revisions..."
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
echo "==> Cloud Run currently has ${TOTAL} revisions (these ARE real — Console is correct)"

if [[ "$TOTAL" -eq 0 ]]; then
  echo "ERROR: gcloud found zero revisions. Check SERVICE/REGION names." >&2
  exit 1
fi

SERVING="$(gcloud run services describe "$SERVICE" \
  --region="$REGION" \
  --format='value(status.latestReadyRevisionName)')"
LATEST="${SERVING:-${ALL_REVS[0]}}"
echo "==> Live revision to KEEP: $LATEST"

echo "==> Pin 100% traffic to latest..."
gcloud run services update-traffic "$SERVICE" --region="$REGION" --to-latest

echo "==> Clear ALL revision tags (required or deletes fail)..."
gcloud run services update-traffic "$SERVICE" --region="$REGION" --clear-tags

echo "==> Wait ${WAIT_SECS}s..."
sleep "$WAIT_SECS"

echo "==> Current traffic:"
gcloud run services describe "$SERVICE" --region="$REGION" --format='yaml(status.traffic)'

DELETABLE=()
for ((i=KEEP; i<TOTAL; i++)); do
  rev="${ALL_REVS[$i]}"
  [[ "$rev" == "$LATEST" ]] && continue
  DELETABLE+=("$rev")
done

PENDING="${#DELETABLE[@]}"
echo "==> Deletable old revisions: $PENDING"

if [[ "$PENDING" -eq 0 ]]; then
  echo "Nothing to delete."
  exit 0
fi

END=$BATCH_SIZE
[[ "$END" -gt "$PENDING" ]] && END="$PENDING"

DELETED=0
FAILED=0
echo "==> Deleting $END revision(s) this run..."

for ((i=0; i<END; i++)); do
  rev="${DELETABLE[$i]}"
  echo "---- [$i/$((END-1))] delete $rev ----"
  if OUT=$(gcloud run revisions delete "$rev" --region="$REGION" --quiet 2>&1); then
    DELETED=$((DELETED + 1))
    echo "OK   $rev"
  else
    FAILED=$((FAILED + 1))
    echo "FAIL $rev"
    echo "$OUT" | sed 's/^/     /'
  fi
done

echo ""
echo "==> RESULT: deleted=$DELETED failed=$FAILED (had $TOTAL total before this run)"
echo "==> Refresh Cloud Run → Revisions. Count should drop by about $DELETED."
echo "==> Re-run this same script to delete the next $BATCH_SIZE."
