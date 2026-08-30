#!/usr/bin/env bash
# Forward to docker compose with the Tabasamu compose file (dev by default).
#
# Usage:
#   yarn docker:compose up
#   yarn docker:compose up -d portainer-agent portainer
#   yarn docker:compose logs -f api
#   yarn docker:compose restart app
#   yarn docker:compose down
#   yarn docker:compose --prod up -d --build
#   yarn docker:compose -f prod ps
#
# File selection (first flags only):
#   --prod | -f prod | -f docker-compose.prod.yml  → docker-compose.prod.yml
#   default                                       → docker-compose.dev.yml

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FILE="docker-compose.dev.yml"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prod)
      FILE="docker-compose.prod.yml"
      shift
      ;;
    -f | --file)
      if [[ $# -lt 2 ]]; then
        echo "error: $1 requires a value (dev|prod|path)" >&2
        exit 1
      fi
      case "$2" in
        prod | production) FILE="docker-compose.prod.yml" ;;
        dev | development) FILE="docker-compose.dev.yml" ;;
        *) FILE="$2" ;;
      esac
      shift 2
      ;;
    -h | --help | help)
      sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      break
      ;;
  esac
done

if [[ $# -eq 0 ]]; then
  echo "usage: yarn docker:compose [--prod|-f prod|dev] <compose-args...>" >&2
  echo "example: yarn docker:compose up -d portainer-agent portainer" >&2
  exit 1
fi

exec docker compose -f "$FILE" "$@"
