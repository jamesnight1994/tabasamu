# 63 · Content & Placeholder Register

The single list of everything the site is **honestly missing** — every gap where
a business, legal, or brand fact has not been supplied and therefore renders as a
visible "awaiting confirmation" placeholder rather than an invented value. This
is the content owner's punch-list: **answer these, and the placeholders resolve.**

The commercial/legal decisions themselves live in the **Client Decisions
Register (doc 08)**; this register is the *content-and-asset view* of the same
truth, plus the image/alt/legal inventories the handover requires.

> **Rule that governs this whole register:** nothing here is guessed. A missing
> regulated or commercial fact is logged, never filled with a plausible value.
> [NN-05] When a decision is answered, the placeholder is replaced with the
> confirmed value and removed from this list.

---

## 1. Decisions already answered (2026-07-14) — no longer placeholders

| ID | Answer | Effect |
|---|---|---|
| **D-01** | **Six flavours** (Grape Ginger, Pineapple, Pineapple Ginger, Beetroot, Passion, Gooseberry) | Catalogue modelled at six SKUs |
| **D-02** | **1 Litre** | Variant size is `1L`; Brand Book's 500ml spec superseded |
| **D-03** | Strip colours for Passion/Beetroot/Gooseberry **supplied** | Used, but off-palette → quarantined (see §4) |
| **D-13** | **"Caffeine Free"** | Approved descriptor; "Gluten Free" frame is a mislabel |
| **D-50** | **Rooibos** is the base | Provenance copy must be honest: rooibos is not Kenyan-grown |

## 2. Blocking content gaps (regulated / commercial — still open)

Each renders as an "awaiting confirmation" panel and is typed `Pending<T>` in the
domain. **A PDP cannot fully ship until D-05/D-14 are answered.**

| ID | What's missing | Where it shows | Owner |
|---|---|---|---|
| **D-05** | Ingredients list + nutrition, per flavour (**regulated**) | Every PDP, FAQ | Client |
| **D-14** | Approved retail price per flavour | Everything commercial; product JSON-LD withheld until set | Client |
| **D-49** | Named farms/regions per ingredient (provenance) | PDP, Ingredients | Client |
| **D-51** | Forward notes for Passion, Beetroot, Gooseberry | Product cards, PDP | Client/studio |
| **D-52** | Fermentation period — 6 days (Brand Book) or 14 (Strategy)? | Ingredients, PDP | Client |
| **D-21/22/23** | Delivery zones, fees, lead times | Cart, checkout, PDP quote | Client/ops |
| **D-25/26** | Free-delivery threshold; pickup offering | Delivery & Returns | Client/ops |
| **D-27** | Low-stock threshold | Stock messaging | Client |
| **D-16** | VAT status / price inclusivity | Totals, invoices (`taxIncluded` stays `null`) | Client/finance |

## 3. Image inventory

**Present and used** (`public/`):

| Asset | Use |
|---|---|
| `brand/lockup-primary.svg`, `lockup-cream.svg` | Full logo lockups |
| `brand/wordmark-forest.svg`, `wordmark-cream.svg` | Wordmark |
| `brand/monogram-{terracotta,forest,cream}.svg` | Monogram / favicon source |
| `brand/apple-touch-icon.png`, `og-default.png` | PWA + social share (generated from marks) |
| `products/{grape-ginger,pineapple,pineapple-ginger,passion}.jpg` (+ `-portrait`) | Product/lifestyle shots |
| `fonts/*.woff2` | Fraunces, DM Sans, JetBrains Mono (self-hosted) |

**Placeholder / action-required images:**

| Slot | Status | Action |
|---|---|---|
| **Beetroot** product image | **A-05 — supplied frame has illegible label typography** | **Reshoot required** (placeholder shown by client decision) |
| **Gooseberry** product image | **A-07 — no photograph exists** | **Shoot required** (placeholder shown by client decision) |
| `journal-preview` | Illustration placeholder | Confirm if Journal ships at launch |

> Beetroot and Gooseberry render an "awaiting photography" panel, never a broken
> image. All photography must follow the Brand Book §05 rules (natural golden-hour
> light, real Kenyan ceramic/acacia, no flash, no teal-orange grade, no tourism
> shorthand).

## 4. Off-palette strip colours (brand quarantine)

Passion (blue) and Beetroot (deep red) strip colours were supplied (D-03) but are
**not** in the five-colour Brand Book palette. They are used per client decision
but quarantined and flagged, because using off-palette colour is a Brand Book
deviation that a brand owner — not a developer — should ratify. Confirm these are
intentional and permanent, or supply on-palette replacements.

## 5. Alt-text inventory

Every image slot carries descriptive alt text (see `src/content/image-slots.ts`),
written to the a11y baseline (doc 16). Alt text describes the scene, not "image
of". When real Beetroot/Gooseberry photography arrives, update the corresponding
alt to match the actual shot.

## 6. Required legal copy (not written — must be supplied/approved)

| Page | Needs | Decision |
|---|---|---|
| Privacy | ODPC/Kenya DPA 2019 registration status; data-handling specifics | D-43 |
| Terms | Trading entity, jurisdiction, returns policy | Client/legal |
| Delivery & Returns | Zones, fees, lead times, returns/refund policy | D-21..26, D-36/37 |
| Cookie preferences | Actual categories in use once analytics vendor chosen | D-43, D-45 |
| Contact | Support phone/email/hours, WhatsApp role | D-42 |

Legal pages currently present the honest structure with "awaiting confirmation"
where a fact is owed; they must not be filled with boilerplate that misstates the
entity's obligations.

## 7. Required delivery rules
D-21 (zones), D-22 (fees), D-23 (lead times), D-24 (outside Nairobi), D-25
(free-delivery threshold), D-26 (pickup). All arrive as `DeliveryConfig`; none is
hard-coded.

## 8. Required pricing
D-14 (retail price/flavour), D-16 (VAT), D-17 (bundle discount), D-08
(subscriber discount), D-18/19 (coupon stacking / first-order). No price is
displayed or hard-coded until approved.

## 9. Required nutrition information
D-05, per flavour — regulated, will not be invented. Blocks product publish
server-side.

## 10. Required customer-support details
D-33 (surface M-PESA reference to care — recommended), D-40 (email provider),
D-41 (SMS provider — expected channel in Kenya), D-42 (WhatsApp role).

## 11. Placeholder register (env / feature-flag view)

| Placeholder | State | Blocked on |
|---|---|---|
| All M-PESA credentials | env placeholders, server-only | D-31, D-32 |
| Card provider + keys | `CARD_PROVIDER=none` | D-34, D-35 |
| Email/SMS provider keys | empty | D-40, D-41 |
| Auth provider/session secret | `AUTH_PROVIDER=none` | D-53, D-54, D-55 |
| Backend API URL | empty; adapters stay `mock` | Gate G2 |
| `subscriptions` flag | off | D-09 |
| `buildABox` flag | off | D-06 |
| `cardPayments` flag | off | D-35 |
| `siteSearch` flag | off | D-48 (deliberately omitted) |
| `gifting` flag | off | D-44 |
| `batchCalendar` flag | off | D-28/29 |
| `promotions` flag | off | D-19 (and: never urgency-framed, P-07) |
| `stockists` flag | off | D-10 |

**Every item above is honest and intentional.** Resolving each is a client or
provider decision, not a bug to fix in code.
