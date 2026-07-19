# Backend Handover Requirements Outline

**Audience:** the backend developer who will receive this project.
**Contract:** the `ports/` directory. Everything below specifies what must sit behind it.

**The acceptance test for a clean handover:** the full user-flow test suite runs green against **both** `MockAdapters` and `HttpAdapters`, with **zero changes above the adapter layer**. If it does not, backend logic has leaked upward.

---

## 1. Architectural contract

```
PRESENTATION   React components. No fetch. No business rules. Consumes hooks only.
     ↓
APPLICATION    Hooks, state, orchestration. Calls the domain layer. Never calls HTTP.
     ↓
DOMAIN         Pure TS. Pricing, cart maths, delivery-fee rules, phone normalisation,
               validation. Zero dependencies. Fully unit-testable. NO REACT IMPORTS.
     ↓
PORTS          The interfaces below. THIS IS THE CONTRACT.
     ↓
ADAPTERS       MockAdapters (phases 2–7)  →  HttpAdapters (yours)
```

**Enforced by an import-boundary lint rule:** a component may not import an adapter. This is checked in CI (NFR-06).

### 1.1 What is already done for you (in the domain layer)

These are **not** your responsibility, and you must not reimplement them server-side in a way that diverges:

| Logic | Where it lives |
|---|---|
| Cart subtotal, line totals, discount application | `domain/pricing.ts` — pure functions, 100% unit-tested |
| **Phone normalisation** (`07…` / `+254…` / `7…` → `2547XXXXXXXX`) | `domain/phone.ts` |
| Money arithmetic | `domain/money.ts` — **minor units, integers only. Never floats.** |
| Delivery-fee rules | `domain/delivery.ts` |
| Validation | `domain/validators.ts` |

> ⚠ **Totals must be recomputed and verified server-side at order creation.** The client's calculation is for display; yours is authoritative. But the *rules* are the same rules — port `domain/pricing.ts` rather than writing a second, divergent implementation. A pricing discrepancy between client and server is the classic source of "the price changed at checkout" bugs.

---

## 2. Security requirements — non-negotiable

| # | Requirement |
|---|---|
| **S-01** | **No API secret, payment credential, or private key ever appears in frontend code (NN-03).** Enforced by a build-time secret scan. Env-var **placeholders** only. |
| **S-02** | All payment initiation happens **server-side.** The client never talks to Daraja or to the card provider directly. |
| **S-03** | **Webhook signature/IP validation on every callback.** An unvalidated callback is discarded and logged. |
| **S-04** | **Webhooks are idempotent.** M-PESA **will** retry. A duplicate callback must be a **no-op**, not a double-credit. |
| **S-05** | **Server-side totals are authoritative.** Never trust a client-submitted price or total. |
| **S-06** | **Server-side inventory reservation.** Never trust client-side stock state. |
| **S-07** | Rate-limit: payment initiation, STK retry, login, password reset, enquiry forms. |
| **S-08** | **Role isolation is enforced server-side, not just in the admin UI.** A content editor's token must be rejected at the `/orders` endpoint — hiding the nav link is not access control. |
| **S-09** | **Kenya Data Protection Act 2019** applies. PII is encrypted at rest. Data-subject export and deletion must be implementable. ⛔ D-43. |
| **S-10** | The `WebhookEvent` log is **append-only.** Never mutated. Never deleted. It is the audit trail. |

---

## 3. Environment variables (placeholders only)

```bash
# ── M-PESA (Daraja) ──────────────────────────────  ⛔ D-31, D-32
MPESA_ENVIRONMENT=            # sandbox | production
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=              # ⛔ D-31 — Paybill or Till?
MPESA_PASSKEY=
MPESA_CALLBACK_URL=

# ── Card rail ────────────────────────────────────  ⚠ D-35 — SEE §6.2
# Stripe may NOT settle KES for a Kenyan entity. The port is deliberately
# provider-agnostic. Do not name these STRIPE_* until D-35 is answered.
CARD_PROVIDER=                # stripe | flutterwave | pesapal | dpo
CARD_PUBLIC_KEY=
CARD_SECRET_KEY=
CARD_WEBHOOK_SECRET=

# ── Notifications ────────────────────────────────  ⛔ D-40, D-41
EMAIL_PROVIDER_API_KEY=
SMS_PROVIDER_API_KEY=         # ⚠ In Kenya, SMS is the EXPECTED confirmation
SMS_SENDER_ID=                #   channel — more than email. Strongly recommended.

# ── Core ─────────────────────────────────────────
DATABASE_URL=
JWT_SECRET=
ADMIN_ORIGIN=
PUBLIC_ORIGIN=
```

