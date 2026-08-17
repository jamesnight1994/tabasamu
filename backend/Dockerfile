# syntax=docker/dockerfile:1
# NestJS API — local development image (Yarn 4 + Prisma)

ARG NODE_VERSION=20

FROM node:${NODE_VERSION}-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare yarn@4.10.3 --activate

FROM base AS deps
COPY package.json yarn.lock .yarnrc.yml ./
COPY prisma ./prisma
RUN yarn install --immutable \
  && yarn prisma generate

FROM base AS development
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.yarn ./.yarn
COPY package.json yarn.lock .yarnrc.yml ./
COPY prisma ./prisma
COPY docker-entrypoint.dev.sh /usr/local/bin/docker-entrypoint.dev.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.dev.sh
EXPOSE 3001
ENTRYPOINT ["docker-entrypoint.dev.sh"]
CMD ["yarn", "start:dev"]
