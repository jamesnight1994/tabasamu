# syntax=docker/dockerfile:1

ARG NODE_VERSION=20

# ---------- base ----------
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare yarn@4.10.3 --activate
ENV NEXT_TELEMETRY_DISABLED=1

# ---------- dependencies ----------
FROM base AS deps
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

# ---------- local development ----------
FROM base AS development
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.yarn ./.yarn
COPY package.json yarn.lock .yarnrc.yml ./
EXPOSE 3000
# Named volume for node_modules can be stale after npm→Yarn; reinstall on start.
CMD ["sh", "-c", "yarn install && yarn dev --hostname 0.0.0.0 --port 3000"]

# ---------- production build ----------
FROM base AS builder
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time placeholders only — real public config is injected at container start
# via TABASAMU_* → /runtime-env.js (Portainer-updatable without rebuild).
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_APP_ENV=staging
ARG NEXT_PUBLIC_ADAPTERS=mock
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_ANALYTICS_ENABLED=false
ARG NEXT_PUBLIC_LOG_LEVEL=info

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV \
    NEXT_PUBLIC_ADAPTERS=$NEXT_PUBLIC_ADAPTERS \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_ANALYTICS_ENABLED=$NEXT_PUBLIC_ANALYTICS_ENABLED \
    NEXT_PUBLIC_LOG_LEVEL=$NEXT_PUBLIC_LOG_LEVEL \
    NEST_API_URL=http://localhost:3001

RUN yarn build

# ---------- production runtime ----------
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY docker-entrypoint.prod.sh /usr/local/bin/docker-entrypoint.prod.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.prod.sh \
  && chown -R nextjs:nodejs /app/public

USER nextjs
EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.prod.sh"]
CMD ["node", "server.js"]
