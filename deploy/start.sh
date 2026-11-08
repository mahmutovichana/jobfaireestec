#!/usr/bin/env bash
set -euo pipefail
APP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE_BIN="${NODE_BIN:-node}"
mkdir -p "$APP_ROOT/var/run" "$APP_ROOT/var/log"
cd "$APP_ROOT/server"
start_one() {
  local name="$1" entry="$2" pidfile="$APP_ROOT/var/run/$1.pid"
  if [[ -f "$pidfile" ]] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
    echo "$name already running"; return
  fi
  nohup "$NODE_BIN" "$entry" >>"$APP_ROOT/var/log/$name.log" 2>&1 &
  echo "$!" > "$pidfile"
}
start_one web src/server.mjs
start_one worker src/worker.mjs
