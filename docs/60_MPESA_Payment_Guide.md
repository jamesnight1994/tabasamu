# 60 · M-PESA Payment Guide

The operational guide for connecting M-PESA (Safaricom Daraja). The technical
spec is doc 26; this guide adds the prerequisites, the reconciliation and
idempotency obligations spelled out as procedures, and the sandbox/production
checklists the handover requires.

> **No real credentials are in this repository.** Every M-PESA value is a
> server-only `.env` placeholder, blocked on **D-31** (Paybill/Till + shortcode)
> and **D-32** (Daraja app credentials). [NN-03]

---

## 1. Daraja application prerequisites (client + backend)

Before any integration work can be verified live, the **client** must supply:

- **Business shortcode type and number** — Paybill or Buy-Goods Till (**D-31**).
- **Daraja app credentials** — Consumer Key, Consumer Secret (**D-32**).
- **Lipa na M-PESA passkey** — for STK Push (**D-32**).
- **Registered callback URL(s)** — allow-listed with Safaricom.
- **Go-live approval** — Safaricom production access requires an app review.

Until these exist, the backend can build and test against Daraja **sandbox**
only, and the frontend keeps the M-PESA path visible but honest (it never claims
a payment succeeded that has not).

## 2. Required server credentials (env — all placeholders)

```
MPESA_ENVIRONMENT=sandbox        # sandbox | production
MPESA_CONSUMER_KEY=              # D-32
MPESA_CONSUMER_SECRET=           # D-32
MPESA_PASSKEY=                   # D-32
MPESA_SHORTCODE=                 # D-31
MPESA_CALLBACK_URL=              # your allow-listed https callback
```

**Never** prefix any of these with `NEXT_PUBLIC_`. They are server-only;
`lint:secrets` fails the build if any reaches the client bundle.

## 3. Environment separation

Keep sandbox and production **fully separate** — different credentials,
different callback URLs, different order of magnitude of care. `MPESA_ENVIRONMENT`
selects the Daraja base URL. A production shortcode must never be reachable from
a staging deploy; gate it on both `MPESA_ENVIRONMENT` and your infra environment.

## 4. STK Push flow (the happy path and its honest edges)

1. Customer confirms the order → frontend calls `POST /payments/mpesa/initiate`
   with `{ orderId, phone }` and an `Idempotency-Key`.
2. Backend normalises the phone to `2547XXXXXXXX` (use the domain rule; do not
   re-invent it), requests a Daraja access token, and sends the STK push.
3. Daraja responds ~immediately with a `CheckoutRequestID`. Backend returns
   `202 { providerRef: <CheckoutRequestID>, status: 'initiated'|'pending' }`.
   **This is an acknowledgement, not a payment.** The customer has not paid yet.
4. Customer receives the STK prompt and enters their PIN.
5. Safaricom sends the **callback** to `MPESA_CALLBACK_URL` with the result.
6. The order advances to `paid` (or `payment_failed`) **only on the callback**,
   never on step 3.

The frontend shows a pending state and polls
`GET /payments/mpesa/status/{providerRef}` as a fallback for a slow/lost
callback.

## 5. Callback endpoint (`POST /payments/mpesa/callback`) — backend only

- **Verify origin first.** Accept only Safaricom source IPs / your shared secret;
  a request that fails verification is discarded, not processed.
- **Parse the result code.** `0` = success; anything else is a failure with a
  reason. Record the M-PESA receipt number — it is the customer's support key.
- **Advance the order via the guarded transition** (`canTransition`), so a
  duplicate cannot drive an illegal state change.
- **Respond 200 to Safaricom** once you have accepted the callback for
  processing (Safaricom retries on non-200).

## 6. Transaction status (the polling fallback)

`GET /payments/mpesa/status/{providerRef}` queries Daraja's transaction-status
API (or your own record if the callback already arrived). It is
**server-authoritative** — the client never decides the outcome. This is what
makes the pending state survive a page reload or a dropped connection.

