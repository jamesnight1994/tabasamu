# Feature Inventory

**Priority:** P0 = launch blocker · P1 = launch, can slip by days · P2 = post-launch
**Status:** ✅ Specified · ⛔ Blocked on a client decision · ⚠ Blocked on an asset

---

## 1. Design system & foundations

| # | Feature | Pri | Status | Notes |
|---|---|---|---|---|
| F-01 | Colour tokens (5 + forbidden white) | P0 | ✅ | `--cream --terracotta --forest --charcoal --gold`. Build fails on `#FFFFFF` as a ground (NFR-04). |
| F-02 | Type scale — Fraunces / DM Sans / JetBrains Mono | P0 | ✅ | Self-hosted WOFF2, Latin subset, `font-display: swap`. Two preloaded, mono lazy. |
| F-03 | Spacing & layout system | P0 | ✅ | Cream ≥60% of every viewport (P-01). Verified by a screenshot test. |
| F-04 | Logo component (lockup + monogram + reversed) | P0 | ⚠ **A-01…A-04** | Trial font, no monogram, no reversed variants. **Blocks the header and the favicon.** |
| F-05 | Header — solid cream, never over an image | P0 | ✅ | Logo may not sit on a photograph (Brand Book §02). Transparent header is **not permitted.** |
| F-06 | Footer with mantra | P0 | ✅ | Mantra once per page maximum. |
| F-07 | Button system | P0 | ⛔ **D-04** | Terracotta CTA + cream label fails AA below 19px semibold (AX-02). Either enforce a type-size floor or use a charcoal primary. **Needs brand sign-off.** |
| F-08 | Link system | P0 | ✅ | **Links are forest green, not terracotta** (AX-01 — terracotta at body size fails AA at 4.0:1). Terracotta is the hover/focus state. Persistent underline. |
| F-09 | Focus-visible system | P0 | ✅ | 2px forest outline, 2px cream offset. Never `outline: none`. |
| F-10 | Motion system (near-zero) | P0 | ✅ | ≤200ms, opacity + small translate only. No parallax, no scroll-jack, no entrance animation (P-11). |
| F-11 | Copy lint (banned vocabulary) | P0 | ✅ | Build fails on the Brand Book §07 list. Runs on source **and** on published CMS content. |
| F-12 | Colour lint (forest/terracotta adjacency) | P1 | ✅ | P-12 — the two saturated colours may never share a border. |
| F-13 | Gold counter | P2 | ✅ | >2 gold instances per viewport = a defect (P-13). |

## 2. Storefront — browse & discover

| # | Feature | Pri | Status | Notes |
|---|---|---|---|---|
| F-14 | Home — editorial hero | P0 | ⚠ **A-08** | Needs composition (iii) with negative space for overlaid type. **No existing asset supports this.** |
| F-15 | Home — the claim, once | P0 | ✅ | *"Caffeine-free. Sugar-honest. Brewed in Nairobi."* (P-04) |
| F-16 | Shop — flavour grid | P0 | ⛔ **D-01** ⚠ **A-07/A-08** | Catalogue unmodellable (3 vs 6 flavours). No square/portrait crops exist. |
| F-17 | Product card — strip swatch + ingredient cue + forward note | P0 | ✅ | The label is uniform; discovery must not rely on it (P-06). Must be distinguishable at 160px, in greyscale. |
| F-18 | Stock state, factual | P0 | ⛔ **D-27** | "Two bottles remaining." Never "Almost gone!" (P-07). |
| F-19 | Collections | P1 | ⛔ **D-45** | Taxonomy not decided. |
| F-20 | Search | P2 | ⛔ **D-48** | **Recommend omitting at launch** — the range is too small to warrant it. |
| F-21 | Related flavours (PDP) | P1 | ✅ | |

## 3. Product detail

| # | Feature | Pri | Status | Notes |
|---|---|---|---|---|
| F-22 | PDP — DOM order: what → where from → what's in it → how to buy | P0 | ✅ | Binding (P-05). Never buy-then-justify. |
| F-23 | Image gallery | P0 | ⚠ **A-08** | Needs packshots, square crops, cut-outs. **None exist.** |
| F-24 | Provenance block | P0 | ⛔ **D-49** | Named farms/regions not supplied. **Will not be invented.** |
| F-25 | Ingredients & nutrition panel | P0 | ⛔ **D-05** | **No nutritional data supplied. Will not be invented (NN-05).** |
| F-26 | Calm buy box | P0 | ✅ | Small, low-figure (N-03, P-02). |
| F-27 | Size variant selector | P0 | ⛔ **D-02** | 500ml vs 1L unresolved. |
| F-28 | Subscribe / one-time toggle | P0 | ⛔ **D-08** | **Neutral weight.** Never subscribe-first (anti-E-04). |
| F-29 | **Zone selector + delivery fee, on the PDP** | P0 | ⛔ **D-21…D-23** | **P-03. The single most important trust feature in the KE market.** Fee must be known *before* the cart. |
| F-30 | Link to Ingredients & Fermentation | P0 | ✅ | One click from every PDP (P-15). |
| F-31 | Notify-me when back in stock | P1 | ✅ | |
| F-32 | Sticky mobile add-to-cart | P1 | ✅ | Adopted from E-01. |

