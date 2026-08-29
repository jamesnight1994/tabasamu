#!/usr/bin/env bash
# Start/stop Portainer only (service lives in docker-compose.dev.yml / docker-compose.prod.yml).
#
#   yarn portainer              # dev stack file, portainer service only
#   yarn portainer down
#   COMPOSE_FILE=docker-compose.prod.yml yarn portainer

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.dev.yml}"
COMPOSE=(docker compose -f "$COMPOSE_FILE")

cmd="${1:-}"
case "$cmd" in
  down | ps)
    shift
    exec "${COMPOSE[@]}" "$cmd" portainer "$@"
    ;;
  logs)
    shift
    exec "${COMPOSE[@]}" logs -f portainer "$@"
    ;;
  -h | --help | help)
    sed -n '2,7p' "$0" | sed 's/^# \{0,1\}//'
    exit 0
    ;;
  *)
    exec "${COMPOSE[@]}" up -d portainer "$@"
    ;;
esac
