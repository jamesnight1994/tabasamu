#!/usr/bin/env bash
# SSH into the Tabasamu server.
#
# Usage:
#   yarn server:ssh
#   yarn server:ssh -- --password 'your-pass'
#   yarn server:ssh -- -p 'your-pass' -- ls -la
#   yarn server:ssh -- --user otheruser
#
# Password (pick one; never commit):
#   - flag:  --password / -p  (one-off; visible in shell history)
#   - file:  TABASAMU_SSH_PASSWORD in gitignored .env.ssh (copy from .env.ssh.example)
#   - omit:  SSH prompts interactively
#
# Defaults: host 169.58.241.255, user Owaga

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
fi

HOST="${TABASAMU_SSH_HOST:-169.58.241.255}"
USER="${TABASAMU_SSH_USER:-Owaga}"
PORT="${TABASAMU_SSH_PORT:-22}"
PASSWORD="${TABASAMU_SSH_PASSWORD:-}"
REMOTE_CMD=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    -p | --password)
      if [[ $# -lt 2 ]]; then
        echo "error: $1 requires a value" >&2
        exit 1
      fi
      PASSWORD="$2"
      shift 2
      ;;
    -u | --user)
      if [[ $# -lt 2 ]]; then
        echo "error: $1 requires a value" >&2
        exit 1
      fi
      USER="$2"
      shift 2
      ;;
    -h | --help)
      sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    --)
      shift
      REMOTE_CMD=("$@")
      break
      ;;
    -*)
      echo "error: unknown option: $1" >&2
      exit 1
      ;;
    *)
      REMOTE_CMD=("$@")
      break
      ;;
  esac
done

SSH_OPTS=(-p "$PORT" -o StrictHostKeyChecking=accept-new)
if [[ -n "${TABASAMU_SSH_KEY:-}" ]]; then
  SSH_OPTS+=(-i "${TABASAMU_SSH_KEY/#\~/$HOME}")
fi

TARGET="${USER}@${HOST}"

if [[ -n "$PASSWORD" ]]; then
  if ! command -v sshpass >/dev/null 2>&1; then
    echo "error: password auth needs sshpass (e.g. sudo apt install sshpass)" >&2
    exit 1
  fi
  export SSHPASS="$PASSWORD"
  if [[ ${#REMOTE_CMD[@]} -gt 0 ]]; then
    exec sshpass -e ssh "${SSH_OPTS[@]}" "$TARGET" "${REMOTE_CMD[@]}"
  else
    exec sshpass -e ssh -t "${SSH_OPTS[@]}" "$TARGET"
  fi
fi

if [[ ${#REMOTE_CMD[@]} -gt 0 ]]; then
  exec ssh "${SSH_OPTS[@]}" "$TARGET" "${REMOTE_CMD[@]}"
else
  exec ssh "${SSH_OPTS[@]}" "$TARGET"
fi
