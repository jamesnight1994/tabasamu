# Contributing to the NestJS API

How to add endpoints and features to [`backend/`](./). Package manager: **Yarn only**.

## Contracts (read first)

| Layer | Source of truth |
|---|---|
| Storefront ports | [`frontend/src/ports/index.ts`](../frontend/src/ports/index.ts) |
| Wire shapes | [`docs/openapi.yaml`](../docs/openapi.yaml) · [`docs/59_API_Specification.md`](../docs/59_API_Specification.md) |
| Domain honesty | Pending / Unavailable fields — do not invent client-blocked facts (D-14 prices, D-05 nutrition, …) |

Align Nest DTOs with OpenAPI `/v1` and the ports the storefront already calls. Prefer matching the port, not Medusa Store payloads.

## Frontend integration (admin products)

Living docs = e2e suite [`test/admin-products.e2e-spec.ts`](./test/admin-products.e2e-spec.ts):

```bash
yarn test:e2e -- test/admin-products.e2e-spec.ts
```

- Base URL prefix: `/v1`
- Admin header: `X-Admin-Api-Key: <ADMIN_API_KEY>` (API key identity — no User table yet)
- Endpoints: `GET|POST /admin/products`, `PUT /admin/products/:id`, `POST /admin/products/:id/publish`
- Test DB: `E2E_DATABASE_URL` → `tabasamu_test` on Compose Postgres `:5437` (see `test/.env.e2e.example`)

## Layout

```
backend/
  prisma/schema.prisma      # lean schema (products / variants / images today)
  prisma/seed.ts
  src/
    main.ts                 # global prefix `v1`, ValidationPipe, CORS, listen 0.0.0.0
    app.module.ts           # register feature modules here
    prisma/                 # PrismaModule + PrismaService (global)
    auth/
      admin-api-key.guard.ts   # X-Admin-Api-Key for /admin/*
    products/               # ← reference feature module
      products.module.ts
      products.service.ts
      products.controller.ts        # public GET
      admin-products.controller.ts  # guarded writes
      product.mapper.ts
      dto/
    inventory/              # thin controller; can live under a feature module
```

## Checklist: add a feature

Copy the **products** module pattern. Do not invent a second architecture.

1. **Schema** — add models in `prisma/schema.prisma`, then:
   ```bash
   yarn prisma:migrate    # name the migration
   yarn prisma:generate
   ```
2. **Module files** under `src/<feature>/`:
   - `*.module.ts` — controllers + providers
   - `*.service.ts` — Prisma + business rules
   - `*.controller.ts` — public routes
   - `admin-*.controller.ts` — admin routes with `@UseGuards(AdminApiKeyGuard)`
   - `dto/*.ts` — `class-validator` + `class-transformer`
   - optional `*.mapper.ts` — DB row → OpenAPI / API shape
3. **Register** the module in `src/app.module.ts` (`imports: […]`).
4. **Auth**
   - Public store reads: no guard
   - Admin writes: `@UseGuards(AdminApiKeyGuard)`; clients send header `X-Admin-Api-Key` (= `ADMIN_API_KEY` env)
5. **HTTP shapes** — match OpenAPI; money = integer **minor units**; use Pending markers for unapproved commercial fields.
6. **Seed** — extend `prisma/seed.ts` when the feature needs baseline catalogue / config data.
7. **Storefront** (when a port is ready for this API):
   - Call Nest via [`frontend/src/adapters/http/api-client.ts`](../frontend/src/adapters/http/api-client.ts) (`nestFetch`)
   - Map responses in a dedicated mapper (see `map-nest-product.ts`)
   - Wire the port in [`frontend/src/adapters/http/index.ts`](../frontend/src/adapters/http/index.ts)
   - Keep mocks as the default for CI (`NEXT_PUBLIC_ADAPTERS=mock`)

## Reference implementation

| Concern | File |
|---|---|
| Public list / by slug | `src/products/products.controller.ts` |
| Admin CRUD + publish | `src/products/admin-products.controller.ts` |
| Service + Prisma | `src/products/products.service.ts` |
| API mapping | `src/products/product.mapper.ts` |
| Admin guard | `src/auth/admin-api-key.guard.ts` |
| Inventory read | `src/inventory/inventory.controller.ts` |

## Local run

**Host**

```bash
cp .env.example .env
yarn install
yarn prisma:migrate && yarn prisma:seed
yarn start:dev   # http://localhost:3001/v1/…
```

**Docker (lean stack — no Medusa)**

```bash
# from repo root
yarn docker:dev
# API :3001 · Postgres :5437 (user/pass/db tabasamu) · storefront :3000
```

If host `:3001` is busy: `NEST_HOST_PORT=3011 yarn docker:dev`.

See also [`README.md`](./README.md).

## Do not

- Import or embed Medusa (`@medusajs/*`) in this package
- Point `DATABASE_URL` at Medusa’s `medusa` database — use dedicated DB `tabasamu`
- Grow a Medusa-sized schema (regions, carts, payments modules) until that Nest phase is planned
- Return client-invented prices/nutrition as if approved — keep Pending / D-\* honesty
- Use npm / `package-lock.json` — Yarn only
