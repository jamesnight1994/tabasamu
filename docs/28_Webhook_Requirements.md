# Webhook Requirements — Phase 5

**Status:** Backend specification. [NN-04]
**Applies to:** M-PESA STK callback, and card webhooks (Stripe/Flutterwave/Pesapal/DPO).

A webhook is the **only** trustworthy signal that money moved. Every rule here exists because the alternative is charging a customer and losing the record, or trusting a forged POST.

---

## 1. Four non-negotiable properties

Every webhook endpoint MUST be:

1. **Authenticated** — verify the sender before trusting the body (§2).
2. **Idempotent** — the same event delivered twice changes state once (§3).
3. **Fast to acknowledge** — return 2xx immediately; do slow work async (§4).
4. **Ordered-tolerant** — events can arrive out of order; never assume sequence (§5).

---

## 2. Authentication

| Rail | Method |
|---|---|
| M-PESA | The callback is unsigned. **Confirm every callback with a server-side Transaction Status query** and/or IP-allowlist Safaricom ranges. Treat the POST as "go verify", not proof. |
| Stripe | Verify `Stripe-Signature` HMAC against `CARD_WEBHOOK_SECRET`. |
| Flutterwave | Verify `verif-hash` against the configured secret. |
| Pesapal / DPO | Verify via server-side status confirmation on the reference. |

⚠ An unsigned, unconfirmed callback is discarded. `__verifyWebhook` in the mock models this: only `'valid-signature'` passes; every other input is dropped. A forged "success" must never move an order to `paid`.

---

## 3. Idempotency

Providers **retry** webhooks until they get a 2xx, and networks duplicate. So:

- Key each event by its provider event id (M-PESA `CheckoutRequestID`, Stripe event `id`).
- Record processed event ids. A repeat is a **no-op that still returns 2xx**.
- `WebhookProcessResult.duplicate = true` records that this was a duplicate — for observability, not for a different response. The response is still 2xx.

⚠ Returning an error on a duplicate makes the provider retry **forever**.

---

## 4. Acknowledge fast

Verify + enqueue + return 2xx. Do NOT run delivery-scheduling, SMS-sending, or email inside the webhook handler — a slow handler times out and the provider retries, producing duplicate side effects. The mock's `process()` is synchronous only because it does no I/O; a real handler defers.

---

## 5. Out-of-order & late events

- A `succeeded` for an order already `paid` → no-op (idempotency covers it).
- A late callback for a `cancelled`/`delivered` order → **the order state machine refuses the transition** (`ORDER_TRANSITIONS` throws). The webhook logs it and returns 2xx. It does **not** resurrect a terminal order. This exact case is tested: *"REFUSES a late callback that would resurrect a cancelled order."*
- A `failed` after a `succeeded` for the same payment → investigate; do not silently flip. Should not happen per-payment, but log loudly if it does.

---

## 6. Endpoints the backend must expose

| Endpoint | Caller | Purpose |
|---|---|---|
| `POST /webhooks/mpesa` | Safaricom | STK result callback |
| `POST /webhooks/card` | card provider | payment/refund events |
| (internal) reconcile job | scheduler | resolve `unknown` payments via Transaction Status query |

All endpoints: HTTPS only, verified, idempotent, 2xx-fast.

---

## 7. Contract surface

`WebhookVerification`, `WebhookProcessResult`, and `PaymentOperations.reconcile` in `src/domain/payment/contracts.ts` are the frontend-visible shapes. The frontend never receives webhooks — it polls `status()`, which reads what the webhook already recorded. The webhook is a backend-only concern; this document is its specification.
