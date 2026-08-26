# Tabasamu Sips — Ecommerce

Premium caffeine-free rooibos kombucha, brewed in Nairobi. Six flavours, 1 Litre.

**Status:** feature-complete, release-ready **storefront** under [`frontend/`](frontend/). NestJS **product API (Phase 1)** under [`backend/`](backend/). Medusa remains in [`commerce/`](commerce/) as the interim engine for cart/auth until later Nest phases.

> **Backend developer? Start with [`docs/56_START_HERE_Backend_Developer.md`](docs/56_START_HERE_Backend_Developer.md).**

---

## Repo layout

| Path | Role | Port |
|---|---|---|
| [`frontend/`](frontend/) | Next.js 15 storefront | **3000** |
| [`backend/`](backend/) | NestJS product API (Phase 1) | **3001** |
| [`commerce/`](commerce/) | Medusa v2 (interim) | **9000** |

Root `package.json` only orchestrates scripts into those packages.

## Quick start — storefront

```bash
corepack enable
cd frontend
yarn install
cp .env.example .env.local
# For Nest catalogue: NEXT_PUBLIC_ADAPTERS=http and NEXT_PUBLIC_API_URL=http://localhost:3001
yarn dev                     # http://localhost:3000
```

From repo root:

```bash
yarn front:dev
yarn front:verify
```

## Quick start — NestJS API

```bash
cd backend
yarn install
cp .env.example .env          # PORT=3001, DATABASE_URL → tabasamu DB, ADMIN_API_KEY
# docker compose up -d postgres   # if needed; create DB tabasamu once
yarn prisma:migrate
yarn prisma:seed
yarn start:dev                # http://localhost:3001/v1/products · Swagger /docs
```

From repo root: `yarn back:dev` · `yarn back:seed`

**Adding Nest endpoints:** [`backend/CONTRIBUTING.md`](backend/CONTRIBUTING.md). **Product / admin HTTP contract for the frontend:** [`docs/71_Nest_Product_Admin_API.md`](docs/71_Nest_Product_Admin_API.md).

### Docker — Nest + storefront

```bash
yarn docker:dev          # hot reload, Postgres :5437
yarn docker:prod         # production images, Postgres :5436
# Storefront http://localhost:3000 · Nest http://localhost:3001
```

Stop with `yarn docker:dev:down` / `yarn docker:prod:down`. Medusa stack remains `docker compose up` (separate file).

## Verification (storefront)

```bash
cd frontend
yarn verify   # lint + typecheck + contrast + brand + tests
yarn build
```

## Architecture (storefront)

Hexagonal / ports-and-adapters under `frontend/src`. UI depends on **typed ports**, satisfied today by **mock adapters**; switch with `NEXT_PUBLIC_ADAPTERS=http` and `NEXT_PUBLIC_API_URL=http://localhost:3001` for the Nest product API (cart/auth still stub/Medusa until later phases).

## Commands (root)

| Command | Does |
|---|---|
| `yarn front:dev` / `front:build` / `front:verify` | Storefront (`frontend/`) |
| `yarn back:dev` / `back:build` / `back:seed` | NestJS API |
| `yarn docker:dev` / `docker:prod` | Nest + Postgres + Next |
| `yarn medusa …` · `commerce:*` | Medusa under `commerce/` |
| `yarn docker …` | Run a package.json script inside Docker Compose |

## Commerce (Medusa v2)

Medusa lives under [`commerce/`](commerce/).

```bash
cd commerce && yarn install
cp apps/backend/.env.example apps/backend/.env
yarn backend:dev
yarn backend:seed
yarn medusa user -e admin@tabasamu.local -p '…'

docker compose up -d --build
yarn docker medusa user -e admin@tabasamu.local -p '…'
yarn docker commerce:seed
yarn docker -s app typecheck
# Publishable key → frontend/.env.local as NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
```

**Docker smoke** (Postgres + Redis + Medusa + Next):

```bash
cp frontend/.env.example frontend/.env.local
cp commerce/apps/backend/.env.example commerce/apps/backend/.env
docker compose up --build
# Storefront http://localhost:3000 · Medusa http://localhost:9000 (/app)
```

**Vercel:** set project Root Directory to `frontend`.

## Brand logo assets

Approved artwork: **`frontend/public/brand/approved/`**. Render via the `Logo` component only. Brand lint: `yarn --cwd frontend lint:brand`.

## Documentation

All handover docs are in [`docs/`](docs). Key entry: **[56 · START HERE](docs/56_START_HERE_Backend_Developer.md)**.

## Honesty rules

- **No secret in frontend code** — server-only, bundle-scanned. [NN-03]
- **Nothing claimed operational until connected and tested.** [NN-04]
- **No business fact invented** — unconfirmed copy uses decision-linked placeholders. [NN-05]
