# Product Requirements Document — Tabasamu Sips Ecommerce

**Version:** 1.0 · Phase 1 · 13 July 2026
**Status:** Specification. Not approved for build until the Client Decisions Register is closed.

> **Rule applied throughout:** where a commercial rule was not present in the supplied documents, it has **not been invented**. It is marked `⛔ D-xx` and logged in `08_Client_Decisions_Register.md`. Any requirement below carrying a `⛔` is **not implementable** until answered.

---

## 1. Product Vision

A premium, editorial, mobile-first ecommerce site for a caffeine-free Kenyan rooibos kombucha. It must sell as effectively as a conversion-optimised store while reading as quietly as a magazine — and it must be fast on a mid-range Android phone on an inconsistent Nairobi connection.

**Success is:** a first-time buyer in Nairobi completes an M-PESA purchase on a phone, in under five minutes, having known the full delivered cost before they entered the cart, and without ever encountering a sentence the Brand Book would ban.

---

## 2. Scope

### 2.1 In scope (this engagement)
Frontend application, design system, content architecture, mocked service layer, documented backend interfaces, admin portal specification.

### 2.2 Out of scope
Backend implementation, payment gateway account provisioning, ERP/inventory system integration, physical logistics, tax registration, photography production (⚠ but **blocked on** — see Risks R-03).

### 2.3 Hard non-negotiables
| # | Rule |
|---|---|
| NN-01 | The Brand Book is binding. Nothing is reinterpreted, modernised, diluted or replaced. |
| NN-02 | Pure white (`#FFFFFF`) never becomes the ground. |
| NN-03 | No API secret or payment credential appears in frontend code. Environment-variable placeholders only. |
| NN-04 | No integration is described as operational unless it has been connected and tested. |
| NN-05 | No legal, nutritional, delivery, pricing or health claim is invented. |
| NN-06 | Presentation, domain logic and data access are separated. No backend behaviour is hard-coded into a UI component. |
| NN-07 | Prohibited-messaging vocabulary is enforced by a copy lint rule in CI. |

---

## 3. Platform & Technical Requirements

### 3.1 Target devices (binding)

| Class | Reference | Viewport | Priority |
|---|---|---|---|
| Small Android | Moto G-class, 360×640 | **360px is the authoring baseline** | **P0 — primary** |
| Modern iPhone | 390–430px | | P0 |
| Tablet | 768–1024px | | P1 |
| Standard laptop | 1280–1440px | | P0 |
| Large desktop | 1920px+ | Max content width capped; cream gutters expand | P1 |

### 3.2 Network

| Condition | Requirement |
|---|---|
| Slow 4G / 3G (Nairobi typical) | LCP < 2.5s. Site must be **usable**, not merely loading. |
| 4G | LCP < 1.5s |
| Offline / flaky | Graceful degradation. **Critical:** an M-PESA payment in flight must survive a connection drop and a page reload. See §5.16. |

### 3.3 Performance budget

| Metric | Budget |
|---|---|
| Above-fold JS (gzipped) | < 100 KB |
| Total JS (gzipped) | < 250 KB |
| LCP (Slow 4G) | < 2.5s |
| CLS | < 0.05 |
| INP | < 200ms |
| Hero image (mobile) | < 80 KB (AVIF/WebP, responsive `srcset`) |
| Fonts | 2 faces preloaded (Fraunces, DM Sans), subset Latin, WOFF2. JetBrains Mono lazy. |
| Lighthouse Perf (mobile, throttled) | ≥ 90 |
| Lighthouse A11y | 100 |

### 3.4 Architecture (binding — enables backend handover)

