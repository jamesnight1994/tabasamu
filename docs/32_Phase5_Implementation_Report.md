# Phase 5 Implementation Report — Cart, Checkout, Delivery & Payment Architecture

**Date:** 2026-07-15
**Result:** 275/275 tests · 17/17 routes · all six gates green · production build clean.
**Scope:** the money path. Cart → checkout → delivery quote → M-PESA/card payment → order lifecycle. Architecture only — **no payment integration is live.** [NN-04]

---

## 1. The one-sentence summary

Phase 5 builds a checkout that **refuses to lie about money** — it will not quote a delivery fee it does not have, will not report a payment it cannot confirm, and will not charge a customer twice no matter how they tap.

Everything below is in service of that.

---

## 2. What was built

### Domain (pure, testable, framework-free)

| Module | What it holds |
|---|---|
| `domain/order` | 15-state order machine + guarded transition table that throws on illegal moves |
| `domain/payment/contracts` | provider-neutral payment operations; `initiate` **cannot** report success (compiler-enforced) |
| `domain/delivery` | configurable zone/fee engine with **zero invented zones**; refuses unknown fees |
| `domain/checkout` | Zod validation (Kenyan address shape), revalidation, double-submit guard, session TTL |
| `domain/cart` | serialisation format that treats stored data as hostile |

### Adapters (swappable, mock today)

| Module | What it does |
|---|---|
| `adapters/mock/payments` | M-PESA + card gateway simulating **all seven** real outcomes, incl. `timeout_no_callback` and `success_late` |
| `adapters/mock` (checkout, delivery) | idempotent order creation, stale-cart revalidation |
| `adapters/http` | Proxy stub — every method throws `NotImplemented`, the backend checklist |

### UI (mobile-first, on-brand)

| Component | Note |
|---|---|
| `CartProvider` | thin seam — `useReducer` + pure domain fns, computes nothing itself |
| `Cart` | line items, honest totals, zone selector, discount field |
| `CheckoutForm` | guest-default, Kenyan address, two-layer double-submit guard, revalidation gate |
| `PaymentStatus` | the three-outcome M-PESA screen — **the most important screen in the app** |
| `AdapterProvider` | composition-root context; the one place `getAdapters()` is called |
| pages: `/cart`, `/checkout` | + drawer wired live in the storefront layout |

---

## 3. The five decisions that shaped the build

### 3.1 `unknown` is a first-class payment state

When M-PESA's callback never arrives, the money **may still have left the customer's account**. The intuitive default — show "failed" — invites a second payment and destroys trust. So `unknown`:
- is terminal and never collapsed into `failed`;
- offers **no retry button** (the screen's headline is *do not pay again*);
- routes to `manual_reconciliation` for a human to check the statement.

This is the single most consequential decision in the phase.

### 3.2 Card is built provider-neutral and ships disabled (D-35)

Stripe may not settle KES for a Kenyan entity. Rather than hardcode Stripe and discover this at launch, the card rail is `CARD_PROVIDER = none|stripe|flutterwave|pesapal|dpo`, ships as `none`, and the card option renders **disabled and honestly labelled**. The one provider-specific type is `CardSessionDescriptor`; everything else is neutral.

### 3.3 Blocked business data renders as `Unavailable`, never zero

No delivery zones exist (D-21/22/23), so the delivery fee — and therefore the **order total** — is genuinely unknown. It renders as an explicit "awaiting confirmation" marker carrying its decision ID, not as `KES 0`. A zero that should be a number is a quoted price the business never agreed to. Tested: *the total is Unavailable while no zone exists.*

### 3.4 The cart is treated as hostile input

`localStorage` is attacker-controllable and Safari-private-mode throws on read. The deserialiser rejects bad JSON, version mismatches, expiry, negative quantities, and float prices — one bad line discards the whole cart. And every storage access is wrapped so a throw cannot take down the storefront. Six tests cover this.

### 3.5 Idempotency is two layers, because one leaks

A `useRef` guard (synchronous, closes the double-tap window this tab) **plus** an idempotency key (protects the server from every tab and every retry). The mock proved the necessity: two concurrent initiates raced past the in-memory check and I had to close the window explicitly. **The backend cannot close it in application code — it needs a DB unique constraint.** Documented in the handover.

---

## 4. Verification

| Gate | Result |
|---|---|
| `typecheck` (tsc) | ✅ clean |
| `lint` (eslint + **boundaries**) | ✅ 0 errors — no component imports an adapter |
| `lint:secrets` | ✅ no secret in client bundle |
| `lint:brand` | ✅ (caught + fixed one real scarcity-cue violation) |
| `lint:contrast` | ✅ WCAG 2.2 AA |
| `test` (vitest) | ✅ 275/275 |
| `build` (next) | ✅ 17/17 routes |

### ⚠ What the brand lint caught

My first draft of the stock-reduced message read *"We only have N left"* — a scarcity cue P-07 forbids. The lint failed the build. It was right and the copy was wrong; rewritten to state the quantity without pressure. This is the guardrail working as designed.

### ⚠ What is NOT verified, stated honestly

**Visual layout at 360px was not browser-tested.** Playwright's browser binary could not be downloaded in the build sandbox (egress-blocked). The flow *logic* was driven through jsdom instead (12 tests), but jsdom does not lay out pixels — so horizontal-overflow and touch-target checks at mobile width **remain outstanding**. This must be run in a real browser before launch. I will not claim it passed when I could not run it. [NN-04]

---

## 5. Decisions still blocking launch

| # | Decision | Blocks |
|---|---|---|
| D-14 | Approved prices | real numbers everywhere (maths is correct, values are placeholder) |
| D-21/22/23 | Delivery zones, fees, lead times | delivery quote, checkout completion |
| D-25 | Free-delivery threshold | the "amount to free delivery" nudge |
| D-16 | VAT registration status | the tax line (currently always `Unavailable`) |
| D-31/32 | M-PESA credentials + shortcode | M-PESA go-live |
| D-35 | Card processor KES settlement | card go-live |
| D-36/37 | Refund policy + B2C credentials | refunds |
| D-41 | SMS confirmation channel | post-payment comms |

None are invented. Each renders as a visible, traceable blocked marker. [NN-05]

---

## 6. Files changed

**Created (11):** `domain/order`, `domain/payment/contracts`, `domain/delivery`, `domain/checkout`, `domain/cart`, `adapters/mock/payments`, `components/commerce/{CartProvider, Cart, CheckoutForm, PaymentStatus, AdapterProvider}`, `useVariantResolver`, pages `/cart` + `/checkout`, `tests/unit/{checkout, flows}`.
**Edited:** `ports/index`, `adapters/mock/index`, `adapters/http/index`, `adapters/mock/fixtures` (retired `MOCK_ZONES`), `components/shop/ProductDetail` (add-to-cart now real), `app/(storefront)/layout` (providers + live drawer), `tests/unit/adapters.g2`.
**Docs (8):** `25`–`32` — state diagrams, M-PESA spec, card spec, webhook requirements, endpoint contracts, env guide, test matrix, this report.

---

## 7. For the backend developer

Start at `29_Backend_Endpoint_Contracts.md` §9 — the checklist. Make each `adapters/http/*` method real, add the DB unique constraint on `idempotency_key`, stand up the two webhook endpoints, and flip `NEXT_PUBLIC_ADAPTERS=http`. The storefront does not change. The boundary lint guarantees it cannot need to.
