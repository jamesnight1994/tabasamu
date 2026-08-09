#!/bin/sh
set -e

cd /app

# node_modules come from the image (not an empty named volume).
yarn prisma generate
echo "==> Applying migrations…"
yarn prisma migrate deploy
echo "==> Seeding…"
yarn prisma:seed

exec "$@"
