#!/usr/bin/env bash
# PR Auto Updater — keep open PR branches current with main.
#
# Default (safe): merge origin/main into each open PR branch.
#   - Clean merges are pushed.
#   - Conflicts are left alone and listed in the report.
#
# Optional:
#   --include-drafts     Also process draft PRs
#   --merge-ready        Squash-merge MERGEABLE+CLEAN non-draft PRs after sync
#                        (skips PRs labeled no-automerge)
#   --dry-run            Print actions only
#   --limit N            Process at most N PRs (default: all)
#
# Env:
#   PR_AUTO_BASE=main
#   PR_AUTO_SKIP_LABEL=no-auto-update
#   PR_AUTO_NO_MERGE_LABEL=no-automerge
#   PR_AUTO_WORKDIR=/tmp/pr-auto-updater
#
# Usage:
#   bash scripts/pr-auto-updater.sh
#   bash scripts/pr-auto-updater.sh --merge-ready
#   npm run pr:auto-update

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BASE="${PR_AUTO_BASE:-main}"
SKIP_LABEL="${PR_AUTO_SKIP_LABEL:-no-auto-update}"
NO_MERGE_LABEL="${PR_AUTO_NO_MERGE_LABEL:-no-automerge}"
WORKDIR="${PR_AUTO_WORKDIR:-$ROOT/data/pr-auto-updater-work}"
REPORT_DIR="$ROOT/data"
REPORT="$REPORT_DIR/pr-auto-updater-report.md"
LOG="$REPORT_DIR/pr-auto-updater.log"

INCLUDE_DRAFTS=0
MERGE_READY=0
DRY_RUN=0
LIMIT=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --include-drafts) INCLUDE_DRAFTS=1; shift ;;
    --merge-ready) MERGE_READY=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    --limit) LIMIT="${2:-0}"; shift 2 ;;
    -h|--help)
      sed -n '2,28p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown flag: $1" >&2
      exit 2
      ;;
  esac
done

mkdir -p "$REPORT_DIR" "$WORKDIR"

log() {
  local line="[$(date -Iseconds)] $*"
  printf '%s\n' "$line" | tee -a "$LOG"
}

need() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

need git
need gh
need jq

if ! gh auth status >/dev/null 2>&1; then
  echo "gh is not authenticated. Run: gh auth login" >&2
  exit 1
fi

REPO="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
log "PR auto-updater start repo=$REPO base=$BASE dry_run=$DRY_RUN merge_ready=$MERGE_READY"

git fetch origin "$BASE" --quiet

# Ensure local base is current for merge-base checks
git rev-parse --verify "origin/$BASE" >/dev/null

QUERY='.[]'
if [[ "$INCLUDE_DRAFTS" -eq 0 ]]; then
  QUERY='.[] | select(.isDraft == false)'
fi

mapfile -t PR_JSON_LINES < <(
  gh pr list --state open --limit 100 \
    --json number,title,headRefName,isDraft,mergeable,mergeStateStatus,labels,url \
    --jq "$QUERY | @json"
)

if [[ ${#PR_JSON_LINES[@]} -eq 0 ]]; then
  log "No open PRs to process."
  {
    echo "# PR Auto Updater Report"
    echo
    echo "Generated: $(date -Iseconds)"
    echo
    echo "No open PRs matched filters."
  } >"$REPORT"
  exit 0
fi

UPDATED=()
CONFLICTED=()
SKIPPED=()
MERGED=()
FAILED=()
PROCESSED=0

has_label() {
  local labels_json="$1"
  local want="$2"
  echo "$labels_json" | jq -e --arg w "$want" '[.[].name] | index($w) != null' >/dev/null 2>&1
}

sync_pr() {
  local num="$1" branch="$2" title="$3" labels="$4" url="$5"

  if has_label "$labels" "$SKIP_LABEL"; then
    SKIPPED+=("#$num · skipped ($SKIP_LABEL) · $title")
    return 0
  fi
  if [[ "$branch" == "$BASE" ]]; then
    SKIPPED+=("#$num · skipped (base branch) · $title")
    return 0
  fi

  log "→ #$num sync $branch — $title"

  if [[ "$DRY_RUN" -eq 1 ]]; then
    UPDATED+=("#$num · dry-run sync · $url")
    return 0
  fi

  if ! git fetch origin "$branch" --quiet 2>/dev/null; then
    FAILED+=("#$num · fetch failed · $url")
    return 0
  fi

  local wt="$WORKDIR/pr-$num"
  rm -rf "$wt"
  if ! git worktree add --detach "$wt" "origin/$branch" >/dev/null 2>&1; then
    FAILED+=("#$num · worktree failed · $url")
    return 0
  fi

  local status
  status="$(
    set +e
    cd "$wt" || exit 99
    git checkout -B "$branch" "origin/$branch" >/dev/null 2>&1 || exit 98
    if git merge "origin/$BASE" --no-edit >/dev/null 2>&1; then
      if git push -u origin "HEAD:refs/heads/$branch" >/dev/null 2>&1; then
        echo OK
      else
        echo PUSH_FAIL
      fi
    else
      git merge --abort >/dev/null 2>&1
      echo CONFLICT
    fi
  )"

  git worktree remove --force "$wt" >/dev/null 2>&1 || rm -rf "$wt"

  case "$status" in
    OK)
      UPDATED+=("#$num · updated with $BASE · $url")
      log "  OK updated #$num"
      # Comment once when we actually pushed a sync (best-effort)
      gh pr comment "$num" --body "🤖 **PR Auto Updater:** merged \`origin/$BASE\` into this branch (clean)." >/dev/null 2>&1 || true
      ;;
    CONFLICT)
      CONFLICTED+=("#$num · CONFLICT with $BASE · $url")
      log "  CONFLICT #$num"
      gh pr comment "$num" --body "🤖 **PR Auto Updater:** cannot auto-merge \`origin/$BASE\` — **conflicts need a human**." >/dev/null 2>&1 || true
      ;;
    PUSH_FAIL)
      FAILED+=("#$num · push failed · $url")
      log "  PUSH_FAIL #$num"
      ;;
    *)
      FAILED+=("#$num · unexpected ($status) · $url")
      log "  FAIL #$num status=$status"
      ;;
  esac
}

