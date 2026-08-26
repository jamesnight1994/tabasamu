#!/usr/bin/env bash
# Tabasamu lean stack (docker-compose.dev.yml).
#
# Usage (from repo root via package.json):
#   yarn docker:dev                 # up (all services)
#   yarn docker:dev --build         # up --build
#   yarn docker:dev app             # up only app
#   yarn docker:dev restart app     # restart storefront
#   yarn docker:dev restart api     # restart Nest
#   yarn docker:dev down            # stop stack
#   yarn docker:dev logs app        # follow logs
#   yarn docker:dev ps

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f docker-compose.dev.yml)

cmd="${1:-}"
case "$cmd" in
  restart | down | ps)
    shift
    exec "${COMPOSE[@]}" "$cmd" "$@"
    ;;
  logs)
    shift
    exec "${COMPOSE[@]}" logs -f "$@"
    ;;
  build)
    # Convenience alias: yarn docker:dev build [service...]
    shift
    exec "${COMPOSE[@]}" up --build "$@"
    ;;
  -h | --help | help)
    sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'
    exit 0
    ;;
  *)
    # Default: up, forwarding flags/services (e.g. --build, app, api)
    exec "${COMPOSE[@]}" up "$@"
    ;;
esac