```
┌─────────────────────────────────────────────┐
│  PRESENTATION                               │  React components. No fetch. No business rules.
│  components / pages / design-system         │  Consumes hooks only.
├─────────────────────────────────────────────┤
│  APPLICATION                                │  Hooks, state, orchestration.
│  hooks / stores / view-models               │  Calls the domain layer. Never calls HTTP.
├─────────────────────────────────────────────┤
│  DOMAIN                                     │  Pure TS. Types, entities, pricing rules,
│  entities / rules / validators              │  cart maths, discount logic, delivery-fee rules.
│                                             │  Zero dependencies. Fully unit-testable.
├─────────────────────────────────────────────┤
│  PORTS  (interfaces)                        │  ProductRepository, OrderRepository,
│  ports/*.ts — the handover contract         │  PaymentGateway, InventoryService …
├─────────────────────────────────────────────┤
│  ADAPTERS                                   │  MockAdapters (Phase 2–5)
│  adapters/mock/*  adapters/http/*           │  HttpAdapters (Phase 6+, backend dev)
└─────────────────────────────────────────────┘
```

**The port layer is the deliverable to the backend developer.** Swapping `MockProductRepository` for `HttpProductRepository` must require **zero changes** above the adapter layer. This is testable and will be tested.

---

## 4. Functional Requirements — Storefront

*(Full enumeration in `06_Feature_Inventory.md`. Key behaviours specified here.)*

### 4.1 Home
Editorial-first. Sequence follows the Brand Book's three pillars:
1. Hero — one image (composition iii, negative space) + display line in Fraunces. **Logo is in the solid-cream header, never on the image.**
2. The claim, once: *"Caffeine-free. Sugar-honest. Brewed in Nairobi."*
3. The range — flavour grid (see 4.2).
4. Ingredients & fermentation — a teaser linking to the real page.
5. Our Story — a teaser.
6. Stockists / delivery reassurance.
7. Footer with mantra: *"Rooted in the soil, crafted for the soul."*

**No carousel. No countdown. No popup. No newsletter modal.**

### 4.2 Shop / Flavour grid
Because the labels are deliberately uniform (P-06), a card must carry:
- The lifestyle photograph (ingredient cue is the differentiator)
- The flavour strip swatch (a small bar, matching packaging)
- The flavour name in **Fraunces**
- The forward note in DM Sans (e.g. *"Black grape, fresh ginger"*)
- Price and size
- Stock state, factually

Filtering: **none by default.** The range is small (⛔ D-01). If the range exceeds ~8 SKUs, introduce a single filter (Flavour / Size). Never a faceted sidebar.

### 4.3 Product Detail Page — required DOM order (P-05)
1. Image gallery *(⚠ requires assets that do not yet exist — A-08)*
2. Flavour name (Fraunces H1) + forward note
3. The claim, stated once
4. **Provenance** — where the ingredients came from, named
5. **Ingredients & nutrition panel** *(⛔ D-05 — no nutritional data supplied; must not be invented)*
6. Buy box — calm, small: size variant, quantity, subscribe/one-time toggle, Add to cart
7. Delivery estimate for the user's zone (P-03 — **before** the cart)
8. Link to Ingredients & Fermentation (P-15)
9. Related flavours

### 4.4 Build-a-Box
Mixed-flavour bundle. **Authored at 360px first (P-09).**
- Live running count against the box constraint (⛔ D-06: box size — 4? 6? 12?)
- Persistent summary that remains visible on a 360px viewport without occluding the picker
- Live price update
- Fully keyboard-operable (explicit anti-pattern AP-09)
- Constraint feedback is factual: *"Four of six chosen."* Never *"Only 2 to go!"*

### 4.5 Subscriptions
Presented **neutrally** alongside one-time purchase — never subscribe-first (AP-anti E-04).
Self-serve, no contact required: skip a delivery, pause, resume, swap flavour, change frequency, change delivery date, change address, change payment method, cancel.
⛔ D-07: frequencies offered. ⛔ D-08: subscriber discount %. ⛔ D-09: does a subscription bill per delivery or per cycle?

### 4.6 Journal / Notes
Long-form editorial. ~65ch measure. Alternating full-bleed image / narrow text column (N-02, N-07).