maybe_merge_ready() {
  local num="$1" title="$2" labels="$3" url="$4" mergeable="$5" state="$6" is_draft="$7"

  [[ "$MERGE_READY" -eq 1 ]] || return 0
  [[ "$is_draft" == "true" ]] && return 0
  has_label "$labels" "$NO_MERGE_LABEL" && {
    SKIPPED+=("#$num · no-automerge label · $title")
    return 0
  }

  # Refresh mergeability after sync
  local info
  info="$(gh pr view "$num" --json mergeable,mergeStateStatus,isDraft --jq '"\(.mergeable)|\(.mergeStateStatus)|\(.isDraft)"' 2>/dev/null || echo 'UNKNOWN|UNKNOWN|true')"
  local m ms d
  IFS='|' read -r m ms d <<<"$info"

  if [[ "$m" == "MERGEABLE" && ( "$ms" == "CLEAN" || "$ms" == "UNSTABLE" || "$ms" == "HAS_HOOKS" || "$ms" == "BEHIND" || "$ms" == "UNKNOWN" || "$ms" == "BLOCKED" ) ]]; then
    # Prefer CLEAN; still attempt UNSTABLE (CI pending) with squash if allowed
    if [[ "$ms" == "DIRTY" || "$ms" == "DRAFT" ]]; then
      return 0
    fi
    if [[ "$DRY_RUN" -eq 1 ]]; then
      MERGED+=("#$num · dry-run would squash-merge · $url")
      return 0
    fi
    # Mark ready if still draft somehow
    if [[ "$d" == "true" ]]; then
      gh pr ready "$num" >/dev/null 2>&1 || true
    fi
    if gh pr merge "$num" --squash >/dev/null 2>&1; then
      MERGED+=("#$num · squash-merged · $url")
      log "  MERGED #$num"
    else
      FAILED+=("#$num · merge attempt failed · $url")
      log "  merge failed #$num"
    fi
  fi
}

for line in "${PR_JSON_LINES[@]}"; do
  [[ -n "$line" ]] || continue
  if [[ "$LIMIT" -gt 0 && "$PROCESSED" -ge "$LIMIT" ]]; then
    break
  fi

  num="$(echo "$line" | jq -r .number)"
  title="$(echo "$line" | jq -r .title)"
  branch="$(echo "$line" | jq -r .headRefName)"
  labels="$(echo "$line" | jq -c .labels)"
  url="$(echo "$line" | jq -r .url)"
  mergeable="$(echo "$line" | jq -r .mergeable)"
  state="$(echo "$line" | jq -r .mergeStateStatus)"
  is_draft="$(echo "$line" | jq -r .isDraft)"

  sync_pr "$num" "$branch" "$title" "$labels" "$url"
  maybe_merge_ready "$num" "$title" "$labels" "$url" "$mergeable" "$state" "$is_draft"
  PROCESSED=$((PROCESSED + 1))
done

# Write report
{
  echo "# PR Auto Updater Report"
  echo
  echo "Generated: $(date -Iseconds)"
  echo "Repo: \`$REPO\` · base: \`$BASE\` · dry-run: \`$DRY_RUN\` · merge-ready: \`$MERGE_READY\`"
  echo
  echo "## Updated (clean merge of \`$BASE\`)"
  if [[ ${#UPDATED[@]} -eq 0 ]]; then echo "_None_"; else printf '%s\n' "${UPDATED[@]}" | sed 's/^/- /'; fi
  echo
  echo "## Conflicts (need human)"
  if [[ ${#CONFLICTED[@]} -eq 0 ]]; then echo "_None_"; else printf '%s\n' "${CONFLICTED[@]}" | sed 's/^/- /'; fi
  echo
  echo "## Squash-merged"
  if [[ ${#MERGED[@]} -eq 0 ]]; then echo "_None_"; else printf '%s\n' "${MERGED[@]}" | sed 's/^/- /'; fi
  echo
  echo "## Skipped"
  if [[ ${#SKIPPED[@]} -eq 0 ]]; then echo "_None_"; else printf '%s\n' "${SKIPPED[@]}" | sed 's/^/- /'; fi
  echo
  echo "## Failed"
  if [[ ${#FAILED[@]} -eq 0 ]]; then echo "_None_"; else printf '%s\n' "${FAILED[@]}" | sed 's/^/- /'; fi
  echo
  echo "## Labels"
  echo "- Skip sync: \`$SKIP_LABEL\`"
  echo "- Skip automerge: \`$NO_MERGE_LABEL\`"
} >"$REPORT"

log "Done. Report → $REPORT"
log "updated=${#UPDATED[@]} conflicted=${#CONFLICTED[@]} merged=${#MERGED[@]} skipped=${#SKIPPED[@]} failed=${#FAILED[@]}"

# Also print summary to stdout
cat "$REPORT"

# Exit non-zero if conflicts remain (useful for CI awareness)
if [[ ${#CONFLICTED[@]} -gt 0 || ${#FAILED[@]} -gt 0 ]]; then
  exit 1
fi
exit 0
