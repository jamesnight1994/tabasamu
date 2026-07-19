# Site Map

Route table + hierarchy. Public, transactional, account, legal, and admin trees.

**Navigation principle:** text-only navigation, no icons (N-02, N-03). The header sits on a **solid cream band** — never transparent over a photograph, because the logo may never sit on an image (Brand Book §02). On mobile, the header logo switches to the **monogram** (40px minimum) rather than shrinking the full lockup below its 120px floor.

---

## 1. Primary navigation (5 items maximum)

```
Shop  ·  Our Story  ·  Ingredients  ·  Journal  ·  Stockists
                                                    [ Cart ]
```

Wholesale, Corporate, FAQs, Contact and all legal pages live in the **footer**. They are not primary-nav items — a wholesale buyer arrives by intent, not by browsing.

---

## 2. Route table

### 2.1 Public / editorial

| Route | Page | Notes |
|---|---|---|
| `/` | Home | Editorial-first. No carousel, no popup, no newsletter modal. |
| `/shop` | Shop / All flavours | The flavour grid. No faceted sidebar (small range). |
| `/shop/:collection` | Product collection | e.g. `/shop/singles`, `/shop/bundles`, `/shop/gifts`. ⛔ D-45 — collection taxonomy not yet decided. |
| `/product/:slug` | Product detail (PDP) | DOM order is binding — see PRD §4.3. |
| `/build-a-box` | Build-a-Box | Mixed-flavour bundle. **Authored at 360px first.** |
| `/subscriptions` | Subscriptions | Explains the model. Neutral, not subscribe-first. |
| `/our-story` | Our Story | The Nairobi kitchen. The three pillars. `tabasamu` translated **once**, confidently, here — and nowhere else (P-14). |
| `/ingredients` | Ingredients & Fermentation | **A real editorial destination (P-15).** Named farms, named regions, named days. Linked from every PDP. |
| `/journal` | Journal / Notes — index | |
| `/journal/:slug` | Journal entry | ~65ch measure. Alternating full-bleed / narrow column. |
| `/stockists` | Stockists | A real page (N-03). Grouped by area. ⛔ D-10 — list not supplied. |
| `/wholesale` | Wholesale | **Enquiry, not cart.** ⛔ D-11. |
| `/corporate` | Corporate orders | **Enquiry, not cart.** ⛔ D-12. |
| `/faqs` | FAQs | ⛔ D-46 — FAQ content not supplied. Will not be invented. |
| `/contact` | Contact | ⛔ D-47 — no address, phone, or email supplied. |

### 2.2 Transactional

| Route | Page | Notes |
|---|---|---|
| `/cart` | Cart | Coupon field. Zone selector (fee shown here **and earlier**, per P-03). |
| `/checkout` | Checkout | **Styled as Tabasamu end-to-end (P-08).** No vendor handoff. |
| `/checkout/payment` | Payment method | M-PESA (primary) / Card (secondary). |
| `/checkout/pending` | **Payment pending** | **A first-class route, not a modal.** Survives reload. Server-authoritative, keyed by `CheckoutRequestID`. Honest countdown. |
| `/order/:id/success` | Order success | M-PESA reference shown in JetBrains Mono. |
| `/order/:id/failed` | **Order failed** | Non-judgemental. Retry offered. Cart preserved. |
| `/order/:id/pending` | **Order pending payment** | Distinct from `/checkout/pending`. For an order held awaiting confirmation. "We haven't heard back yet. We'll confirm by SMS." |

> **Why three payment-outcome routes and not one error page:** an M-PESA payment has three genuinely different terminal states — failed, confirmed, and *unknown*. Collapsing them into one page forces the site to guess, and guessing about whether a customer's money left their account is the fastest way to destroy trust in the Kenyan market. **Do not guess.** (PRD §5.13.)

### 2.3 Account

| Route | Page |
|---|---|
| `/account` | Account overview |
| `/account/orders` | Orders — with **Reorder** (one tap → pre-filled cart) |
| `/account/orders/:id` | Order detail — status, M-PESA reference, delivery zone |
| `/account/addresses` | Addresses — CRUD |
| `/account/subscriptions` | **Subscription management** |
| `/account/subscriptions/:id` | Skip · Pause · Resume · Swap flavour · Change frequency · Change date · Change address · Change payment · **Cancel** — all self-serve, no contact required, **no retention gauntlet** |
| `/account/details` | Name, phone, email, password |
| `/login` `/register` `/forgot-password` | Auth. **Guest checkout is always available** — an account is never forced. |

### 2.4 Legal & policy

