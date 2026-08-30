---
name: nestjs-backend
description: >-
  Load when planning, researching, or implementing NestJS API work in this repo
  (backend/ Prisma models, /v1 routes, admin API key guard, seeds, or storefront
  HTTP adapters pointed at Nest). REQUIRED for Nest backend features in ALL modes
  (planning, implementation, exploration). Do not use for Medusa under commerce/.
---

# NestJS backend (Tabasamu)

## Before writing code

1. **Read** [`backend/CONTRIBUTING.md`](../../../backend/CONTRIBUTING.md) end to end.
2. Treat these as contract sources of truth (ports win on conflict):
   - [`frontend/src/ports/index.ts`](../../../frontend/src/ports/index.ts)
   - [`docs/openapi.yaml`](../../../docs/openapi.yaml)
   - [`docs/59_API_Specification.md`](../../../docs/59_API_Specification.md)

## Reference pattern

Copy **`backend/src/products/`** — do not invent a second module style:

| Piece | Path |
|---|---|
| Module | `backend/src/products/products.module.ts` |
| Public controller | `backend/src/products/products.controller.ts` |
| Admin controller | `backend/src/products/admin-products.controller.ts` |
| Service | `backend/src/products/products.service.ts` |
| Mapper | `backend/src/products/product.mapper.ts` |
| DTOs | `backend/src/products/dto/` |
| Admin guard | `backend/src/auth/admin-api-key.guard.ts` |
| Prisma | `backend/prisma/schema.prisma`, `backend/src/prisma/` |

Register new modules in `backend/src/app.module.ts`. Global HTTP prefix is `v1` (`backend/src/main.ts`).

## Rules

- **Yarn only** — no npm / `package-lock.json` (see `.cursor/rules/package-manager-yarn.mdc`).
- **No Medusa in Nest** — do not depend on `@medusajs/*` inside `backend/`. Medusa stays under `commerce/` as interim.
- **Dedicated DB** — `tabasamu`, never the Medusa `medusa` database.
- **Lean schema** — do not add cart/checkout/payment tables until that Nest phase is explicitly planned.
- **Honesty** — Pending / D-\* markers for unapproved commercial data (especially D-14 prices); do not invent facts.
- **Admin writes** — `@UseGuards(AdminApiKeyGuard)` + header `X-Admin-Api-Key`.
- **Storefront** — when wiring ports, use `frontend/src/adapters/http/api-client.ts` (`nestFetch`) and a Nest-specific mapper; keep `NEXT_PUBLIC_ADAPTERS=mock` as CI default.

## Local verification

```bash
cd backend && yarn prisma:migrate && yarn prisma:seed && yarn start:dev
# or from repo root: yarn docker:compose up / yarn docker:dev
curl -s http://localhost:3001/v1/products
```