### 4.7 Stockists
A real page (N-03). List by area. ⛔ D-10: current stockist list not supplied.

### 4.8 Wholesale & Corporate
**Enquiry flows, not cart flows.** A qualified form → a wholesale price sheet. No consumer checkout.
⛔ D-11: wholesale pricing, MOQ, payment terms — none supplied.
⛔ D-12: corporate order rules — none supplied.

---

## 5. Commerce Requirements

### 5.1 Products & variants

| Requirement | Status |
|---|---|
| Product = a flavour. Variant = a size. | Specified. |
| **Flavour list** | ⛔ **D-01.** Brand Book says 3 (Grape Ginger, Pineapple, Pineapple Ginger). Photography shows 5 more (Passion, Beetroot) and a 6th (Gooseberry) is referenced with no asset. **The catalogue cannot be modelled until this is answered.** |
| **Bottle sizes** | ⛔ **D-02.** Brand Book packaging says **500ml PET**. All photography shows **1 Litre**. Both may exist. Confirm the full size matrix. |
| **Flavour strip colours** | Defined for 3 (`#4A2A55`, `#E9C25B`, `#C05A2C`). ⛔ **D-03** — Passion, Beetroot, Gooseberry undefined. Photography shows blue and deep red, but these are **not in the Brand Book palette** and cannot be adopted without brand sign-off. |
| SKU scheme | Recommend `TS-{FLAVOUR}-{SIZE}` e.g. `TS-PIN-500`. Rendered in JetBrains Mono. |
| Product descriptor | "Caffeine Free Rooibos Kombucha" — ⛔ **D-13**, one asset reads "Gluten Free Rooibos Kombucha". **These are different claims. This is a labelling matter, not a design one.** Must be resolved before any product copy is written. |

### 5.2 Pricing
⛔ **D-14.** No approved price exists. The Strategy document *suggests* KES 300–400 (500ml) and KES 500–650 (1L), but explicitly frames these as research targets, not decisions. **No price will be hard-coded or displayed until the client confirms.** Mock data will use an obviously-placeholder value.

| Requirement | Status |
|---|---|
| Currency | KES. Display format ⛔ D-15 (`KES 500` vs `Ksh 500` vs `KSh 500.00`). |
| Price includes VAT? | ⛔ **D-16.** Critical for display and for the order total. |
| Price per size | ⛔ D-14 |

### 5.3 Bundles
Build-a-Box (mixed flavour) + fixed gift/starter bundles.
⛔ D-06: box size. ⛔ D-17: is a bundle discounted vs. buying singles?

### 5.4 Promotions & coupons
| Requirement | Status |
|---|---|
| Coupon code entry at cart | Specified (single field, calm). |
| Discount types | Percentage, fixed amount, free delivery, BOGO. |
| Stacking rules | ⛔ **D-18.** Can a coupon stack with a subscriber discount? |
| First-order discount | ⛔ **D-19.** Strategy suggests one; no decision made. |
| **Presentation constraint** | Promotions must **never** be presented with urgency (P-07). No banner, no timer, no badge. A coupon field, and a line item in the cart. That is all. |

### 5.5 Customer groups
Guest, Registered, Subscriber, Wholesale, Corporate.
⛔ D-20: does wholesale get a login with group pricing, or is it entirely offline? This materially changes the architecture.

### 5.6 Nairobi delivery zones
| Requirement | Status |
|---|---|
| Zone model | Recommend named zones (e.g. Westlands, Kilimani, Karen, Eastlands, CBD, Kasarani…) each with a fee and a lead time. |
| **Zone list** | ⛔ **D-21.** Not supplied. |
| **Fee per zone** | ⛔ **D-22.** Not supplied. |
| **Lead time per zone** | ⛔ **D-23.** Not supplied. |
| **Delivery outside Nairobi** | ⛔ **D-24.** Courier? Not offered? |
| **Free-delivery threshold** | ⛔ **D-25.** |
| **P-03 requirement (binding on the design)** | The delivery fee for the user's zone must be discoverable **before** the cart — a zone selector on the PDP and in the header. This is the single biggest first-time-buyer frustration in the Kenyan market. It is a design requirement regardless of what the zone data turns out to be. |