## 7. Reconciliation — resolving `unknown`

Some callbacks never arrive, yet the customer's money may have left their
account. Those payments sit as `status: unknown` / order
`manual_reconciliation`.

**Procedure:**
1. A scheduled job (or admin action) calls the Daraja transaction-status API for
   every `unknown` payment older than the timeout window.
2. If M-PESA confirms success → advance to `paid`, store the receipt, notify the
   customer. If it confirms failure → `payment_failed`, release the stock
   reservation. If still indeterminate → leave `unknown` and surface it in the
   admin reconciliation queue for a human.
3. `POST /payments/mpesa/reconcile` (admin, permission-gated) performs the
   resolving transition.

> Without reconciliation you silently keep the money of every customer whose
> callback was lost. This job is not optional. [R-10]

## 8. Idempotency & duplicate callbacks (the backend's hardest obligation)

- **M-PESA WILL deliver the same callback more than once.** Processing must be
  idempotent: key on `CheckoutRequestID` + M-PESA receipt; a second delivery is
  a no-op that still returns 200.
- **Initiation is idempotency-keyed** so a double-tap does not send two STK
  pushes or create two payments. Note: a *legitimate retry* after a failure
  creates a **new** `Payment` on the order (payments are `1..*`), not a mutation
  of the old one — the history stays truthful.

## 9. Timeout behaviour

If no callback arrives within the window (Safaricom's STK timeout is ~1–2
minutes), do **not** mark the order failed. Move it to `manual_reconciliation`
and let §7 resolve it. Telling a customer who paid that they failed is the worst
outcome; the state machine exists to prevent exactly that.

## 10. Order state updates (who moves what)

| Event | Order transition |
|---|---|
| Initiate accepted (202) | `awaiting_payment` → `payment_processing` |
| Callback success | `payment_processing` → `paid` |
| Callback failure | `payment_processing` → `payment_failed` |
| Timeout / no callback | `payment_processing` → `manual_reconciliation` |
| Reconcile → success | `manual_reconciliation` → `paid` |
| Reconcile → failure | `manual_reconciliation` → `payment_failed` |

## 11. Refunds & reversals

An M-PESA refund is a **manual B2C reversal**, not an API call the customer
triggers. `RefundResponse.requiresManualAction` is `true`; the admin UI presents
it as a task with a state (D-36/37), never one-click. Record who initiated it and
the reversal reference; audit it.

## 12. Sandbox testing checklist

- [ ] Daraja sandbox credentials in `.env.local` (`MPESA_ENVIRONMENT=sandbox`).
- [ ] Access-token request succeeds.
- [ ] STK push to a sandbox test MSISDN returns a `CheckoutRequestID`.
- [ ] Callback received and verified; order advances to `paid`.
- [ ] Duplicate callback replayed → no double side effect (idempotency proven).
- [ ] Simulated no-callback → order lands in `manual_reconciliation`, not failed.
- [ ] `reconcile` resolves an `unknown` payment both ways.
- [ ] Initiation replay with same `Idempotency-Key` → single payment.
- [ ] `lint:secrets` still passes (no credential in the client bundle).

## 13. Production activation checklist

- [ ] Client has supplied D-31 (shortcode) and D-32 (credentials + passkey).
- [ ] Callback URL registered and allow-listed with Safaricom.
- [ ] `MPESA_ENVIRONMENT=production`, production credentials in the secret store.
- [ ] Callback origin verification tightened to production sources.
- [ ] Reconciliation job scheduled and monitored (alert on growing `unknown`
      queue).
- [ ] Refund/reversal runbook agreed with finance (D-36/37).
- [ ] Decide whether the M-PESA reference is surfaced to customer care (D-33 —
      strongly recommended; it is the primary support key).
- [ ] A real end-to-end test transaction completed and reconciled.
