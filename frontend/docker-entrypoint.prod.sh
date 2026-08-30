#!/bin/sh
# Write browser-readable runtime config from container env (Portainer-updatable).
# Recreate the container after editing env — no image rebuild required.
set -eu

APP_ENV="${TABASAMU_APP_ENV:-${NEXT_PUBLIC_APP_ENV:-production}}"
APP_URL="${TABASAMU_PUBLIC_APP_URL:-${NEXT_PUBLIC_APP_URL:-http://localhost:3000}}"
API_URL="${TABASAMU_PUBLIC_API_URL:-${NEXT_PUBLIC_API_URL:-}}"
ADAPTERS="${TABASAMU_ADAPTERS:-${NEXT_PUBLIC_ADAPTERS:-http}}"
ANALYTICS="${TABASAMU_ANALYTICS_ENABLED:-${NEXT_PUBLIC_ANALYTICS_ENABLED:-false}}"
LOG_LEVEL="${TABASAMU_LOG_LEVEL:-${NEXT_PUBLIC_LOG_LEVEL:-info}}"
MEDUSA_KEY="${TABASAMU_MEDUSA_PUBLISHABLE_KEY:-${NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY:-}}"

# Escape for embedding in a double-quoted JS string
js_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

OUT="${RUNTIME_ENV_PATH:-/app/public/runtime-env.js}"
mkdir -p "$(dirname "$OUT")"

cat > "$OUT" <<EOF
window.__TABASAMU__={appEnv:"$(js_escape "$APP_ENV")",appUrl:"$(js_escape "$APP_URL")",apiUrl:"$(js_escape "$API_URL")",adapters:"$(js_escape "$ADAPTERS")",analyticsEnabled:"$(js_escape "$ANALYTICS")",logLevel:"$(js_escape "$LOG_LEVEL")",medusaPublishableKey:"$(js_escape "$MEDUSA_KEY")"};
EOF

echo "runtime-env: wrote $OUT (appEnv=$APP_ENV adapters=$ADAPTERS)"
exec "$@"
