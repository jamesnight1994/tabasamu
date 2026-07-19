# Backend Endpoint Contracts — Phase 5

**Status:** The handover contract. The frontend calls exactly these operations through the `Adapters` port; the backend implements them behind `NEXT_PUBLIC_ADAPTERS=http`. [R-13, NN-06]

**Source of truth:** `src/ports/index.ts` and `src/domain/payment/contracts.ts`. This document is the human-readable map; the TypeScript is binding.

---

## 0. How the seam works

The frontend depends on **interfaces**, never implementations. Two implementations exist:

- `src/adapters/mock/*` — realistic, deliberately unreliable, used today.
- `src/adapters/http/*` — a Proxy stub where every method throws `NotImplemented`. **This is the backend developer's checklist**: make each method real, and the storefront works unchanged.

Switch with one env var. No component changes. The boundary lint fails the build if any component imports an adapter directly.

---

## 1. Products & inventory (read)

| Operation | Signature | Returns |
|---|---|---|
| `products.list()` | — | `Product[]` |
| `products.byId(id)` | `ProductId` | `Product \| null` |
| `inventory.forVariant(id)` | `VariantId` | `Inventory \| null` |

`Inventory` = `{ variantId, onHand, reserved, available, lowStockThreshold, policy }`. `available = onHand − reserved`; never negative.

---

## 2. Discounts

| Operation | Signature | Returns |
|---|---|---|
| `discounts.byCode(code)` | `string` | `Discount \| null` |

⛔ D-18/D-19 — no promotion approved. The mock returns `null` for every code. A code field exists; there are no codes yet.

---

## 3. Delivery

| Operation | Signature | Returns |
|---|---|---|
| `delivery.config()` | — | `DeliveryConfig` |
| `delivery.quote(zoneId, lines)` | `ZoneId, CartLine[]` | `Result<DeliveryQuote, DeliveryError>` |

⛔ D-21/22/23 — `config()` returns `EMPTY_DELIVERY_CONFIG` (zero zones). `quote()` **refuses to return a zero fee** for an unknown zone — it returns `Err(fee_unavailable)`, and the UI renders the total as `Unavailable`. A fabricated `KES 0` delivery fee is a price the business never agreed to. [NN-05]

---

## 4. Checkout

| Operation | Signature | Returns |
|---|---|---|
| `checkout.revalidate(cartId)` | `CartId` | `RevalidationResult` |
| `checkout.createOrder(cartId, checkout, idempotencyKey)` | — | `Result<Order, PaymentError>` |

**`revalidate` runs before every payment.** It re-checks price, stock, and discount validity against the server. A price **rise** or a **sold-out** line blocks and must be acknowledged; a price **drop** does not block. [F-53]

**`createOrder` is idempotent by `idempotencyKey`.** The same key returns the same order. ⚠ Enforce with a **DB unique constraint** (see §Idempotency).

---

## 5. Payments

| Operation | Signature | Returns |
|---|---|---|
| `payments.initiate(req)` | `InitiatePaymentRequest` | `Result<InitiatePaymentResponse, PaymentError>` |
| `payments.status(providerRef)` | `string` | `Result<PaymentStatusResponse, PaymentError>` |
| `payments.cancel(req)` | `CancelPaymentRequest` | `Result<CancelPaymentResponse, PaymentError>` |
| `payments.refund(req)` | `RefundRequest` | `Result<RefundResponse, PaymentError>` |
| `payments.reconcile(req)` | `ReconcileRequest` | `Result<ReconcileResult, PaymentError>` |
| `payments.byId(id)` | `PaymentId` | `Payment \| null` |
| `payments.webhookHistory(paymentId)` | `PaymentId` | `WebhookEvent[]` |

⚠ **`initiate` CANNOT report success.** Its `status` is type-narrowed to `'initiated' | 'pending'`. Success only ever comes from `status()`, which reads what the webhook recorded. This is enforced by the compiler, not by convention.

⚠ **`cancel` on an M-PESA STK returns `{ supported: false }`.** An STK push in flight cannot be recalled.

⚠ **`refund` on M-PESA returns `pending_manual`.** It is a manual B2C reversal, not an API undo.

---

## 6. Repositories (backend-internal, listed for completeness)

`CartRepository`, `OrderRepository`, `PaymentRepository` — persistence. The frontend does not call these directly; they back the services above.

---

## 7. Idempotency — the one thing that must not be got wrong

Two operations carry an `IdempotencyKey`: `createOrder` and `payments.initiate`. The frontend generates one key per checkout attempt and reuses it on retry.

> **The backend MUST enforce uniqueness with a DATABASE CONSTRAINT and return the existing record on conflict.**

A `SELECT-then-INSERT` check is a race across processes. The mock hit this exact bug (two concurrent taps both passed the in-memory check) and closed it by joining the in-flight promise — a mechanism a distributed backend does not have. Rely on the database:

```sql
ALTER TABLE payments ADD CONSTRAINT uq_idem UNIQUE (idempotency_key);
-- on INSERT conflict → return the existing row with replayed = true
```

---

## 8. Error model

Every fallible operation returns `Result<T, E>` — never throws for expected failures, never returns `null` to mean "error". `PaymentError` is a discriminated union (`provider_not_configured`, `stale_cart`, `network`, …) so the UI can respond to each specifically. `provider_not_configured` (D-35) is not retryable; a stale cart is.

---

## 9. Endpoint checklist for the backend developer

Make these real, in `src/adapters/http/*`, and the storefront works:

- [ ] `products.list / byId`
- [ ] `inventory.forVariant`
- [ ] `discounts.byCode`
- [ ] `delivery.config / quote`  ⛔ needs D-21/22/23
- [ ] `checkout.revalidate / createOrder`  ⚠ idempotent
- [ ] `payments.initiate / status / cancel / refund / reconcile / byId / webhookHistory`  ⛔ needs D-31/32 (M-PESA), D-35 (card)
- [ ] `POST /webhooks/mpesa`, `POST /webhooks/card`  (see `28_Webhook_Requirements.md`)
- [ ] DB unique constraint on `idempotency_key`
