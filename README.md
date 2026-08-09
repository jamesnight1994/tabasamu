# Tabasamu Sips — Ecommerce

Premium caffeine-free rooibos kombucha, brewed in Nairobi. Six flavours, 1 Litre.

**Status:** feature-complete, release-ready **storefront** under [`front-end/`](front-end/). NestJS **product API (Phase 1)** under [`backend/`](backend/). Medusa remains in [`commerce/`](commerce/) as the interim engine for cart/auth until later Nest phases.

> **Backend developer? Start with [`docs/56_START_HERE_Backend_Developer.md`](docs/56_START_HERE_Backend_Developer.md).**

---

## Repo layout

| Path | Role | Port |
|---|---|---|
| [`front-end/`](front-end/) | Next.js 15 storefront | **3000** |
| [`backend/`](backend/) | NestJS product API (Phase 1) | **3001** |
| [`commerce/`](commerce/) | Medusa v2 (interim) | **9000** |

Root `package.json` only orchestrates scripts into those packages.

## Quick start — storefront

```bash
corepack enable
cd front-end
yarn install
cp .env.example .env.local
yarn dev                     # http://localhost:3000 (mock adapters)
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
yarn start:dev                # http://localhost:3001/v1/products
```

From repo root: `yarn back:dev` · `yarn back:seed`

### Docker (lean Nest stack — no Medusa)

```bash
yarn docker:dev
# Storefront http://localhost:3000 · Nest http://localhost:3001/v1/products
# Postgres localhost:5435 (user/pass/db: tabasamu)
```

Stop with `yarn docker:dev:down`. Medusa stack remains `docker compose up` (separate file).

## Verification (storefront)

```bash
cd front-end
yarn verify   # lint + typecheck + contrast + brand + tests
yarn build
```

## Architecture (storefront)

Hexagonal / ports-and-adapters under `front-end/src`. UI depends on **typed ports**, satisfied today by **mock adapters**; switch with `NEXT_PUBLIC_ADAPTERS=http` and `NEXT_PUBLIC_API_URL=http://localhost:3001` for the Nest product API (cart/auth still stub/Medusa until later phases).

## Commands (root)

| Command | Does |
|---|---|
| `yarn front:dev` / `front:build` / `front:verify` | Storefront |
| `yarn back:dev` / `back:build` / `back:seed` | NestJS API |
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
# Publishable key → front-end/.env.local as NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
```

**Docker smoke** (Postgres + Redis + Medusa + Next):

```bash
cp front-end/.env.example front-end/.env.local
cp commerce/apps/backend/.env.example commerce/apps/backend/.env
docker compose up --build
# Storefront http://localhost:3000 · Medusa http://localhost:9000 (/app)
```

**Vercel:** set project Root Directory to `front-end`.

## Brand logo assets

Approved artwork: **`front-end/public/brand/approved/`**. Render via the `Logo` component only. Brand lint: `yarn --cwd front-end lint:brand`.

## Documentation

All handover docs are in [`docs/`](docs). Key entry: **[56 · START HERE](docs/56_START_HERE_Backend_Developer.md)**.

## Honesty rules

- **No secret in frontend code** — server-only, bundle-scanned. [NN-03]
- **Nothing claimed operational until connected and tested.** [NN-04]
- **No business fact invented** — unconfirmed copy uses decision-linked placeholders. [NN-05]
