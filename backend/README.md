# Tabasamu NestJS API

Lean ecommerce API (Phase 1: **product management**). Replaces Medusa for catalogue reads; no Medusa runtime in this package.

**Adding endpoints / features:** see [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Ports

| Service | Port |
|---|---|
| This API | **3001** |
| Next storefront | 3000 |
| Medusa (interim) | 9000 |

## Setup

```bash
cp .env.example .env
# Ensure Postgres is up (Compose): docker compose up -d postgres
# DATABASE_URL must use database `tabasamu` (not `medusa`)

yarn install
yarn prisma:migrate
yarn prisma:seed
yarn start:dev
```

## Endpoints (prefix `/v1`)

| Method | Path | Auth |
|---|---|---|
| GET | `/products?status=` | public |
| GET | `/products/:slugOrId` | public |
| GET | `/inventory/:variantId` | public |
| GET/POST | `/admin/products` | `X-Admin-Api-Key` |
| PUT | `/admin/products/:id` | `X-Admin-Api-Key` |
| POST | `/admin/products/:id/publish` | `X-Admin-Api-Key` |

## Docker Compose (dev)

```bash
# From repo root
docker compose -f docker-compose.dev.yml up --build
# or: yarn docker:dev
```

Services: `postgres` (:5435), `api` (:3001), `app` (:3000 with `NEXT_PUBLIC_ADAPTERS=http`).