### 5.7 Collection / pickup
⛔ D-26: is pickup offered? From where? Hours?

### 5.8 Inventory
| Requirement | Status |
|---|---|
| Stock tracked per variant | Specified. |
| Stock display | **Factual only.** "In stock" / "Two bottles remaining" / "Out of stock". **Never** "Almost gone!" (P-07). |
| **Low-stock threshold** | ⛔ D-27. |
| Out-of-stock behaviour | Product remains browsable. Add-to-cart disabled. Notify-me offered. |
| **Backorder / preorder** | ⛔ D-28. Small-batch fermentation means stock-outs are likely and *normal*. This is worth designing for honestly — a "next batch bottles on {date}" state is more on-brand than an "out of stock" dead end. Needs a batch calendar. ⛔ D-29. |

### 5.9 Abandoned carts
Cart persists (localStorage + server-side for logged-in users).
⛔ D-30: is an abandoned-cart email sent? **Caution:** an abandoned-cart email is, by nature, a nudge. It can be written in-voice ("Your box is still here.") or it can violate the voice entirely. Requires copy sign-off.

### 5.10 M-PESA (primary rail)
| Requirement | Detail |
|---|---|
| Method | Daraja API, **STK Push** (Lipa na M-PESA Online). |
| ⛔ D-31 | Paybill vs Till number. Shortcode. Not supplied. |
| ⛔ D-32 | Production Daraja credentials — consumer key/secret, passkey. **Never in frontend code (NN-03).** Env placeholders only. |
| Flow (binding UX) | 1. Customer enters phone (validated, `2547XXXXXXXX` normalised from `07…`, `+254…`, `7…`). 2. **The site explains what will happen before it fires** (E-05). 3. STK push initiated server-side. 4. UI enters an honest **pending** state with a real countdown of the ~60s window. 5. Poll for callback confirmation. 6. Success / failure / timeout — all three are designed states. |
| **Resilience (critical)** | The pending state must survive a page reload and a connection drop. The pending order is server-authoritative, keyed by `CheckoutRequestID`. A customer who loses signal mid-payment must be able to reopen the site and see the true state. |
| Callback | Server-side webhook. Idempotent. Signature/IP-validated. |
| ⛔ D-33 | Reconciliation: is the M-PESA transaction reference surfaced to the customer and to customer-care? (Strongly recommend yes — it is the primary support key in Kenya.) |

### 5.11 Stripe (card, secondary)
| Requirement | Detail |
|---|---|
| Method | Stripe Payment Element, embedded — **styled as Tabasamu** (P-08). Never a redirect to a Stripe-branded page. |
| ⛔ D-34 | Stripe account, publishable/secret keys. Env placeholders only. |
| ⛔ D-35 | Does Stripe support KES? *(It does not settle in KES for Kenyan entities in the standard flow.)* **This is a real commercial blocker.** Confirm the intended entity and settlement currency. If Stripe cannot settle KES, an alternative card rail (e.g. Flutterwave, Pesapal, DPO) must be considered — this is a **Phase 1 finding, not a Phase 6 surprise.** |
| SCA / 3DS | Handled by Payment Element. |

### 5.12 Refunds
⛔ D-36: refund policy. ⛔ D-37: M-PESA refunds are operationally manual (B2C reversal) — is this acceptable? What is the SLA? **A refund on M-PESA is not a one-click operation and the admin UI must not pretend it is.**

