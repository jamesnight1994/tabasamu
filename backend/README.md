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

## Swagger UI

With the API running (`yarn start:dev` or Compose `backend-api` on **3001**):

| | URL |
|---|---|
| UI | http://localhost:3001/docs |
| OpenAPI JSON | http://localhost:3001/docs-json |
| OpenAPI YAML | http://localhost:3001/docs-yaml |

Authorize admin routes in the UI with the `admin-api-key` scheme (`X-Admin-Api-Key` = your `ADMIN_API_KEY`).

## Endpoints (prefix `/v1`)

| Method | Path | Auth |
|---|---|---|
| GET | `/products?status=` | public |
| GET | `/products/:slugOrId` | public |
| GET | `/inventory/:variantId` | public |
| GET/POST | `/admin/products` | `X-Admin-Api-Key` |
| PUT | `/admin/products/:id` | `X-Admin-Api-Key` |
| POST | `/admin/products/:id/publish` | `X-Admin-Api-Key` |

## Frontend integration

Full request/response contract: [`docs/71_Nest_Product_Admin_API.md`](../docs/71_Nest_Product_Admin_API.md).

Storefront already talks to this API via [`frontend/`](../frontend/) `nestFetch` (`NEXT_PUBLIC_API_URL` / `NEST_API_URL`, default `http://localhost:3001`). Paths below are relative to that origin; the client adds the `/v1` prefix.

### Public catalogue (no auth)

| Method | Path | Notes |
|---|---|---|
| `GET` | `/v1/products` | Optional `?status=draft\|active\|archived`. Response: `{ items, nextCursor }` |
| `GET` | `/v1/products/:slugOrId` | Single product |
| `GET` | `/v1/inventory/:variantId` | Stock snapshot for a variant |

### Admin products (API key)

There is **no User / session login** yet. Admin identity is a shared secret:

```http
X-Admin-Api-Key: <same value as backend ADMIN_API_KEY>
```

| Env | Where |
|---|---|
| `ADMIN_API_KEY` | Backend `.env` (required for `/v1/admin/*`) |
| Admin client | Send the same value on every admin request (server-side only — do not put the key in `NEXT_PUBLIC_*`) |

Missing or wrong key → **401**.

| Method | Path | Body / behaviour |
|---|---|---|
| `GET` | `/v1/admin/products` | Optional `?status=…`. `{ items: Product[], nextCursor: null }` |
| `POST` | `/v1/admin/products` | Create; default `status` is `draft`. Returns the product |
| `PUT` | `/v1/admin/products/:id` | Partial update (`name`, `position`, `descriptor`, `base`, …) |
| `POST` | `/v1/admin/products/:id/publish` | Sets `status` to `active` if `descriptor` + `base` are set; else **422** with `{ message, missing }` |

**Create example** (shape the admin UI should send):

```json
{
  "slug": "grape-ginger",
  "name": "Grape Ginger",
  "flavour": "Grape Ginger",
  "descriptor": "Caffeine Free",
  "base": "Rooibos",
  "variants": [
    {
      "sku": "TS-GG-1L",
      "sizeCode": "1L",
      "millilitres": 1000,
      "stockOnHand": 5,
      "priceAmount": 55000
    }
  ]
}
```

**Response fields** the UI should rely on: `id`, `slug`, `name`, `status` (`draft` \| `active` \| `archived`), `variants[]` (each with `id`, `sku`, `size`, `price`, `stockOnHand`). Several catalogue fields use Pending wrappers (`{ available, value }` or `{ available: false, decision, note }`) — treat unavailable as “not ready to show,” not as empty string.

### Executable contract

Prefer the e2e suite over this README when wiring the admin client:

```bash
# Postgres from yarn docker:compose up (host :5437). Once:
#   docker exec postgres psql -U tabasamu -d tabasamu -c 'CREATE DATABASE tabasamu_test;'
cp test/.env.e2e.example test/.env.e2e   # optional
yarn test:e2e -- test/admin-products.e2e-spec.ts
```

See [`test/admin-products.e2e-spec.ts`](./test/admin-products.e2e-spec.ts) for auth, CRUD, and publish **401 / 422 / active** cases.
## Docker Compose

```bash
# From repo root — storefront is frontend/
yarn docker:compose up                        # hot reload · Postgres :5437
yarn docker:compose --prod up --build         # production images · Postgres :5436
```

Services: `postgres`, `backend-api` (:3001), `frontend` (`frontend/` on :3000, `NEXT_PUBLIC_ADAPTERS=http`).
