#!/usr/bin/env bash
# Deploy Tabasamu prod stack on the current host (intended for the VM).
# Usage: yarn deploy:vm
#   or:  ./scripts/deploy-vm.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> git pull"
git pull origin main

echo "==> docker compose --prod up -d --build"
docker compose -f docker-compose.prod.yml up -d --build

echo "==> smoke"
./scripts/smoke-vm.sh

echo "==> deploy complete"
