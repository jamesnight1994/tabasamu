#!/usr/bin/env bash
# HTTP smoke checks against a running prod-style stack.
# Usage:
#   yarn smoke:vm
#   SMOKE_HOST=169.58.241.255 yarn smoke:vm
set -euo pipefail

HOST="${SMOKE_HOST:-127.0.0.1}"
FRONT="http://${HOST}:${SMOKE_FRONT_PORT:-3000}"
API="http://${HOST}:${SMOKE_API_PORT:-3001}"
ADMIN_KEY="${ADMIN_API_KEY:-dev-admin-key-change-me}"

echo "smoke: frontend $FRONT/"
curl -sf --connect-timeout 10 "$FRONT/" >/dev/null

echo "smoke: products $API/v1/products"
curl -sf --connect-timeout 10 "$API/v1/products" >/dev/null

echo "smoke: admin products (X-Admin-Api-Key)"
curl -sf --connect-timeout 10 \
  -H "X-Admin-Api-Key: ${ADMIN_KEY}" \
  "$API/v1/admin/products" >/dev/null

echo "smoke: ok"