## 4. Build-a-Box

| # | Feature | Pri | Status | Notes |
|---|---|---|---|---|
| F-33 | Box picker | P0 | ⛔ **D-06** | Box size (4/6/12) unknown. |
| F-34 | Live running count | P0 | ✅ | *"Four of six chosen."* Never *"Only 2 to go!"* |
| F-35 | Persistent summary at 360px | P0 | ✅ | **Must not occlude the picker.** This is where E-07's implementation fails. |
| F-36 | Live price update | P0 | ⛔ **D-14, D-17** | Pricing and bundle-discount rule unknown. |
| F-37 | **Full keyboard operability** | P0 | ✅ | Explicit anti-pattern AP-09. The reference implementations all fail this. |

## 5. Subscriptions

| # | Feature | Pri | Status | Notes |
|---|---|---|---|---|
| F-38 | Subscription creation | P0 | ⛔ **D-07, D-09** | Frequencies and billing model unknown. |
| F-39 | **Skip a delivery** | P0 | ✅ | Self-serve. One tap. **No contact required.** |
| F-40 | Pause / resume | P0 | ✅ | Self-serve. |
| F-41 | Swap flavour | P0 | ✅ | Self-serve, for the next delivery. |
| F-42 | Change frequency / date / address / payment | P0 | ✅ | All self-serve. |
| F-43 | **Cancel** | P0 | ✅ | **One tap. No retention gauntlet, no interstitial, no "are you sure" chain.** A brand-voice requirement: *"we invite, we never instruct."* |
| F-44 | Subscriber discount | P1 | ⛔ **D-08** | |

## 6. Cart & checkout

| # | Feature | Pri | Status | Notes |
|---|---|---|---|---|
| F-45 | Cart (persistent) | P0 | ✅ | localStorage + server-side when authenticated. |
| F-46 | Coupon field | P1 | ⛔ **D-18, D-19** | **A field and a line item. No banner, no timer, no badge** (P-07). |
| F-47 | Delivery zone + fee in cart | P0 | ⛔ **D-21…D-25** | |
| F-48 | Guest checkout | P0 | ✅ | An account is **never** forced. |
| F-49 | Separate billing / delivery address | P0 | ✅ | Required by the gift journey. |
| F-50 | Gift note; **no pricing on the packing slip** | P1 | ⛔ **D-44** | |
| F-51 | Checkout styled as Tabasamu, end-to-end | P0 | ✅ | **P-08.** No visual handoff to a payment vendor. |
| F-52 | Per-item delivery estimate | P1 | ⛔ **D-23** | Adopted from E-08 — a KE baseline expectation. |
| F-53 | **No upsells, no order bumps, no exit-intent** | P0 | ✅ | AP-01…AP-03. Enforced by review. |

## 7. Payments

| # | Feature | Pri | Status | Notes |
|---|---|---|---|---|
| F-54 | Phone normalisation (`07…`/`+254…`/`7…` → `2547XXXXXXXX`) | P0 | ✅ | **Lives in the DOMAIN layer, not in a component** (NN-06). |
| F-55 | **STK push explained before it fires** | P0 | ✅ | Adopted from E-05. The customer knows the prompt is coming. |
| F-56 | M-PESA STK initiation | P0 | ⛔ **D-31, D-32** | Shortcode and Daraja credentials not supplied. Env placeholders only (NN-03). |
| F-57 | **Honest pending state with a real countdown** | P0 | ✅ | Never claims success. Never guesses. |
| F-58 | **Pending state survives reload + connection drop** | P0 | ✅ | **The single hardest technical requirement in the build.** Server-authoritative, keyed by `CheckoutRequestID`. |
| F-59 | M-PESA callback webhook (idempotent, validated) | P0 | ⛔ **D-32** | Backend. Spec in `12_`. |
| F-60 | Three distinct outcome routes: success / failed / pending | P0 | ✅ | **Not one generic error page.** Guessing about a customer's money destroys trust. |
| F-61 | M-PESA reference surfaced to the customer | P0 | ⛔ **D-33** | In JetBrains Mono. **Strongly recommended** — it is the primary support key in Kenya. |
| F-62 | Stripe Payment Element, embedded & styled | P1 | ⛔ **D-34, D-35** | ⚠ **D-35 is a commercial blocker: Stripe may not settle KES for a Kenyan entity.** An alternative card rail (Flutterwave / Pesapal / DPO) may be required. **This is a Phase 1 finding, not a Phase 6 surprise.** |
| F-63 | Auto-cancel window for `pending_payment` | P1 | ⛔ **D-38** | **Orders will not be auto-cancelled without an explicit rule.** |

## 8. Content

