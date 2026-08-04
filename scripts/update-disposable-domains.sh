#!/usr/bin/env bash
# Refresh vendored disposable email domain list from:
# https://github.com/disposable/disposable-email-domains
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/data/disposable-email-domains.txt"
URL="https://raw.githubusercontent.com/disposable/disposable-email-domains/master/domains.txt"

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

echo "Fetching $URL ..."
curl -fsSL "$URL" -o "$tmp"

lines="$(grep -cve '^[[:space:]]*$' "$tmp" || true)"
if [[ "${lines:-0}" -lt 1000 ]]; then
  echo "Refusing to overwrite: fetched list has only ${lines} lines (expected thousands)." >&2
  exit 1
fi

{
  echo "# Vendored from disposable/disposable-email-domains"
  echo "# Source: $URL"
  echo "# Updated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "#"
  cat "$tmp"
} > "$OUT"

echo "Wrote $OUT ($lines domains)"
