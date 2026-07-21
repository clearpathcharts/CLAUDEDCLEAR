#!/usr/bin/env bash
# Keep ClearPath healthy while founder rests.
# Usage: bash scripts/keep-alive.sh
# Optional: KEEP_ALIVE_INTERVAL=180 PORT=3000 bash scripts/keep-alive.sh

set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p "$ROOT/data"
LOG="$ROOT/data/keep-alive.log"
PORT="${PORT:-3000}"
INTERVAL="${KEEP_ALIVE_INTERVAL:-180}"
PID_FILE="$ROOT/data/keep-alive-dev.pid"

log() {
  local line="[$(date -Iseconds)] $*"
  printf '%s\n' "$line" | tee -a "$LOG"
}

health_ok() {
  local body
  body="$(curl -sS --max-time 5 "http://127.0.0.1:${PORT}/api/health" 2>/dev/null || true)"
  [[ "$body" == *'"status":"healthy"'* ]] || [[ "$body" == *'"status": "healthy"'* ]]
}

kill_port() {
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${PORT}/tcp" >/dev/null 2>&1 || true
  elif command -v lsof >/dev/null 2>&1; then
    local pids
    pids="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
    if [[ -n "$pids" ]]; then
      # shellcheck disable=SC2086
      kill -9 $pids >/dev/null 2>&1 || true
    fi
  fi
  if [[ -f "$PID_FILE" ]]; then
    local old
    old="$(cat "$PID_FILE" 2>/dev/null || true)"
    if [[ -n "$old" ]] && kill -0 "$old" 2>/dev/null; then
      kill -9 "$old" >/dev/null 2>&1 || true
    fi
    rm -f "$PID_FILE"
  fi
}

start_app() {
  log "Starting npm run dev on port ${PORT}..."
  # Detach so this watcher can keep looping.
  nohup npm run dev >>"$ROOT/data/dev-server.log" 2>&1 &
  echo $! >"$PID_FILE"
  sleep 12
}

log "Keep-alive started (interval=${INTERVAL}s)."
if ! health_ok; then
  start_app
fi

while true; do
  if health_ok; then
    log "OK healthy"
  else
    log "UNHEALTHY — restarting"
    kill_port
    sleep 2
    start_app
  fi
  sleep "$INTERVAL"
done
