#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[1/3] Pulling latest changes..."
git pull --ff-only

echo "[2/3] Rebuilding and restarting containers..."
docker compose up -d --build

echo "[3/3] Current status:"
docker compose ps

echo
echo "Done."
