# 59 · API Specification

The machine-readable contract is **`docs/openapi.yaml`** (OpenAPI 3.1, 61
operations across 20 tag groups). Open it in Swagger UI, Redoc, or Postman to
generate a client or a mock server. This document is the human-readable
companion: the conventions, the parts an OpenAPI file cannot express well, and
the cross-reference to the port each group implements.

> **Source of truth order:** `src/ports/index.ts` (types) → `openapi.yaml` (wire
> shapes) → this doc (rationale). If they disagree, the ports win.

---

## 1. Global conventions (apply to every endpoint)

- **Base path:** `/v1`. Host is a placeholder until deploy (doc 64).
- **Money:** `{ amount: <integer minor units>, currency: "KES", taxIncluded: <bool|null> }`. Never a float. `taxIncluded` is `null` until D-16.
- **Result convention:** expected domain failures return a structured body `{ kind, message, details? }` with a 4xx status; the frontend switches on `kind` and renders the matching state. Unexpected failures are 5xx with a generic, user-safe message.
- **Auth:** a server-set **httpOnly** session cookie (`ts_session`). **No token is ever returned in a response body** (D-55). An XSS-readable token is a stealable token, so there isn't one.
- **Idempotency:** `POST /checkout/order`, `POST /payments/mpesa/initiate`, and `POST /payments/card/session` **require** an `Idempotency-Key` header. A repeat with the same key returns the original outcome and performs no second side effect.
- **Pagination:** list endpoints take `?limit` (default 20, max 100) and `?cursor`; responses are `{ items, nextCursor }`. Cursor is opaque.
- **Validation:** the server re-runs the domain validators the client already ran. The client's validation is UX; the server's is the gate.
- **Totals are server-authoritative.** The client computes for display using the same domain rules; the server recomputes at order creation and is the source of truth.

## 2. Endpoint groups → port mapping

| Group (tag) | Port(s) in `src/ports` | Notes |
|---|---|---|
| Auth | `AuthService` | Sessions, reset, verify. Enumeration-safe. |
| Products | `ProductRepository`, `InventoryService` | Read path; safest to build first. |
| Collections | `CollectionRepository`, `BundleRepository` | Curated groups + preset bundles. |
| Search | `domain/catalogue/query` | Filter/sort/search. `siteSearch` flag off (D-48). |
| Cart | `CartRepository` | Guest carts allowed; zone settable from PDP. |
| Coupons | `CartRepository.applyDiscount`, `DiscountRepository` | Discount errors as `kind`. |
| Delivery | `DeliveryService` | Whole config, not just zones (D-21..26). |
| Checkout | `CheckoutService` | Revalidate before every payment; idempotent create. |
| Orders | `OrderRepository` | Support lookup by phone/M-PESA ref. |
| Customers/Addresses | `CustomerService`, `AddressService`, `PreferencesService` | Nairobi address shape; consent append-only. |
| Subscriptions | `SubscriptionService` | State only, no billing (D-09). |
| Payments-MPESA | `PaymentGateway` | Acknowledge ≠ success. |
| Payments-Card | `PaymentGateway` | Disabled until D-35. Provider-agnostic. |
| Refunds | `PaymentGateway.refund` | M-PESA = manual reversal. |
| Webhooks | `WebhookHandler` | **Backend-only.** Frontend never touches. |
| Admin/Reports/Uploads/Audit | admin adapter + RBAC | Permission-gated, audited. |

## 3. The parts that need prose (an OpenAPI file states shapes, not judgement)

### 3.1 Payment initiation returns an acknowledgement, not a result
`POST /payments/mpesa/initiate` responds `202` with `status: initiated|pending`.
It **cannot** report success — an STK push is accepted by Safaricom long before
the customer enters a PIN. Success is discovered via the callback and confirmed
by `GET /payments/mpesa/status/{providerRef}`. Building the UI to treat the 202
as "paid" is the classic Daraja bug; the type and the spec both forbid it. Full
detail: doc 60.

### 3.2 `manual_reconciliation` and `unknown` are first-class
A missing callback is not a failure. `Payment.status` can be `unknown` and
`Order.status` can be `manual_reconciliation`, meaning *we do not yet know
whether the money moved*. `POST /payments/mpesa/reconcile` (admin) is the
mechanism that resolves it. Never collapse `unknown` into `failed`.

### 3.3 Publishing is gated on resolved placeholders
`POST /admin/products/{id}/publish` must **refuse** (422) to publish a product
whose regulated `Pending` fields (ingredients/nutrition — D-05) are still
unresolved. The frontend enforces this in the admin UI; the backend must enforce
it authoritatively. A published PDP with invented nutrition is exactly what
NN-05 exists to prevent.

### 3.4 Order-status changes are transition-guarded
`PUT /admin/orders/{id}/status` must validate against the transition table
(`canTransition` in `domain/order`). An illegal jump (e.g. `delivered → paid`
from a duplicate callback) is a `422`, not a silent write.

### 3.5 Every admin mutation is audited
Product/inventory/order/content/refund mutations write an `AuditEvent`
server-side (doc 40). The audit log is append-only. The frontend cannot be
trusted to log; the backend must.

## 4. Error `kind` vocabulary (non-exhaustive, stable)

| Area | `kind` values |
|---|---|
| Stock | `insufficient`, `not_found`, `inactive` |
| Discount | `not_found`, `expired`, `min_not_met`, `not_applicable` |
| Delivery | `zone_not_found`, `unserviceable` |
| Auth | `invalid_credentials`, `email_taken`, `weak_password`, `expired_token`, `invalid_token` |
| Payment | `provider_rejected`, `timeout`, `unknown`, `not_supported` |
| Generic | `validation`, `forbidden`, `conflict`, `server` |

The frontend already renders a state for each of these. Return the right `kind`
and the UI does the right thing with no frontend change.

## 5. How to validate your implementation

1. Point `NEXT_PUBLIC_ADAPTERS=http` and `NEXT_PUBLIC_API_URL=<your API>`.
2. Implement the HTTP adapter methods (`src/adapters/http/`) to call these
   endpoints and map responses to the port return types.
3. Run the flow suite. **Gate G2 is green when it passes against `http` with no
   change above the adapter layer.** That is the definition of "the API is
   correct" — not that it matches this document, but that the UI built on the
   ports cannot tell the difference between your backend and the mock.
