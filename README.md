# Tabasamu Sips — Ecommerce

Premium caffeine-free rooibos kombucha, brewed in Nairobi. Six flavours, 1 Litre.

**Status:** feature-complete, release-ready **frontend**, awaiting a backend. Runs
entirely on in-memory mock adapters. 449 tests green, 51-route production build
clean, all 7 quality gates passing, no secrets in the bundle.

> **Backend developer? Start with [`docs/56_START_HERE_Backend_Developer.md`](docs/56_START_HERE_Backend_Developer.md).**
> It is the map to everything below.

---

## Quick start

```bash
corepack enable              # Yarn 4 via packageManager field
yarn install                 # exact locked install (Node 20+)
cp .env.example .env.local   # all placeholders; safe for local
yarn dev                     # http://localhost:3000 (mock adapters)
```

## Verification

```bash
yarn verify   # lint + typecheck + contrast + brand + tests
yarn build    # production build (51 routes)
```

All green is the state to preserve.

## Architecture in one paragraph

Hexagonal / ports-and-adapters. The UI depends on **typed interfaces**
(`src/ports`), never on implementations. Today those interfaces are satisfied by
**mock adapters** (`src/adapters/mock`); the production handover is a one-line
switch — `NEXT_PUBLIC_ADAPTERS=http` — to the **HTTP adapters** the backend
developer implements (`src/adapters/http`). The dependency rule (a component may
not import an adapter) is lint-enforced and fails the build if broken. Pure
business logic lives in `src/domain` with zero framework imports.

**The handover acceptance test (Gate G2):** the flow suite runs green against
**both** mock and http adapters with zero changes above the adapter layer.

## Stack

Next.js 15.5 (App Router) · React 19 · TypeScript 5 (strict) · Tailwind CSS 4 ·
Zod 4 · Radix UI · Vitest.

## Commands

| Command | Does |
|---|---|
| `yarn dev` | Dev server |
| `yarn build` / `yarn start` | Production build / serve |
| `yarn lint` · `yarn typecheck` | Static checks + import boundaries |
| `yarn lint:brand` · `lint:contrast` · `lint:secrets` | Brand, WCAG AA, secret-scan gates |
| `yarn test` · `test:coverage` · `test:e2e` | Vitest suite · coverage · Playwright |
| `yarn verify` | The gate bundle |
| `yarn medusa …` | Medusa CLI on the host (proxies into `commerce/`) |
| `yarn docker …` | Run a package.json script inside Docker Compose |

## Commerce (Medusa v2)

Medusa lives under [`commerce/`](commerce/) as a **Yarn 4** workspace (`apps/backend`). The storefront root is Yarn 4 as well (`packageManager: yarn@4.10.3`).

```bash
# Backend deps + seed (from commerce/)
cd commerce
yarn install
cp apps/backend/.env.example apps/backend/.env   # DATABASE_URL, REDIS_URL, secrets
yarn backend:dev                                  # http://localhost:9000 — Admin UI: /app
yarn backend:seed                                 # Kenya / KES, six flavours, Nairobi demo shipping
yarn medusa user -e admin@tabasamu.local -p '…'   # create Admin login (or yarn backend:user …)

# Same Medusa CLI from the repo root (host Yarn → commerce):
yarn medusa user -e admin@tabasamu.local -p '…'

# Preferred: run package.json scripts inside Docker (no host Medusa/Postgres):
docker compose up -d --build
yarn docker medusa user -e admin@tabasamu.local -p '…'
yarn docker commerce:seed
yarn docker -s app typecheck
# Copy the logged publishable key into root .env.local as NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
```

**Adapter switch (Gate G2):**

| `NEXT_PUBLIC_ADAPTERS` | Behaviour |
|---|---|
| `mock` (default) | In-memory fixtures — design + CI without Medusa |
| `http` | Medusa Store API via `src/adapters/http` (`NEXT_PUBLIC_API_URL`, publishable key) |

**Docker smoke** (Postgres + Redis + Medusa + Next):

```bash
cp .env.example .env.local
cp commerce/apps/backend/.env.example commerce/apps/backend/.env
docker compose up --build
# Storefront http://localhost:3000 · Medusa http://localhost:9000 (/app for Admin)
# After seed, set NEXT_PUBLIC_ADAPTERS=http and NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY, recreate `app`.
```

Storefront verify stays at the repo root: `yarn typecheck` · `yarn test` (mock adapters).

## Brand logo assets

Approved logo artwork lives in **`public/brand/approved/`**
(`tabasamu-full-logo.png`, `tabasamu-monogram.svg`,
`tabasamu-monogram-white.svg`, plus the derived favicon / apple-touch / manifest
icon set and the `og-default.png` social card). Verbatim approved sources are kept
in `public/brand/_reference/`.

Render via the `Logo` component only — `variant="full" | "monogram"`,
`tone="light" | "dark"`. The full logo is light-surface only; dark surfaces use
the white monogram (there is no reversed full lockup). The brand lint
(`yarn lint:brand`) fails the build on obsolete assets, unsupported
variants/tone, CSS filters/crops/rotation on logos, and a full logo on a dark
surface. See **`docs/logo-remediation/HANDOVER.md`** for how to add new
placements.

## Documentation

All handover documentation is in [`docs/`](docs). Key entry points:

- **[56 · START HERE](docs/56_START_HERE_Backend_Developer.md)** — backend onboarding
- **[57 · System Architecture](docs/57_System_Architecture.md)**
- **[58 · Data Dictionary](docs/58_Data_Dictionary.md)** · **[59 · API Spec](docs/59_API_Specification.md)** + [`openapi.yaml`](docs/openapi.yaml)
- **[60 · M-PESA Guide](docs/60_MPESA_Payment_Guide.md)** · **[61 · Stripe/Card Guide](docs/61_Stripe_Card_Payment_Guide.md)**
- **[62 · Admin Guide](docs/62_Admin_Guide.md)** · **[63 · Content & Placeholder Register](docs/63_Content_and_Placeholder_Register.md)**
- **[64 · Operations & Deployment](docs/64_Operations_and_Deployment.md)**
- **[68 · Known Issues](docs/68_Known_Issues.md)** · **[69 · Handover Checklist](docs/69_Handover_Checklist.md)**
- **[08 · Client Decisions Register](docs/08_Client_Decisions_Register.md)** — what the client still owes

## The honesty rules (they govern the whole codebase)

- **No secret in frontend code** — all `.env` placeholders, server-only, bundle-scanned. [NN-03]
- **Nothing claimed operational until connected and tested** — the http adapter throws rather than faking. [NN-04]
- **No business fact invented** — unconfirmed prices, nutrition, delivery rules, and legal copy render as visible "awaiting confirmation" placeholders tied to a decision ID. [NN-05]

## What is not built (and why)

Subscriptions (D-09), card payments (D-35), build-a-box (D-06), site search
(D-48 — deliberately omitted), and real prices/nutrition/delivery/legal copy are
blocked on client decisions and gated behind feature flags. See docs 63 and 08.