| Route | Page | Notes |
|---|---|---|
| `/privacy` | Privacy policy | **Kenya Data Protection Act 2019** applies. ⛔ D-43. |
| `/terms` | Terms & conditions | ⛔ — no legal copy supplied. **Will not be invented (NN-05).** |
| `/delivery-and-returns` | Delivery & returns | ⛔ D-21…D-26, D-36. **The single most important trust page in the KE market (P-03).** |
| `/cookie-preferences` | Cookie preferences | Granular consent. Not a dismiss-only banner. |
| `/accessibility` | **Accessibility statement** | In scope. States the WCAG 2.2 AA target and the known gaps (the terracotta contrast constraint, AX-01). |

### 2.5 System

| Route | Page |
|---|---|
| `/404` | Not found — **written in-voice.** No jokes, no exclamation marks. |
| `/500` | Error |
| `/search` | Search — ⛔ D-48. With a range this small, search may be unnecessary. Recommend **omitting at launch.** |

### 2.6 Admin portal (`/admin`)

Role-isolated. A content editor cannot reach orders or customers.

```
/admin
├── /dashboard                    Today's orders, stock alerts, pending payments
├── /orders
│   ├── /orders                   ⚠ Default view groups by DELIVERY ZONE, not by time
│   ├── /orders/:id               Status, payment history, raw webhook payload (read-only)
│   └── /orders/fulfilment        Daily run sheet, per zone, printable, with phone numbers
├── /products
│   ├── /products                 CRUD
│   ├── /products/:id             Variants, flavour strip, images, copy
│   └── /products/:id/stock       ⚠ Stock adjustment is ONE field
├── /inventory                    Per-variant stock, low-stock threshold, batch calendar (⛔ D-29)
├── /subscriptions                Active / paused / churned. MRR.
├── /customers                    Lookup by phone AND by M-PESA reference ⚠
├── /discounts                    Coupons: type, value, expiry, limit, stacking (⛔ D-18)
├── /delivery
│   ├── /delivery/zones           CRUD zones (⛔ D-21)
│   └── /delivery/fees            Fee + lead time per zone (⛔ D-22, D-23)
├── /payments
│   ├── /payments                 Reconciliation view
│   ├── /payments/:id             Raw callback payload. Re-trigger STK. Idempotent, logged.
│   └── /payments/refunds         ⚠ M-PESA refunds presented as a TASK with a state — never as one-click
├── /content
│   ├── /content/journal          Draft → preview → publish. ⚠ Copy lint blocks banned vocabulary.
│   ├── /content/pages            Our Story, Ingredients, FAQs
│   └── /content/stockists        CRUD
├── /enquiries
│   ├── /enquiries/wholesale
│   └── /enquiries/corporate
├── /reports                      Revenue, subscriptions, VAT (⛔ D-16). CSV export.
└── /settings                     Roles, notifications, integrations (env-driven, no secrets in UI)
```

---

## 3. Footer structure

Four columns on desktop, stacked on mobile. Mantra sits above them.

> *"Rooted in the soil, crafted for the soul."* — Fraunces italic, forest green. **Once per page, maximum.**

| Shop | Discover | Business | Legal |
|---|---|---|---|
| All flavours | Our Story | Wholesale | Privacy |
| Build a Box | Ingredients | Corporate orders | Terms |
| Subscriptions | Journal | Contact | Delivery & returns |
| Gifts | Stockists | FAQs | Cookie preferences |
| | | | Accessibility |

---

## 4. Depth constraint

**No page is more than 3 clicks from Home.** Verified:

| Deepest routes | Depth |
|---|---|
| Home → Shop → PDP → Ingredients | 3 |
| Home → Shop → PDP → Cart | 3 |
| Home → Account → Subscriptions → Manage | 3 |
| Home → Footer → Wholesale | 2 |

---

## 5. Site map — visual hierarchy

```
HOME
│
├── SHOP ──────────────┬── Collection ──── PDP ──┬── Ingredients & Fermentation
│                      │                          ├── Cart
│                      ├── Build a Box            └── Related flavours
│                      └── Bundles / Gifts
│
├── SUBSCRIPTIONS
│
├── OUR STORY
├── INGREDIENTS & FERMENTATION
├── JOURNAL ─────────── Entry
├── STOCKISTS
│
├── [footer] WHOLESALE ──── enquiry
├── [footer] CORPORATE ──── enquiry
├── [footer] FAQs
├── [footer] CONTACT
│
├── CART ──── CHECKOUT ──── PAYMENT ──┬── PENDING (first-class, reload-safe)
│                                      ├── SUCCESS
│                                      ├── FAILED
│                                      └── PENDING PAYMENT
│
├── ACCOUNT ──┬── Orders ──── Order detail (+ Reorder)
│             ├── Addresses
│             ├── Subscriptions ──── Manage (skip/pause/swap/cancel — self-serve)
│             └── Details
│
├── [legal] Privacy · Terms · Delivery & Returns · Cookies · Accessibility
│
└── /admin ──── (role-isolated tree, §2.6)
```
