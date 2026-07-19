# Card / Stripe Integration Specification — Phase 5

**Status:** Specification. **The card rail is DISABLED and ships disabled.** [NN-04]
**Flag:** `cardPayments: false` in `src/lib/flags/index.ts`, blocked on **D-35**.
**Frontend contract:** `src/domain/payment/contracts.ts`.

---

## 0. Read this first — the commercial blocker

⛔ **D-35 is not a technical question. It is: *can the chosen card processor actually settle KES into a Kenyan bank account for this trading entity?***

Stripe's availability for Kenyan businesses is **not guaranteed** and changes by entity type and region. If Stripe cannot settle KES for this entity, the answer is not "make it work" — it is **use a processor that can**: Flutterwave, Pesapal, or DPO, all of which are built for this market.

So the card rail is built **provider-neutral**. Nothing in the domain, the UI, or the contract names Stripe. Stripe is one possible value of `CARD_PROVIDER`, specified here because the brief asked — but the seam is what matters.

```
CARD_PROVIDER = none | stripe | flutterwave | pesapal | dpo
```

Default `none`. While `none`, the card radio option is **disabled and labelled "Not available yet"** — never a dead option that fails at the last step.

---

## 1. Why provider-neutral, concretely

The only provider-specific surface in the entire contract is one type:

```ts
CardSessionDescriptor =
  | { kind: 'client_secret'; clientSecret: string }      // Stripe PaymentIntent
  | { kind: 'redirect'; url: string }                    // Pesapal / DPO / Flutterwave hosted
  | { kind: 'hosted_session'; sessionId: string; ... }   // hosted-field variants
```

`cardActionFor(descriptor)` maps each to a UI action. Swapping Stripe for Flutterwave changes **which arm** the backend returns — the storefront already handles all three. This is the whole reason not to hardcode Stripe.

---

## 2. The flow (Stripe shown; others analogous)

```
place order ──▶ createOrder ──▶ initiate(provider:'card')
                                     │
                       backend creates PaymentIntent (Stripe)
                                     │
                    { pending, card: { kind:'client_secret', clientSecret } }
                                     │
      frontend confirms card with the provider SDK (3-D Secure if required)
                                     │
                    ⚠ authorisation result is NOT trusted from the client
                                     │
                       WEBHOOK  (payment_intent.succeeded)  ── the truth ──▶ backend
                                     │
                       status() ──▶ succeeded, transactionRef = PaymentIntent id
```

⚠ Same principle as M-PESA: **the client-side confirmation is not the source of truth. The webhook is.** A `payment_intent.succeeded` webhook, signature-verified, moves the order to `paid`. Nothing else does.

---

## 3. Env placeholders — ALL BLOCKED (D-35)

| Env var | Meaning |
|---|---|
| `CARD_PROVIDER` | `none` until D-35 answered |
| `CARD_PUBLIC_KEY` | client SDK key (publishable — safe for the browser) |
| `CARD_SECRET_KEY` | ⛔ **server only**, `import 'server-only'`, never in a `NEXT_PUBLIC_*` |
| `CARD_WEBHOOK_SECRET` | ⛔ server only — signs the webhook |

⚠ Only the **publishable** key may reach the browser. The secret key and webhook secret live in `server-env.ts` behind `import 'server-only'`, and `lint:secrets` scans the client bundle to prove they never leak. [NN-03]

---

## 4. 3-D Secure / SCA

Card auth in this flow may require a customer challenge (3DS). The `CardSessionDescriptor` accommodates it:

- `client_secret` → the provider SDK handles the challenge inline;
- `redirect` → the customer is sent to the provider's challenge page and returned.

The order stays in `payment_processing` across the challenge. A customer who abandons the challenge → `payment_failed` (retryable), never a charged-but-lost order.

---

## 5. Refunds

⛔ D-36 / D-37. Card refunds are API-reversible (unlike M-PESA's manual B2C), but the **policy** — window, partial vs full, who authorises — is unconfirmed. `refund()` is contract-complete; the policy is not built because it is not decided.

---

## 6. Webhooks

| Provider | Event → `paid` | Signature header |
|---|---|---|
| Stripe | `payment_intent.succeeded` | `Stripe-Signature` |
| Flutterwave | `charge.completed` | `verif-hash` |
| Pesapal | IPN callback | query + server confirm |
| DPO | redirect + verify token | server-side verify |

All must be **signature-verified** and **idempotent** (providers retry). See `28_Webhook_Requirements.md`.

---

## 7. What must be confirmed before card can go live

| # | Decision | Blocks |
|---|---|---|
| **D-35** | **Can the processor settle KES for this entity? Which processor?** | **everything** |
| D-36/37 | Refund policy | refund |
| — | Provider account + keys | initiate, webhook |

Until D-35 is answered, `cardPayments` stays `false`, the option renders disabled, and no card code path is reachable. [NN-04]
