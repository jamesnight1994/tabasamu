# 61 · Stripe / Card Payment Guide

The operational guide for the card rail. The technical spec is doc 27; this guide
adds prerequisites, the webhook and reconciliation procedures, and the test/live
checklists.

> ## ⛔ READ THIS FIRST — the commercial blocker (D-35)
>
> **Stripe does not offer standard KES settlement for Kenyan-registered
> entities.** Whether Stripe is even usable for this business is an unanswered
> commercial question, not a technical one. If it cannot settle KES, the card
> rail must be **Flutterwave, Pesapal, or DPO** instead — which changes the
> concrete integration while leaving the frontend untouched.
>
> Because of this, the `PaymentGateway` port is **provider-agnostic** and the
> card option is **disabled** (`CARD_PROVIDER=none`, feature flag `cardPayments`
> off) until D-35 is resolved. This guide describes Stripe as the reference; the
> shape is the same for the alternatives.

---

## 1. Account prerequisites (client)

- **Confirmed card provider** that can settle **KES** for the trading entity (D-35).
- A **registered business** with the provider, KYC completed.
- **API keys** (publishable + secret) and a **webhook signing secret**.
- Agreement on whether **subscriptions/recurring** are in scope on this rail
  (ties to D-09 — but note M-PESA, not card, is the primary rail here).

## 2. Server credentials (env — all placeholders, D-34/D-35)

```
CARD_PROVIDER=none               # none | stripe | flutterwave | pesapal | dpo
CARD_PUBLIC_KEY=                 # publishable key (safe to expose IF stripe)
CARD_SECRET_KEY=                 # SERVER ONLY
CARD_WEBHOOK_SECRET=             # SERVER ONLY — signature verification
```

While `CARD_PROVIDER=none`, `POST /payments/card/session` returns `501` and the
UI hides/greys the card option. This is the honest state, not a bug.

## 3. Payment Intent / Checkout architecture

Reference (Stripe):
1. Frontend calls `POST /payments/card/session` with `{ orderId }` and an
   `Idempotency-Key`.
2. Backend creates a **PaymentIntent** (or Checkout Session) for the order total
   — recomputed server-side, in KES minor units — and returns a
   `CardSessionDescriptor` (client secret or redirect URL).
3. Frontend confirms the payment with the provider's SDK (client secret) or
   redirects (Checkout).
4. The **webhook** is the source of truth for success — exactly as with M-PESA,
   the client-side confirmation is not trusted to move the order to `paid`.

For a redirect-based provider (Pesapal/DPO), step 2 returns a redirect URL and
step 4 is a return-URL + webhook confirmation.

## 4. Webhook endpoint (`POST /payments/card/webhook`) — backend only

- **Verify the signature FIRST** using `CARD_WEBHOOK_SECRET`. An unverified event
  is discarded, never processed.
- **Handle only the events you need** (see §8); ignore the rest with a 200.
- **Advance the order via the guarded transition.**
- **Idempotent processing** — providers retry; key on the event ID.

## 5. Idempotency

- Session creation is `Idempotency-Key`-guarded (a double-tap creates one intent).
- Webhook processing is keyed on the provider event ID; a redelivered event is a
  no-op that returns 200.

## 6. 3-D Secure / SCA

Card flows may require a customer authentication step (3DS/SCA). The reference
flow handles this via the provider SDK's `handleNextAction`/redirect. Do not
mark the order paid until the webhook confirms the authenticated charge
succeeded.

## 7. Refunds

Card refunds are an **API call** (unlike M-PESA's manual reversal), but still an
**admin, permission-gated, audited** action via `POST /refunds`. Support partial
refunds; reflect `refund_pending` → `refunded`/`partially_refunded` on the order.

## 8. Required webhook events (Stripe reference)

| Event | Action |
|---|---|
| `payment_intent.succeeded` | Order → `paid`; store charge id |
| `payment_intent.payment_failed` | Order → `payment_failed`; release stock |
| `charge.refunded` | Order → `refunded`/`partially_refunded` |
| `charge.dispute.created` | Flag for finance; do not auto-act |

Map the analogous events for Flutterwave/Pesapal/DPO if chosen.

## 9. Reconciliation

Even on card, run a periodic reconciliation of provider charges against orders,
so a missed/late webhook does not leave a paid order stuck in
`payment_processing`. The provider's dashboard is the external source of truth;
your order ledger must match it.

## 10. Test mode checklist

- [ ] `CARD_PROVIDER=stripe` (or chosen), **test** keys in `.env.local`.
- [ ] Session creation returns a valid descriptor.
- [ ] Test-card success → webhook → order `paid`.
- [ ] Test-card decline → webhook → `payment_failed`, stock released.
- [ ] 3DS test card completes the authentication step.
- [ ] Duplicate webhook replay → no double side effect.
- [ ] Refund (full + partial) reflects on the order.
- [ ] `lint:secrets` passes — no secret key in the client bundle.

## 11. Live mode checklist

- [ ] **D-35 resolved** — the provider can settle KES for this entity.
- [ ] Live keys in the secret store; `CARD_PROVIDER` set; flag `cardPayments` on.
- [ ] Webhook endpoint registered with the live signing secret.
- [ ] Signature verification enforced; unverified events rejected.
- [ ] Reconciliation job scheduled and monitored.
- [ ] Refund/dispute runbook agreed with finance.
- [ ] One real low-value end-to-end charge completed and refunded.
