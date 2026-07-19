# M-PESA Integration Specification — Phase 5

**Status:** Specification for the backend developer. **Nothing here is live.** [NN-04]
**Rail:** Safaricom Daraja — STK Push (Lipa na M-PESA Online).
**Frontend contract:** `src/domain/payment/contracts.ts` (`PaymentOperations`).

---

## 0. What the frontend has already built against this

The storefront calls four operations and knows nothing about Daraja beyond them:

```
initiate(req)          → { paymentId, providerRef, status: 'initiated'|'pending', replayed }
status(providerRef)    → { status, transactionRef, failureReason, callbackReceived }
cancel(req)            → { supported: false }   // ⚠ STK cannot be cancelled
refund(req)            → { status: 'pending_manual', requiresManualAction: true }
```

The backend implements these against Daraja. The seam is `NEXT_PUBLIC_ADAPTERS=http` — see `15_Architecture_Decision_Records.md`.

---

## 1. Credentials — ALL BLOCKED

⛔ These are unanswered client decisions. The frontend ships env-variable **placeholders** and nothing else. [NN-03, D-31, D-32]

| Env var | What it is | Decision |
|---|---|---|
| `MPESA_CONSUMER_KEY` | Daraja app key | ⛔ D-31 |
| `MPESA_CONSUMER_SECRET` | Daraja app secret | ⛔ D-31 |
| `MPESA_SHORTCODE` | Paybill / Till (the business shortcode) | ⛔ D-32 |
| `MPESA_PASSKEY` | Lipa na M-PESA online passkey | ⛔ D-31 |
| `MPESA_ENVIRONMENT` | `sandbox` \| `production` | — |
| `MPESA_CALLBACK_URL` | HTTPS callback endpoint (see §4) | depends on deploy |

⚠ **Shortcode type matters.** Paybill and Till behave differently in the callback and in settlement. D-32 must specify which, and whether it is owned by the trading entity or a third party — the latter changes the refund path entirely.

---

## 2. The STK Push sequence

```
Customer            Storefront            Backend              Daraja           Customer's phone
   │  place order       │                    │                    │                    │
   ├───────────────────▶│  createOrder       │                    │                    │
   │                    ├───────────────────▶│                    │                    │
   │                    │  initiate          │  STK Push request  │                    │
   │                    ├───────────────────▶├───────────────────▶│                    │
   │                    │                    │                    │   PIN prompt       │
   │                    │  { pending }       │  { CheckoutRequestID }                  │
   │                    │◀───────────────────┤◀───────────────────┤───────────────────▶│
   │  "check your phone"│                    │                    │                    │
   │◀───────────────────┤                    │                    │   enters PIN       │
   │                    │  poll status       │                    │◀───────────────────┤
   │                    ├───────────────────▶│                    │                    │
   │                    │                    │◀═══ CALLBACK ══════┤   (async, seconds  │
   │                    │  { succeeded }     │   (the truth)      │    to minutes)     │
   │◀───────────────────┤◀───────────────────┤                    │                    │
```

⚠ **The synchronous STK response is an acknowledgement, not a payment.** Daraja returns `CheckoutRequestID` and a `ResponseCode` the instant it accepts the request — before the customer has typed anything. The frontend stores it as `providerRef` and moves to `pending`. **It never treats this as success.**

---

## 3. The `initiate` mapping

Backend maps `InitiatePaymentRequest` → Daraja STK Push:

| Contract field | Daraja field | Note |
|---|---|---|
| `amount` (minor units) | `Amount` (whole KES) | ⚠ Daraja rejects decimals. Convert integer minor → major. |
| `phone` (`2547XXXXXXXX`) | `PartyA` / `PhoneNumber` | Already normalised by `domain/identity/phone`. Daraja wants `254…`, no `+`. |
| `MPESA_SHORTCODE` | `BusinessShortCode`, `PartyB` | — |
| `idempotencyKey` | — (backend dedupe key) | ⚠ **DB unique constraint.** See §7. |
| — | `AccountReference` | Use the order number. |
| — | `TransactionDesc` | Short, e.g. "Tabasamu order". |
| — | `Timestamp`, `Password` | `Password = base64(Shortcode + Passkey + Timestamp)`. |

Returns `providerRef = CheckoutRequestID`, `status: 'pending'`.

