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

FROM deps AS builder
ENV NODE_ENV=production
COPY . .
RUN yarn build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3001
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.yarn ./.yarn
COPY package.json yarn.lock .yarnrc.yml ./
COPY prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.prod.sh /usr/local/bin/docker-entrypoint.prod.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.prod.sh
EXPOSE 3001
ENTRYPOINT ["docker-entrypoint.prod.sh"]
CMD ["node", "dist/main.js"]
