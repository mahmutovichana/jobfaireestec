#!/usr/bin/env bash
set -euo pipefail
APP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
for name in web worker; do
  file="$APP_ROOT/var/run/$name.pid"
  [[ -f "$file" ]] || continue
  pid="$(cat "$file")"
  [[ "$pid" =~ ^[0-9]+$ ]] || { echo 'Invalid PID'; exit 1; }
  if kill -0 "$pid" 2>/dev/null; then
    # Refuse to signal an unrelated process after a stale PID file.
    cwd="$(readlink -f "/proc/$pid/cwd")"
    [[ "$cwd" == "$APP_ROOT/server" ]] || { echo 'Unexpected process directory'; exit 1; }
    kill -TERM "$pid"
    for _ in {1..30}; do kill -0 "$pid" 2>/dev/null || break; sleep 1; done
    if kill -0 "$pid" 2>/dev/null; then echo 'Process still running; inspect it before restarting'; exit 1; fi
  fi
  rm -f -- "$file"
done
