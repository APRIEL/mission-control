#!/usr/bin/env bash
set -euo pipefail

cd /home/ubuntu/.openclaw/workspace/mission-control

pkill -f "convex dev" || true
pkill -f "next dev" || true

nohup bash -lc 'cd /home/ubuntu/.openclaw/workspace/mission-control && npx convex dev' > /home/ubuntu/.openclaw/workspace/mission-control/.convex-dev.log 2>&1 &
nohup bash -lc 'cd /home/ubuntu/.openclaw/workspace/mission-control && npm run dev' > /home/ubuntu/.openclaw/workspace/mission-control/.next-dev.log 2>&1 &

echo "mc dev restart started"
