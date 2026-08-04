#!/usr/bin/env bash
# Merge + vendor disposable email domain lists from:
#   1) https://github.com/disposable/disposable-email-domains
#   2) https://github.com/disposable-email-domains/disposable-email-domains
#   3) https://github.com/sajjadh47/disposable-email-domains-list
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/data/disposable-email-domains.txt"

URL_DISPOSABLE="https://raw.githubusercontent.com/disposable/disposable-email-domains/master/domains.txt"
URL_DED="https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf"
URL_SAJJAD="https://raw.githubusercontent.com/sajjadh47/disposable-email-domains-list/master/domains.txt"

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

fetch() {
  local url="$1"
  local dest="$2"
  echo "Fetching $url ..."
  curl -fsSL "$url" -o "$dest"
  local lines
  lines="$(grep -cve '^[[:space:]]*$' "$dest" || true)"
  if [[ "${lines:-0}" -lt 100 ]]; then
    echo "Refusing: $url returned only ${lines} lines." >&2
    exit 1
  fi
  echo "  -> ${lines} lines"
}

fetch "$URL_DISPOSABLE" "$tmp_dir/disposable.txt"
fetch "$URL_DED" "$tmp_dir/ded.conf"
fetch "$URL_SAJJAD" "$tmp_dir/sajjad.txt"

# Normalize: lowercase, strip comments/blank, drop @ prefix if present, sort -u
merged="$tmp_dir/merged.txt"
{
  cat "$tmp_dir/disposable.txt" "$tmp_dir/ded.conf" "$tmp_dir/sajjad.txt"
} | tr '[:upper:]' '[:lower:]' \
  | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//' \
  | sed -E '/^$/d; /^#/d; /^\/\//d' \
  | sed -E 's/^@+//' \
  | grep -E '^[a-z0-9._-]+\.[a-z0-9.-]+$' \
  | sort -u > "$merged"

count="$(wc -l < "$merged" | tr -d ' ')"
if [[ "${count:-0}" -lt 1000 ]]; then
  echo "Refusing to overwrite: merged list has only ${count} domains." >&2
  exit 1
fi

{
  echo "# Vendored disposable email domain blocklist (merged)"
  echo "# Sources:"
  echo "#   - $URL_DISPOSABLE"
  echo "#   - $URL_DED"
  echo "#   - $URL_SAJJAD"
  echo "# Updated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "# Domains: $count"
  echo "#"
  cat "$merged"
} > "$OUT"

echo "Wrote $OUT ($count unique domains)"