---

## 4. The callback — the source of truth

Daraja POSTs to `MPESA_CALLBACK_URL` asynchronously. **This is the only authority on whether money moved.**

```
POST  MPESA_CALLBACK_URL
Body.stkCallback:
  MerchantRequestID, CheckoutRequestID
  ResultCode   →  0 = success ; non-zero = failure (each code is a reason)
  ResultDesc
  CallbackMetadata (on success): Amount, MpesaReceiptNumber, PhoneNumber, TransactionDate
```

Backend MUST:

1. **Verify the source.** The URL is public. See §5.
2. **Look up the payment by `CheckoutRequestID`.**
3. **Map `ResultCode`:**
   - `0` → `succeeded`; store `MpesaReceiptNumber` as `transactionRef` (⚠ this is the **customer's primary support key** — D-33).
   - `1032` → user cancelled → `failed`.
   - `1` → insufficient funds → `failed`.
   - `2001` → wrong PIN → `failed`.
   - other non-zero → `failed` with `ResultDesc` as `failureReason`.
4. **Be idempotent.** Daraja retries callbacks. A duplicate `CheckoutRequestID` must be a **no-op that still returns HTTP 200** — otherwise Daraja keeps retrying. `WebhookProcessResult.duplicate` models this.
5. **Respond `{ "ResultCode": 0, "ResultDesc": "Accepted" }`** regardless, so Daraja stops retrying.

### The callback that never comes

If no callback arrives within `PENDING_WINDOW_MS` (90s), the frontend surfaces `unknown` and the backend should:

- Run a **Transaction Status query** (Daraja API) against the `CheckoutRequestID`;
- If still indeterminate, hold the order in `manual_reconciliation` for a human to check the M-PESA statement.

⚠ **Never auto-fail a payment because the callback was slow.** Slow ≠ failed. [R-10]

---

## 5. Securing the callback

The callback URL is public and unauthenticated by default. Anyone who learns it can POST a forged "success". Mitigations (backend MUST apply at least one, preferably all):

- **IP allowlist** Safaricom's published callback ranges.
- **Confirm every callback with a server-side Transaction Status query** before trusting it — do not act on the POST body alone for the money-moving state.
- Treat the callback as a *notification to go verify*, not as proof.

`WebhookVerification` in the contract carries the verification result; `__verifyWebhook` in the mock models signature rejection (`'valid-signature'` passes, everything else is discarded).

---

## 6. Refunds — NOT one click

⛔ D-36 / D-37 — refund policy unconfirmed.

An M-PESA refund is a **B2C reversal**: a separate, manually-authorised payout from the business shortcode back to the customer. It is not an API "undo". So:

- `refund()` returns `status: 'pending_manual'`, `requiresManualAction: true`;
- the order sits in `refund_pending` until a human completes the B2C reversal;
- resolves to `refunded` or `partially_refunded`.

This requires B2C API credentials and an Initiator — a **separate** credential set from STK, and its own client decision. Not specified here because D-36/D-37 are open.

---

## 7. Idempotency — the backend's hardest obligation

The frontend sends the same `idempotencyKey` on a retried attempt. The backend MUST guarantee one payment per key:

> **Put a UNIQUE constraint on `idempotency_key` in the payments table and let the INSERT fail.**

An application-level check ("SELECT, then INSERT if absent") is a race — two requests both SELECT nothing and both INSERT. The mock hit this exact bug and closed it by joining the in-flight promise; a distributed backend has no shared promise and must rely on the database. On a duplicate-key error, return the **existing** payment with `replayed: true`.

---

## 8. What must be confirmed before this can go live

| # | Decision | Blocks |
|---|---|---|
| D-31 | Daraja credentials (key/secret/passkey) | initiate |
| D-32 | Shortcode + type (Paybill/Till, ownership) | initiate, settlement, refund |
| D-33 | Surface M-PESA receipt as primary support ref | ✅ built, awaiting confirmation |
| D-36/37 | Refund policy + B2C credentials | refund |
| D-41 | SMS confirmation channel | post-payment comms |
| — | Callback URL (needs deployed HTTPS host) | callback |

Until D-31 and D-32 are answered, **M-PESA cannot be enabled and the code does not pretend it can.** [NN-04]
