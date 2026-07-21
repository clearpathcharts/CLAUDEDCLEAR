#!/usr/bin/env bash
# Run grapheneX (host hardening UI) for the ClearPath backend server.
# Does NOT modify the ClearPath Node app. Bind to localhost only.
#
# Usage (on the ClearPath host):
#   ./scripts/ops/run-graphenex.sh
#   GRAPHENEX_PORT=9090 ./scripts/ops/run-graphenex.sh
#
# Then from your laptop:
#   ssh -L 9090:127.0.0.1:9090 user@clearpath-host
#   open http://127.0.0.1:9090

set -euo pipefail

IMAGE="${GRAPHENEX_IMAGE:-ghcr.io/graphenex/graphenex}"
HOST_BIND="${GRAPHENEX_BIND:-127.0.0.1}"
PORT="${GRAPHENEX_PORT:-9090}"

if ! command -v docker >/dev/null 2>&1; then
  echo "error: docker is required on the ClearPath host (or install graphenex via pip)." >&2
  echo "  pip: python3 -m pip install graphenex && python3 -m graphenex -w ${HOST_BIND}:${PORT}" >&2
  exit 1
fi

echo "==> ClearPath ops: starting grapheneX"
echo "    image : ${IMAGE}"
echo "    bind  : ${HOST_BIND}:${PORT} (localhost only — use SSH tunnel)"
echo "    note  : ClearPath app often uses :8080 — grapheneX must NOT steal that port"
echo ""
echo "After start, tunnel from your laptop:"
echo "  ssh -L ${PORT}:${HOST_BIND}:${PORT} user@<clearpath-host>"
echo ""

# --privileged is required by upstream for many harden modules.
# Network publish is localhost-only so the UI is not on the public internet.
exec docker run --rm -it \
  --name clearpath-graphenex \
  --privileged \
  -p "${HOST_BIND}:${PORT}:8080" \
  "${IMAGE}"
