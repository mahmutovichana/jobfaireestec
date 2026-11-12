#!/usr/bin/env bash
set -euo pipefail
APP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_ROOT"
node -e 'if(Number(process.versions.node.split(".")[0])<22)process.exit(1)'
npm ci
npm --prefix server ci
npm run check:independence
npm run build
npm run check:independence
cd server
npm run migrate
