# 71 · Nest product & admin API (frontend contract)

**Audience:** storefront / admin UI engineers wiring HTTP to the Nest API.  
**Implements:** [GitHub issue #7](https://github.com/jamesnight1994/tabasamu/issues/7).  
**Executable source of truth:** `backend/test/admin-products.e2e-spec.ts` (snapshots under `backend/test/__snapshots__/`).  
**Interactive:** Swagger at `http://localhost:3001/docs` (authorize with `admin-api-key`).

This document describes **what Nest actually exposes today** (Phase 1 catalogue). It is **not** the Phase 7 handover admin console (`docs/39_Admin_API_Contract.md`, cookie RBAC, audit). Those remain the long-term target; do not mix the two auth models.

---

## 1. Base URL and prefix

| Env | Typical value | Used by |
|---|---|---|
| Nest `PORT` | `3001` | API listen |
| Storefront `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Browser / `nestFetch` |
| Storefront `NEST_API_URL` | optional Docker override | Server-side Nest calls |

All routes below are under **`/v1`**. Example: `GET http://localhost:3001/v1/products`.

CORS is enabled (`origin: true`, `credentials: true`).

---

## 2. Auth

**Public catalogue** (`/v1/products`, `/v1/inventory/:variantId`): no auth.

**Admin** (`/v1/admin/*`): every request must send:

```http
X-Admin-Api-Key: <same value as backend ADMIN_API_KEY>
```

- There is **no staff login, User table, or session cookie** on Nest yet.
- Do **not** put the key in `NEXT_PUBLIC_*`. Call admin routes from a server-side route/handler only.
- Missing, empty, or wrong key → **401**:

```json
{
  "statusCode": 401,
  "message": "Invalid or missing X-Admin-Api-Key",
  "error": "Unauthorized"
}
```

If `ADMIN_API_KEY` is unset on the API, admin routes return 401 with `"ADMIN_API_KEY is not configured"`.

---

## 3. Status values and Pending fields

Product `status`: `draft` | `active` | `archived`. Create defaults to **`draft`**.

Many catalogue fields are **Pending** (honesty markers). Treat `available: false` as “do not display as real copy,” not as an empty string.

```ts
type Pending<T> =
  | { available: true; value: T }
  | { available: false; decision: string; note?: string };
```

| Field | When available | When unavailable |
|---|---|---|
| `descriptor` | DB string set | D-13 |
| `base` | DB string set | D-50 |
| `forwardNote` | DB string set | D-51 |
| `provenance`, `ingredients`, `nutrition`, `fermentationDays` | never (not stored yet) | D-49 / D-05 / D-52 |
| `variants[].price` | never as a sellable money object | D-14 (demo `priceAmount` is plumbing only) |

Money, when it exists on compare-at: `{ amount: integer minor units, currency: "KES", taxIncluded: null }`. Never a float.

List responses use `{ items, nextCursor }`. Cursor pagination is **not implemented**; `nextCursor` is always `null`.

---

## 4. Public catalogue

### `GET /v1/products`

Optional query: `status` = `draft` | `active` | `archived`. Invalid values are ignored (no filter).

**200:** `{ items: Product[], nextCursor: null }` ordered by `position` ascending.

### `GET /v1/products/:slugOrId`

Looks up by **slug** first, then by **id**.

**200:** one `Product`. **404:** `{ statusCode, message, error }` Nest default.

### `GET /v1/inventory/:variantId`

**200:**

```json
{
  "variantId": "<id>",
  "onHand": 5,
  "reserved": 0,
  "available": 5,
  "lowStockThreshold": {
    "available": false,
    "decision": "D-27",
    "note": "Low-stock threshold has not been supplied."
  },
  "policy": "deny",
  "nextBatch": null
}
```

**404** if the variant id does not exist.

---

## 5. Admin products

All require `X-Admin-Api-Key`.

### `GET /v1/admin/products`

Same list shape as public `GET /v1/products` (optional `?status=`). Includes drafts.

**200:** `{ items: Product[], nextCursor: null }`.

### `POST /v1/admin/products`

Creates a product. Default `status` is `draft`. Duplicate `slug` → **409** (`Slug already exists: …`). Extra JSON keys → **400** (`forbidNonWhitelisted`). Missing `slug`/`name` → **400**.

Success is **201** (Nest default for POST; clients should also accept **200**).

**Required body:** `slug` (string), `name` (string).

**Optional body:**

| Field | Type | Default / notes |
|---|---|---|
| `id` | string | server cuid if omitted |
| `flavour` | string | `name` |
| `position` | int | `0` |
| `status` | enum | `draft` |
| `subscriptionEligible` | boolean | `true` |
| `descriptor` | string \| null | |
| `base` | string \| null | |
| `forwardNote` | string \| null | |
| `seo` | object \| null | |
| `variants` | array | see below |
| `images` | array | see below |

**Variant object**

| Field | Required | Default |
|---|---|---|
| `sku` | yes | |
| `id` | no | cuid |
| `sizeCode` | no | `1L` |
| `millilitres` | no | `1000` |
| `priceAmount` | no | `null` (integer minor units) |
| `currency` | no | `KES` |
| `compareAt` | no | `null` |
| `active` | no | `true` |
| `stockOnHand` | no | `0` |

**Image object**

| Field | Required | Default |
|---|---|---|
| `src` | yes | URL/path |
| `alt` | yes | |
| `width` / `height` | no | `800` / `1000` |
| `role` | no | `packshot` (`hero` \| `packshot` \| `lifestyle` \| `label` \| `process`) |
| `sortOrder` | no | array index |

Example:

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
  ],
  "images": [
    { "src": "/products/grape-ginger.png", "alt": "Grape Ginger 1L", "role": "packshot" }
  ]
}
```

Response is a full `Product` (not wrapped). Variants/images are **create-only** on this endpoint; `PUT` cannot add them yet.

### `PUT /v1/admin/products/:id`

Partial update of **product fields only** (not nested variants/images).

Allowed: `name`, `flavour`, `position`, `status`, `subscriptionEligible`, `descriptor`, `base`, `forwardNote`, `seo`.

**200:** full `Product`. **404** if id missing.

### `POST /v1/admin/products/:id/publish`

Sets `status` to `active` only if **both** `descriptor` and `base` are non-empty in the database.

**200/201:** published `Product` (`status: "active"`).

**422** if required fields missing:

```json
{
  "message": "Cannot publish until required fields are set",
  "missing": ["descriptor (D-13)", "base (D-50)"]
}
```

Ingredients/nutrition (D-05) do **not** block publish in this Nest MVP.

**404** if id missing.

---

## 6. Product response shape

```json
{
  "id": "clxx…",
  "slug": "grape-ginger",
  "name": "Grape Ginger",
  "flavour": "Grape Ginger",
  "position": 0,
  "subscriptionEligible": true,
  "descriptor": { "available": true, "value": "Caffeine Free" },
  "base": { "available": true, "value": "Rooibos" },
  "forwardNote": { "available": false, "decision": "D-51", "note": "…" },
  "provenance": { "available": false, "decision": "D-49", "note": "…" },
  "ingredients": { "available": false, "decision": "D-05", "note": "…" },
  "nutrition": { "available": false, "decision": "D-05", "note": "…" },
  "fermentationDays": { "available": false, "decision": "D-52", "note": "…" },
  "strip": { "color": "#4A2A55", "label": "GRAPE GINGER" },
  "images": [{ "url": "…", "alt": "…", "width": 800, "height": 1000, "role": "packshot" }],
  "seo": null,
  "status": "draft",
  "variants": [
    {
      "id": "clxx…",
      "productId": "clxx…",
      "sku": "TS-GG-1L",
      "size": { "code": "1L", "millilitres": 1000, "label": "1 Litre" },
      "price": {
        "available": false,
        "decision": "D-14",
        "note": "Retail prices are not client-approved yet. Demo amounts are plumbing only."
      },
      "compareAtPrice": null,
      "active": true,
      "stockOnHand": 5
    }
  ]
}
```

`strip` is derived from known flavour slugs; unknown slugs get `#2C2A29` and an uppercased name.

Image **request** field is `src`; **response** field is `url`.

---

## 7. Error cheat sheet

| HTTP | When |
|---|---|
| 400 | Validation (missing required, extra keys, wrong types) |
| 401 | Admin key missing/wrong |
| 404 | Product or variant not found |
| 409 | Duplicate product slug on create |
| 422 | Publish blocked (`message` + `missing`) |

---

## 8. What this API does **not** do yet

- Staff sessions, RBAC, or audit log (`docs/39`, `docs/38`, `docs/40`)
- Admin inventory adjust, orders, customers, uploads, reports
- Update/replace variants or images after create
- Cursor pagination (`nextCursor` always `null`)
- Cart, checkout, payments (still Medusa / later Nest phases)

---

## 9. How to verify

```bash
cd backend
yarn start:dev
# Swagger: http://localhost:3001/docs

# Executable contract (Compose Postgres :5437, database tabasamu_test):
yarn test:e2e -- test/admin-products.e2e-spec.ts
```

Storefront HTTP catalogue: `NEXT_PUBLIC_ADAPTERS=http` and `NEXT_PUBLIC_API_URL=http://localhost:3001` (`frontend/src/adapters/http/api-client.ts`).