| # | Feature | Pri | Status |
|---|---|---|---|
| F-64 | Our Story | P0 | ⚠ Content exists in the Brand Book, but ⛔ **D-50** — the Brand Book's own origin story says *hibiscus, ginger, turmeric*, while the product is **rooibos**. **An internal contradiction in the binding document. Cannot write this page until resolved.** |
| F-65 | Ingredients & Fermentation | P0 | ⛔ **D-49, D-50** | Named farms/regions not supplied. |
| F-66 | Journal index + entry | P1 | ⛔ | No editorial content supplied. |
| F-67 | Stockists | P1 | ⛔ **D-10** | |
| F-68 | FAQs | P1 | ⛔ **D-46** | **Will not be invented.** |
| F-69 | 404 / 500, written in-voice | P1 | ✅ | No jokes. No exclamation marks. |

## 9. Legal & trust

| # | Feature | Pri | Status |
|---|---|---|---|
| F-70 | **Delivery & Returns** | P0 | ⛔ **D-21…D-26, D-36** | **The most important trust page in the KE market (P-03).** Quiet ≠ vague (the E-06 lesson). |
| F-71 | Privacy (Kenya DPA 2019) | P0 | ⛔ **D-43** | |
| F-72 | Terms | P0 | ⛔ | **No legal copy supplied. Will not be invented (NN-05).** |
| F-73 | Cookie preferences (granular) | P0 | ✅ | Not a dismiss-only banner. |
| F-74 | **Accessibility statement** | P1 | ✅ | States the WCAG 2.2 AA target and the known palette constraint (AX-01). |

## 10. Accounts

| # | Feature | Pri | Status |
|---|---|---|---|
| F-75 | Register / login / password reset | P0 | ✅ |
| F-76 | Order history | P0 | ✅ |
| F-77 | **Reorder — one tap → pre-filled cart** | P1 | ✅ |
| F-78 | Address book | P0 | ✅ |
| F-79 | Subscription management | P0 | See F-38…F-44 |

## 11. Notifications

| # | Feature | Pri | Status |
|---|---|---|---|
| F-80 | Order confirmation email | P0 | ⛔ **D-40** |
| F-81 | **SMS confirmation** | P0 | ⛔ **D-41** | **In Kenya, SMS is the expected channel — more than email.** Strongly recommended. |
| F-82 | WhatsApp | P1 | ⛔ **D-42** | ⚠ **If WhatsApp remains an *ordering* channel alongside the cart, there are two intake paths and inventory will drift.** Must be decided before the data model is fixed. |
| F-83 | Abandoned cart | P2 | ⛔ **D-30** | ⚠ An abandoned-cart email is, by nature, a nudge. Requires copy sign-off against the brand voice. |

## 12. Admin portal

| # | Feature | Pri | Status |
|---|---|---|---|
| F-84 | Product & variant CRUD | P0 | ✅ |
| F-85 | **Stock adjustment — one field** | P0 | ✅ |
| F-86 | **Fulfilment view grouped by DELIVERY ZONE, not by time** | P0 | ⛔ **D-21** | This is how Nairobi deliveries are actually routed. |
| F-87 | Printable run sheet with customer phone numbers | P0 | ✅ | The rider will call. |
| F-88 | **Order lookup by phone AND by M-PESA reference** | P0 | ✅ | **The customer will quote the M-PESA code, not an order number.** |
| F-89 | Read-only payment webhook history | P0 | ✅ | Raw callback payload viewable by customer care. |
| F-90 | Re-trigger a failed STK push (idempotent, logged) | P1 | ✅ |
| F-91 | **Refunds presented as a task with a state — never one-click** | P1 | ⛔ **D-36, D-37** | **M-PESA refunds are a manual B2C reversal. The UI must not pretend otherwise.** |
| F-92 | Coupon management | P1 | ⛔ **D-18** |
| F-93 | Delivery zone / fee CRUD | P0 | ⛔ **D-21…D-23** |
| F-94 | Content editing (draft → preview → publish) | P1 | ✅ |
| F-95 | **Copy lint blocks publishing banned vocabulary** | P1 | ✅ | The editor is the person most likely to write "wellness journey". |
| F-96 | **Role isolation** (editor cannot see orders/customers/payments) | P0 | ✅ | A requirement, not a nicety. |
| F-97 | Reports + CSV export | P1 | ⛔ **D-16** | VAT unknown. |
| F-98 | Batch calendar (next-batch dates) | P2 | ⛔ **D-29** | Small-batch fermentation makes stock-outs normal. *"Next batch bottles on {date}"* is more on-brand than a dead end. |

---

## Summary

| | Count |
|---|---|
| Total features | 98 |
| **P0 (launch blockers)** | **52** |
| ✅ Fully specified, buildable now | 38 |
| ⛔ **Blocked on a client decision** | **52** |
| ⚠ **Blocked on an asset** (photography / logo) | 8 |

> **53% of the feature set is blocked on information that has not been supplied.** This is not a criticism of the client — it is the expected output of a discovery phase done honestly. Every one of these is in the Client Decisions Register with a specific question. **None has been guessed.**
