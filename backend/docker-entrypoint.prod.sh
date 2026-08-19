#!/bin/sh
set -e
cd /app
yarn prisma migrate deploy
exec "$@"