### 5.13 Failed & pending payments
Three distinct, designed states — not one generic error:
| State | Meaning | UX |
|---|---|---|
| **Failed** | Customer cancelled, insufficient funds, wrong PIN. | Clear, non-judgemental. Offer retry. Cart preserved. |
| **Pending** | STK sent, no callback yet. | Honest countdown. "Check your phone." Do not claim success. |
| **Timeout / unknown** | No callback within the window. | **Do not guess.** "We haven't heard back yet. We'll confirm by SMS." Order held in `pending_payment`. Never auto-cancelled without a rule (⛔ D-38). |

Order-failure and pending-payment pages are **first-class routes** (in the site map).

### 5.14 Tax
⛔ **D-16 / D-39.** VAT registration status unknown. VAT rate, inclusive vs exclusive display, and whether a tax invoice is required — none supplied. **No tax logic will be written until answered.**

### 5.15 Order notifications
| Channel | Status |
|---|---|
| Email | Order confirmation, shipped, delivered. ⛔ D-40: transactional email provider. |
| **SMS** | ⛔ D-41. In Kenya, SMS is the expected order-confirmation channel, more so than email. Strongly recommended. Requires an SMS provider (Africa's Talking, Twilio). |
| **WhatsApp** | ⛔ D-42. See 5.17. |

### 5.16 Order lifecycle
`draft → pending_payment → paid → preparing → out_for_delivery → delivered`
Failure branches: `payment_failed`, `cancelled`, `refunded`.
⛔ D-38: auto-cancel window for `pending_payment`.

### 5.17 WhatsApp support
The Strategy names WhatsApp as the #1 channel. In an ecommerce context this needs a decision:
⛔ D-42: is WhatsApp (a) a support link only, (b) an order channel that bypasses the cart, or (c) the notification channel?
**Recommendation:** (a) + (c). If WhatsApp remains an *ordering* channel alongside the cart, there are two order-intake paths and inventory will drift. This must be decided before the data model is fixed.

### 5.18 Wholesale enquiries
Form → qualified lead. Fields: business name, contact, location, expected volume, current stockists.
⛔ D-11: wholesale pricing, MOQ, terms.

### 5.19 Corporate orders
Form → quote. Likely tasting packs / office subscriptions.
⛔ D-12.

---

## 6. Non-Functional Requirements

| # | Requirement |
|---|---|
| NFR-01 | WCAG 2.2 AA. Lighthouse A11y = 100. Manual keyboard + screen-reader pass on: PDP, build-a-box, cart, checkout, M-PESA pending state. |
| NFR-02 | Performance budget §3.3, enforced in CI (bundle-size check). |
| NFR-03 | Copy lint: the prohibited-vocabulary list (Brand Book §07) fails the build. |
| NFR-04 | Colour lint: `#FFFFFF` as a background value fails the build. |
| NFR-05 | No secret in the client bundle. Enforced by a build-time scan. |
| NFR-06 | All data access via ports. Enforced by an import-boundary lint rule (components may not import adapters). |
| NFR-07 | Type checking passes with `strict: true`. No `any` in the domain layer. |
| NFR-08 | Every phase ends with: lint, typecheck, production build, flow test, desktop + mobile check, changelog, implementation report, ZIP. |
| NFR-09 | `lang="en-KE"`. |
| NFR-10 | GDPR/KDPA: Kenya's **Data Protection Act 2019** applies. Cookie preferences, privacy policy, and data-subject rights are in scope. ⛔ D-43 — is the entity registered with the ODPC? |

---

## 7. Open blockers preventing Phase 2

| Blocker | Ref |
|---|---|
| Flavour count and size matrix unknown → catalogue cannot be modelled | D-01, D-02 |
| Photography library cannot support a PDP or a product grid | A-05 … A-09, R-03 |
| Logo has no monogram, no reversed variants, and uses an unlicensed trial font | A-01 … A-04 |
| No approved pricing | D-14 |
| Product descriptor contradiction: "Caffeine Free" vs "Gluten Free" | D-13 |
| Stripe may not settle KES for a Kenyan entity | D-35 |
