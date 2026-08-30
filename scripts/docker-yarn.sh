#!/usr/bin/env bash
# Run a Yarn package.json script inside Docker Compose.
#
# Usage:
#   ./scripts/docker-yarn.sh <script> [args...]
#   ./scripts/docker-yarn.sh -s frontend|medusa <script> [args...]
#   yarn docker <script> [args...]
#
# Examples:
#   ./scripts/docker-yarn.sh medusa user -e admin@tabasamu.local -p 'secret'
#   ./scripts/docker-yarn.sh commerce:seed
#   ./scripts/docker-yarn.sh typecheck
#   ./scripts/docker-yarn.sh -s frontend test --run tests/unit/domain.test.ts
#
# Services must already be up: yarn docker:compose up -d
# (postgres/redis/medusa for Medusa scripts; frontend for storefront scripts)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f docker-compose.dev.yml)
SERVICE=""
TTY=(-it)

usage() {
  cat <<'EOF'
Run Yarn package.json scripts inside Docker Compose.

Usage:
  docker-yarn.sh [-s frontend|medusa|app] [-T] <script> [args...]
  yarn docker [-s frontend|medusa] [-T] <script> [args...]

Options:
  -s SERVICE   Force compose service (frontend | medusa). Default: auto from script.
               "app" is accepted as an alias for frontend.
  -T           Disable TTY (for CI / pipes).
  -h           Show this help.

Routing (when -s is omitted):
  medusa, commerce:*, user, seed, db:migrate  →  medusa container
  everything else                             →  frontend container

Medusa container runs scripts from commerce/apps/backend/package.json.
Frontend container runs scripts from the storefront package.json.
EOF
}

while getopts ':s:Th' opt; do
  case "$opt" in
    s) SERVICE="$OPTARG" ;;
    T) TTY=() ;;
    h) usage; exit 0 ;;
    \?) echo "Unknown option: -$OPTARG" >&2; usage >&2; exit 1 ;;
  esac
done
shift $((OPTIND - 1))

if [[ $# -lt 1 ]]; then
  usage >&2
  exit 1
fi

SCRIPT="$1"
shift

# Map root package.json aliases → backend script names inside the medusa image.
resolve_medusa_script() {
  case "$1" in
    medusa) echo "medusa" ;;
    commerce:dev) echo "dev" ;;
    commerce:seed|seed) echo "seed" ;;
    commerce:user|user) echo "user" ;;
    commerce:migrate|db:migrate) echo "db:migrate" ;;
    *) echo "$1" ;;
  esac
}

auto_service() {
  case "$1" in
    medusa|commerce:*|user|seed|db:migrate) echo medusa ;;
    *) echo frontend ;;
  esac
}

if [[ -z "$SERVICE" ]]; then
  SERVICE="$(auto_service "$SCRIPT")"
fi

# Legacy alias from when the service was named "app".
if [[ "$SERVICE" == "app" ]]; then
  SERVICE="frontend"
fi

if [[ "$SERVICE" != "frontend" && "$SERVICE" != "medusa" ]]; then
  echo "Service must be 'frontend' or 'medusa' (got: $SERVICE)" >&2
  exit 1
fi

if ! "${COMPOSE[@]}" ps --status running --services 2>/dev/null | grep -qx "$SERVICE"; then
  echo "Service '$SERVICE' is not running. Start the stack first:" >&2
  echo "  yarn docker:compose up -d --build" >&2
  exit 1
fi

if [[ "$SERVICE" == "medusa" ]]; then
  INNER="$(resolve_medusa_script "$SCRIPT")"
  # Backend WORKDIR is /workspace/apps/backend — yarn scripts live there.
  exec docker compose exec "${TTY[@]}" medusa yarn "$INNER" "$@"
else
  # Prefer the image's Yarn 4 (corepack prepare in Dockerfile). Fall back to enable.
  exec "${COMPOSE[@]}" exec "${TTY[@]}" frontend \
    sh -c 'command -v yarn >/dev/null || corepack enable; exec yarn "$@"' sh "$SCRIPT" "$@"
fi