**None of these are read by the frontend bundle.** Any value the client needs (e.g. a card provider's *publishable* key) is served at runtime from a config endpoint — never inlined at build time.

---

## 4. REST contract (or GraphQL equivalent — the shape is what matters)

### 4.1 Catalogue

| Method | Endpoint | Notes |
|---|---|---|
| `GET` | `/products` | ⛔ **D-01 — the catalogue cannot be modelled until the flavour count is settled.** |
| `GET` | `/products/:slug` | |
| `GET` | `/variants/:id/inventory` | |

### 4.2 Cart

| Method | Endpoint |
|---|---|
| `POST` | `/carts` |
| `GET` | `/carts/:id` |
| `POST` | `/carts/:id/lines` |
| `PATCH` | `/carts/:id/lines/:variantId` |
| `DELETE` | `/carts/:id/lines/:variantId` |
| `POST` | `/carts/:id/discount` |
| `POST` | `/carts/:id/zone` |

### 4.3 Delivery

| Method | Endpoint | Notes |
|---|---|---|
| `GET` | `/delivery/zones` | ⛔ **D-21** |
| `POST` | `/delivery/quote` | ⚠ **Called from the PDP, not only from the cart.** P-03: the fee must be knowable **before** the cart. This is the single biggest first-time-buyer frustration in this market. |

### 4.4 Orders

| Method | Endpoint | Notes |
|---|---|---|
| `POST` | `/orders` | **Recomputes totals server-side. Reserves inventory. Returns the order in `pending_payment`.** |
| `GET` | `/orders/:id` | |
| `GET` | `/orders?customerId=` | |
| `GET` | `/admin/orders/search?q=` | ⚠ **Must match on phone number AND on M-PESA receipt code.** The customer will quote the M-PESA code, not an order number. **It is the primary support key in this market.** |

---

## 5. ⚠ M-PESA — the hard part

> **This is the highest-risk area of the entire build.** Read this section carefully.

### 5.1 The flow

```
1. Client POSTs /payments/mpesa  { orderId, phone }
2. Server normalises the phone, calls Daraja STK Push
3. Server persists a Payment  { status: 'initiated', providerRef: CheckoutRequestID }
4. Server returns { paymentId, providerRef }
5. Client enters the PENDING state — a first-class ROUTE, not a modal
6. Client polls GET /payments/:providerRef/status
7. Daraja POSTs the callback → server validates, persists, updates status
8. Client's next poll sees the terminal state
```

### 5.2 Endpoints

| Method | Endpoint | Notes |
|---|---|---|
| `POST` | `/payments/mpesa` | Initiate STK push. **Server-side only.** |
| `GET` | `/payments/:providerRef/status` | ⚠ **Server-authoritative. Keyed by `CheckoutRequestID`.** |
| `POST` | `/webhooks/mpesa` | The Daraja callback. **Idempotent. Signature/IP-validated. Append-only log.** |
| `POST` | `/admin/payments/:id/retry` | **Idempotent.** Logged. Creates a **new** `Payment` — never mutates the old one. |

### 5.3 ⚠ The pending state must survive a connection drop

**This is the single hardest technical requirement in the build, and it is the one most likely to be got wrong.**

A customer on a Nairobi mobile connection **will** lose signal mid-payment. When they reopen the site, they must be able to see the **true** state of their payment.

Therefore:

- **The pending state is server-authoritative, keyed by `CheckoutRequestID`.** It is not held in client state.
- The `CheckoutRequestID` is persisted client-side (localStorage) **and** server-side against the order.
- On reload, the client recovers by polling `GET /payments/:providerRef/status`.
- **The client never decides the outcome. The server does.**

### 5.4 ⚠ `unknown` is a first-class state — never collapse it into `failed`

An M-PESA payment has **three** genuinely different terminal outcomes:

| State | Meaning | What the site says |
|---|---|---|
| `succeeded` | Callback received, `ResultCode: 0` | Confirmed. Show the M-PESA receipt code. |
| `failed` | Callback received, non-zero `ResultCode` (cancelled, insufficient funds, wrong PIN) | Clear, non-judgemental. Retry offered. Cart preserved. |
| **`unknown`** | **No callback received within the window** | *"We haven't heard back from M-PESA yet. We'll confirm by SMS."* |

> **Do not guess.** **Guessing about whether a customer's money left their account is the fastest way to destroy trust in this market.**
>
> An order in `unknown` is **held**, not auto-cancelled. ⛔ **D-38 — orders will not be auto-cancelled without an explicit client rule.**

This is why the frontend has **three separate outcome routes**, not one generic error page.

### 5.5 Idempotency

M-PESA **will** send the same callback more than once. The `WebhookEvent` table carries an `idempotencyKey`. **A duplicate callback is a no-op.** A double-credit is a catastrophic bug, not a minor one.

### 5.6 The transaction reference

⛔ **D-33 — but strongly recommended.** Surface the M-PESA receipt code to:
- **the customer** (on the order-success page and in the SMS) — rendered in JetBrains Mono, per the Brand Book's spec register;
- **customer care** (the primary support lookup key).

Customer care must also have **read-only access to the raw webhook payload** for any order. This is what lets them answer *"did my money go through?"* — the most common support question on an M-PESA store.

---

## 6. Card payments

### 6.1 The flow
Standard: create a payment intent server-side → return the client secret → the client confirms via an **embedded, themed** element.

⚠ **P-08: the checkout must never visually hand the customer off to a payment vendor's own interface.** The premium positioning collapses at the exact moment trust matters most. The element is embedded and styled as Tabasamu — **never a redirect to a vendor-branded page.**

### 6.2 ⚠ Stripe may not be viable

⛔ **D-35.** **Stripe does not offer standard KES settlement for Kenyan-registered entities.**

This is a **commercial** blocker, not a technical one, and it was deliberately surfaced in Phase 1 rather than in Phase 6.

**The `PaymentGateway` port is therefore deliberately provider-agnostic.** `Payment.provider` is `'mpesa' | 'card'` — **not** `'mpesa' | 'stripe'`. If the card rail has to become Flutterwave, Pesapal, or DPO, **that swap must not ripple above the adapter layer.**

Do not hard-code Stripe anywhere above `adapters/`.

---

## 7. Inventory

| Method | Endpoint |
|---|---|
| `POST` | `/inventory/reserve` |
| `POST` | `/inventory/release` |
| `GET` | `/inventory/:variantId` |

- **Reservation happens server-side at order creation, before payment initiation.** Never trust client-side stock.
- A reservation is released on `payment_failed`, on `cancelled`, or on reservation timeout.
- ⛔ **D-27** — low-stock threshold. ⛔ **D-28/D-29** — preorder / backorder / batch calendar.

> **Design note:** small-batch fermentation makes stock-outs **normal**, not exceptional. *"Next batch bottles on {date}"* is both more on-brand and more **true** than a bare "Out of stock" dead end. This needs a `Batch` entity (D-29).

---

## 8. ⚠ Subscriptions — do not build yet

⛔ **HARD-BLOCKED on D-09.**

**M-PESA has no card-on-file equivalent.** A subscriber cannot be silently charged each cycle the way a Stripe customer can. There are four candidate models, and **they produce materially different data models, APIs, and UX:**

| Model | Backend implication |
|---|---|
| (a) **Re-prompt with an STK push each cycle** | Needs a scheduler, a retry policy, and a dunning flow. **The customer must be present to enter their PIN — this will fail often.** |
| (b) **M-PESA standing order / Ratiba** | Needs a mandate reference. Limited availability; involves the bank. |
| (c) **Card-only subscriptions** | Standard card-on-file — **but see §6.2, the card rail itself may not be viable.** And it excludes precisely the customers most likely to subscribe. |
| (d) **Pre-paid block** (buy 3 months up front) | A subscription becomes a **fulfilment schedule against a single paid order.** Simplest. Most robust. **Arguably the most honest and the most on-brand** — no silent recurring charge, no dunning. |

**The `SubscriptionService` port is deliberately left as `/* deferred */`.** Do not implement it until the client chooses.

---

## 9. Notifications

| Trigger | Channel |
|---|---|
| Order confirmed | Email ⛔ D-40 **+ SMS** ⛔ D-41 |
| Payment failed | SMS |
| **Payment `unknown` → later resolved** | **SMS. This is the promise the pending-state copy makes: *"We'll confirm by SMS."* It must actually happen.** |
| Out for delivery | SMS |
| Delivered | SMS |

> ⚠ **In Kenya, SMS is the expected order-confirmation channel — more so than email.** It is strongly recommended, not optional.

---

## 10. Admin API

| Area | Notes |
|---|---|
| Catalogue CRUD | **Stock adjustment is ONE field** in the UI — the API should support a single-field patch. |
| **Fulfilment** | ⚠ **`GET /admin/orders?groupBy=zone`.** Orders are routed by **geography**, not by time. A time-sorted list is useless to a rider. Must include the **customer phone number** — the rider will call. |
| **Care** | `GET /admin/orders/search?q=` — **matches phone AND M-PESA receipt code.** `GET /admin/payments/:id/events` — **read-only raw webhook payloads.** |
| **Refunds** | ⚠ **An M-PESA refund is a manual B2C reversal, not an API call that completes.** Model it as a **task with a state** (`requested → processing → completed → failed`), recording **who** actioned it and **when**. **The API must not expose an endpoint that implies one-click completion (R-22).** |
| Content | Draft → preview → publish. ⚠ **The copy lint must run server-side at publish time** (F-95) — a draft containing banned vocabulary **cannot be published.** The content editor is the highest-risk author on the project and the least likely to have read the Brand Book. Client-side lint alone will be bypassed. |
| **Roles** | ⚠ **Enforced server-side (S-08).** A content editor's token must be **rejected** at `/orders` — hiding the nav link is not access control. |

---

## 11. What is blocked, and why you should not proceed past it

| Blocked | On | Consequence of guessing |
|---|---|---|
| The catalogue schema | **D-01, D-02** | Every downstream table is wrong. |
| Every price | **D-14** | — |
| Tax logic | **D-16** | Incorrect invoices; a compliance exposure. |
| Delivery zones, fees, lead times | **D-21, D-22, D-23** | The fulfilment view, the PDP quote, and the cart all break. |
| **The entire subscription architecture** | **D-09** | **Four incompatible designs. Building the wrong one is a rewrite.** |
| The card rail | **D-35** | **Building on Stripe when Stripe cannot settle KES is a rewrite.** |
| Nutrition & ingredients | **D-05** | **Regulated food information. Will not be invented (NN-05).** |
| Auto-cancel rule | **D-38** | **Cancelling a customer's paid order because a callback was late.** |

**None of these has been guessed, and none should be.**

---

## 12. Handover checklist

- [ ] `ports/` reviewed — every interface understood
- [ ] The domain layer read — **the pricing, phone, and money rules are not to be reimplemented divergently**
- [ ] Env-var manifest populated (**no secret in the frontend bundle — verified by scan**)
- [ ] Webhook idempotency implemented and **tested with a deliberate duplicate**
- [ ] **The `unknown` payment state implemented as a first-class state**, not collapsed into `failed`
- [ ] **The pending state tested by killing the connection mid-payment and reloading**
- [ ] Role isolation enforced **server-side**
- [ ] Copy lint runs **server-side at publish time**
- [ ] **The adapter-swap test is green: the full flow suite passes against both `MockAdapters` and `HttpAdapters`, with zero changes above the adapter layer**
- [ ] **NN-04 respected: no integration described as operational until it has actually been connected and tested**
