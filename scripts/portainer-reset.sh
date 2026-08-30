#!/usr/bin/env bash
# Wipe Portainer DB volume and recreate (fresh agent endpoint + admin bootstrap).
#
#   yarn portainer:reset
#   yarn portainer:reset --prod
#   COMPOSE_FILE=docker-compose.prod.yml yarn portainer:reset

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.dev.yml}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prod)
      COMPOSE_FILE="docker-compose.prod.yml"
      shift
      ;;
    -f | --file)
      case "${2:-}" in
        prod | production) COMPOSE_FILE="docker-compose.prod.yml" ;;
        dev | development) COMPOSE_FILE="docker-compose.dev.yml" ;;
        *) COMPOSE_FILE="${2:?}" ;;
      esac
      shift 2
      ;;
    -h | --help | help)
      sed -n '2,6p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "usage: yarn portainer:reset [--prod|-f prod|dev]" >&2
      exit 1
      ;;
  esac
done

COMPOSE=(docker compose -f "$COMPOSE_FILE")

PROJECT="${COMPOSE_PROJECT_NAME:-}"
if [[ -z "$PROJECT" ]]; then
  case "$COMPOSE_FILE" in
    *prod*) PROJECT="tabasamu-prod" ;;
    *) PROJECT="tabasamu-dev" ;;
  esac
fi

VOLUME="${PROJECT}_portainer_data"

echo "Stopping Portainer + agent (${COMPOSE_FILE})..."
"${COMPOSE[@]}" stop portainer portainer-agent 2>/dev/null || true
"${COMPOSE[@]}" rm -f portainer portainer-agent 2>/dev/null || true

if docker volume inspect "$VOLUME" >/dev/null 2>&1; then
  echo "Removing volume ${VOLUME}..."
  docker volume rm "$VOLUME"
else
  echo "Volume ${VOLUME} not found (already clean)."
fi

echo "Starting Portainer + agent..."
"${COMPOSE[@]}" up -d portainer-agent portainer

echo ""
echo "Portainer: https://localhost:${PORTAINER_HTTPS_PORT:-9443}"
if [[ "$COMPOSE_FILE" == *dev* ]]; then
  echo "Dev login: admin / tabasamu-dev"
fi
