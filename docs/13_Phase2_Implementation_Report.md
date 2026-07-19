# Phase 2 Implementation Report
## Technical Architecture, Design System & Application Foundation

**Date:** 14 July 2026
**Status:** Complete. All six verification gates green.
**Type:** Foundation. **No storefront pages built** — that is Phase 3, and it remains blocked on the photography sprint (R-03).

---

## 1. Inspection Summary

Before writing any code I inspected the Phase 1 repository (13 documents), the Brand Book v1.1, the supplied logo asset, and the five product photographs.

### 1.1 What Phase 1 handed over

| Artefact | Consequence for Phase 2 |
|---|---|
| 15 design principles (P-01…P-15) | Encoded as tokens and enforced by lint |
| 7 non-negotiables (NN-01…NN-07) | Three are now mechanically enforced (see §6) |
| 3 accessibility rules (AX-01…AX-03) | Contrast ledger + CI audit |
| Port/adapter architecture | Built as `src/ports` + `src/adapters` |
| 52 client decisions, 9 blocking | 4 answered this session; **6 remain and are visible in the UI** |
| 28 risks | R-03, R-04, R-10, R-13, R-15 all materially addressed |

### 1.2 Blocking decisions resolved by the client this session

| ID | Decision | Effect |
|---|---|---|
| **D-01** | **Six flavours** | Grape Ginger, Pineapple, Pineapple Ginger, Beetroot, Passion, Gooseberry |
| **D-02** | **1 Litre** | The Brand Book's 500ml packaging spec (§06) is **superseded**. Every photograph agrees with the client. |
| **D-03** | **Strip colours supplied** | Passion `#0B8BFF`, Beetroot `#8B2635`, Gooseberry `#4A7C59` |
| **D-04** | **Option (a)** | Primary CTA = charcoal/cream. Terracotta = secondary/outline. |

### 1.3 Conflicts found and how each was resolved

**Conflict 1 — bottle size.** The Brand Book §06 specifies a 500ml packaging system; the client and every photograph say 1 Litre.
→ **Resolved.** The client's confirmation governs. `SIZE_1L` is the only size in the domain. The Brand Book's §06 dimension spec is treated as superseded and this is recorded, not silently overwritten.

**Conflict 2 — the flavour strips break the palette.** Four of the six strip colours (`#4A2A55`, `#E9C25B`, `#0B8BFF`, `#4A7C59`) are **outside the five-colour Brand Book palette**. Passion's `#0B8BFF` is a saturated digital blue that shares nothing with a system built from clay, soil and cream.
→ **Resolved by quarantine, not by compromise.** A flavour strip is a *packaging* system, not a *web* system. On the site a strip appears **only** as a small identifying swatch beside the flavour name. It is never a card background, a section fill, or a button. `FlavourSwatch` is the **only** component permitted to consume a strip hex, and `scripts/check-brand.mjs` **fails the build** if a strip hex appears anywhere else. This preserves the palette the Brand Book exists to protect while still honouring the client's colour decision.

**Conflict 3 — D-04 was an accessibility failure, not a preference.** Terracotta `#C05A2C` on cream `#FDF6F0` measures **4.14:1**. WCAG AA requires **4.5:1** for normal text. The brand's *primary* colour could not legally be the primary button.
→ **Resolved.** The client authorised option (a). Primary CTA is now charcoal on cream at **12.87:1** (AAA). Terracotta survives as an outline CTA — where it is a *border* (needing only 3:1) with a *charcoal* label. The solid-terracotta `accent` variant is retained for large-format CTAs only, and the component **force-upgrades it to `lg` at runtime**, because 4.14:1 does clear the 3:1 large-text threshold. The rule is enforced in code, not left to a designer to remember.

**Conflict 4 — the error colour collides with Beetroot.** Both are `#8B2635`.
→ **Deliberate, and kept.** The error colour was chosen from the Beetroot family so the palette stays coherent. The brand lint distinguishes them: `#8B2635` is legal **only** when bound to `--color-error`, and is a violation anywhere it is used as a raw flavour colour.

---

## 2. ⚠ Logo Remediation (R-04) — Required, Performed, Needs Sign-Off

**The supplied `Final_Logo.svg` was re-uploaded but was NOT remediated.** It is byte-identical in its defects to the asset Phase 1 flagged. I inspected it directly rather than assuming:

| Defect | Evidence |
|---|---|
| Wordmark is **live `<text>`**, not vector outlines | 1 `<text>` element, 5 `<path>` |
| Set in **"Canela Trial"** — an **unlicensed trial font** | `font-family:'Canela Trial'` |
| **Not** the Brand Book's specified Fraunces Medium | Brand Book §02 |
| **No monogram** | Only the 5 sun-mark paths exist |
| **No reversed/cream variants** | Single two-colour version |
| A4 page viewBox, not a tight logo bbox | `794.67 × 1122.67` |

A live `<text>` wordmark in an unlicensed font renders as a **system serif on every machine that lacks it** — i.e. every customer's machine.

**What I did:**
1. **Extracted** the monogram — the five terracotta paths were sound (bbox 131.98 × 120.16).
2. **Re-cut the wordmark** by outlining **Fraunces Medium** (OFL, `wght 500`, `opsz 72`) at **−20 tracking** — the actual Brand Book spec — into 12 real vector paths via `fontTools`.
3. **Generated** the reversed cream variants the Brand Book requires.

**Delivered (7 assets, `public/brand/`):** `lockup-primary`, `lockup-cream`, `monogram-terracotta`, `monogram-cream`, `monogram-forest`, `wordmark-forest`, `wordmark-cream`.

> ⚠ **These assets require designer sign-off.** They are a faithful *execution of the written specification*, not an approved artwork. The monogram is the client's original; the wordmark is a mechanical outlining of the font the Brand Book names.

**The monogram is not a nicety — it is load-bearing.** The full lockup has a 120px digital minimum. At 360px, a 120px lockup plus a cart control plus a menu control does not fit with 44px touch targets. The header therefore uses the **monogram** on mobile. Without one, the mobile header is unsolvable.

---

## 3. What Was Built

### 3.1 Stack

Next.js 15.5 (App Router, Turbopack) · React 19 · TypeScript **strict** · Tailwind v4 (CSS-first `@theme`) · Radix primitives · Zod · Vitest.

### 3.2 Architecture — dependencies point inward

```
tokens ← domain ← ports ← adapters
            ↑        ↑        ↑
            └── components ───┘   (components may NOT import adapters)
                     ↑
                    app                (the composition root)
```

| Layer | Contents | Rule |
|---|---|---|
| `src/tokens` | Single source of truth for every design value | No hex codes anywhere else |
| `src/domain` | Money, phone, pricing, payment, catalogue | **Pure TS. Zero React. Zero I/O.** |
| `src/ports` | The typed backend contract | Interfaces only |
| `src/adapters` | `mock` (working) + `http` (stub) | The only place a concrete impl exists |
| `src/components` | Primitives, commerce, layout | Depends on **ports**, never adapters |
| `src/app` | Routes | The composition root |

**This is enforced by `eslint-plugin-boundaries` and a violation fails the build.** I verified it adversarially: a component importing an adapter, and the domain importing React, both produce hard errors.

### 3.3 The domain layer

- **`Money`** — integer minor units. Never a float. `0.1 + 0.2` is exactly `0.30`, and a 1,000-item summation drifts by zero.
- **`normalisePhone`** — the M-PESA-critical function. Accepts every shape a Kenyan customer actually types (`0712…`, `+254…`, `254…`, `(0712) 345 678`) and returns `2547XXXXXXXX`.
- **`calculateTotals`** — the core pure function. Discounts apply to the subtotal, never to delivery. Totals can never go negative.
- **`resolveOutcome`** — the three-state payment model (§4).
- **`Unavailable`** — the honest-absence type (§5).

### 3.4 Design system

- **Colour:** 5 palette colours + derived tonal steps. **Pure white is forbidden as a ground** (NN-01) — the canvas is cream `#FDF6F0`.
- **Type:** Fraunces (display) / DM Sans (UI) / JetBrains Mono (spec register only). Self-hosted, Latin-subset, variable WOFF2 — **58 KB + 36 KB + 20 KB**. Only the first two are preloaded; JetBrains Mono never appears above the fold (R-27).
- **Fluid scale:** authored at **360px**, capped at 1440px, via `clamp()`.
- **Motion:** ≤200ms, opacity + small translate only, removed entirely under `prefers-reduced-motion` (P-11).
- **Touch:** 44px minimum on every interactive element.

### 3.5 Components

**Primitives** — Logo, Button, Field/Input/PhoneInput/Textarea/Select/Checkbox/RadioGroup/Switch/QuantityControl, Card, Badge, SectionHeader, EditorialQuote, Breadcrumbs, ResponsiveImage, Skeleton, EmptyState, ErrorState, Pagination, Dialog, Drawer, Tabs, Accordion, Toast.

**Commerce** — PriceDisplay, FlavourSwatch, StockStatusDisplay, PendingValue.

**Layout** — Header, Footer, SkipLink, AnnouncementStrip, MobileActionBar.

All are rendered live at **`/catalogue`** — a route, not a separate Storybook, so components are exercised in the *real* app with the *real* cascade.

---

## 4. ⚠ The M-PESA Three-State Model

This is the single most important design decision in the codebase.

An M-PESA payment has **three** genuinely different terminal outcomes:

```
initiated → pending → succeeded
                 │
                 ├──▶ failed    (cancelled / no funds / wrong PIN)
                 └──▶ unknown   ⚠ NO CALLBACK EVER ARRIVES
```

**`unknown` is a first-class state and is NEVER collapsed into `failed`.**

If the site tells a customer "payment failed" when the money *did* leave their account, they will pay twice — and the brand loses them permanently. So:

- `isFailure('unknown')` returns **`false`**. There is a unit test asserting this.
- The unknown-state copy says: *"Do not pay again. If the money left your account, we will find it and confirm by SMS."* — and it offers **no retry button**, because a retry is how you get a double charge.
- The mock gateway simulates all three outcomes (~75% / ~18% / **~7% unknown, where the callback never arrives**). Building against a mock that always succeeds guarantees this bug ships.
- Payment state is **server-authoritative**, keyed by the `CheckoutRequestID`, so a pending payment survives a page reload and a dropped connection.

---

## 5. ⚠ Nothing Was Invented (NN-05)

Six decisions remain unanswered. Every one is **visible in the UI**, carrying its decision ID — not quietly filled in with something plausible.

The mechanism is the `Unavailable` type. A blocked field is **not** `null`, **not** `''`, and **not** a plausible guess. It carries the ID of the decision that blocks it, and `PendingValue` renders it as a visible ⛔ marker.

**If a ⛔ marker reaches production, that is the system working.** It means a real question is still open, and it is now impossible to miss.

| ID | Blocked | Why it was not guessed |
|---|---|---|
| **D-05** | Ingredients + nutrition | **Regulated food information.** |
| **D-13** | "Caffeine Free" *or* "Gluten Free"? | The artwork **disagrees with itself**. These are different regulated claims. Neither appears in any title, meta description, or OG tag. |
| **D-14** | Approved price | **No price exists.** Every price renders with a visible *"indicative"* marker. A placeholder that looks real ends up in a screenshot someone believes. |
| **D-21/22/23** | Delivery zones, fees, lead times | `MOCK_ZONES` is **empty by design**. Inventing "Westlands · KES 200" would invent a delivery promise. The cart **total** therefore stays `Unavailable` until a zone exists — we do not show a number that will change. |
| **D-16** | VAT status | **No tax logic is written.** `tax` is `Unavailable`, not `zero()`. Rendering "VAT: KES 0.00" would be an invented claim about the trading entity. |
| **D-35** | Can Stripe settle KES? | The payment port is `'mpesa' \| 'card'` — **not** `'stripe'`. If Stripe cannot settle KES for a Kenyan entity, the rail must become Flutterwave/Pesapal/DPO. The abstraction makes that swap survivable. |
| **D-50** | Rooibos *or* hibiscus? | The labels say rooibos (South African); the Brand Book's origin story says *"Kenyan-grown hibiscus"*. **The brand's central "Kenyan soil" claim is at stake.** |
| **D-52** | Six-day *or* fourteen-day ferment? | The two source documents disagree. A specific number that is wrong is worse than no number. |

**Product structured data is deliberately NOT emitted.** `schema.org/Product` needs a price. Emitting `offers` with a placeholder would publish a false commercial claim to Google.

---

## 6. Rules Made Mechanical

A rule that lives only in a document gets broken in month four by someone who never read it. These now **fail the build**:

| Script | Enforces |
|---|---|
| `lint:contrast` | Every permitted colour pair meets AA — **and** verifies that gold (2.67:1) and terracotta (4.14:1) still *correctly fail* as body text. A stale guardrail is caught. |
| `lint:brand` | NN-01 (no white ground) · R-15 (flavour-hex quarantine) · AX-03 (gold never text) · P-11 (motion ≤200ms) · P-07 (no urgency, no "!") · Brand Book §07 banned vocabulary · invented health claims |
| `lint:secrets` | Scans the **built bundle** for credential-shaped strings (NN-03) |
| `eslint` | The architectural boundaries (R-13/NN-06) |

I verified each adversarially by planting violations. All fired.

---

## 7. Defects Found and Fixed During Verification

The verification chain earned its place — it caught three real bugs that a passing build would have shipped.

### 7.1 ⚠ A foreign phone number could have been coerced into a Kenyan one

The unit test for `+447911123456` (UK) failed: it was rejected as `wrong_length` rather than `not_kenyan`. It failed *by accident*, for the wrong reason.

**The latent bug:** a foreign number with nine trailing digits could have been silently mangled into a well-formed `2547XXXXXXXX`. **The consequence is an M-PESA payment prompt sent to a stranger's handset.**

**Fixed.** Foreign country codes are now rejected *explicitly and first*. The test suite was broadened to cover UK, USA, India, South Africa, and — critically — **Tanzania (+255) and Uganda (+256)**, which are one digit away from Kenya's +254.

### 7.2 The server env schema was being pulled into the client bundle

`scripts/check-secrets.mjs` fired on the first real build. Investigation showed the chain: `error.tsx` (client) → `logger` → `clientEnv()` → `env.ts`, which held **both** schemas in one module.

Today that shipped only harmless *field names*. But the moment anyone writes `MPESA_PASSKEY: z.string().default('...')`, that default becomes a **live credential in a public JavaScript file**.

**Fixed.** The server schema moved to `server-env.ts` carrying `import 'server-only'` — so a client importing it is now a **build error**, not a silent leak.

### 7.3 A component was importing an adapter

The boundary lint caught `Price.tsx` importing `PLACEHOLDER_PRICES` from `adapters/mock/fixtures`. It worked — and would have **broken at Gate G2** when adapters swap to HTTP and the mock ceases to exist.

**Fixed.** "Has a price been approved?" is a *business fact*, not a mock artefact. It moved to `domain/catalogue`, where it remains true after the backend lands.

---

## 8. Verification — All Six Gates Green

```
1/6  ESLint (incl. architectural boundaries) ...... ✓ 0 errors, 0 warnings
2/6  TypeScript strict ........................... ✓ 0 errors
3/6  Contrast audit (WCAG 2.2 AA) ................ ✓ PASS
4/6  Brand lint .................................. ✓ PASS
5/6  Secret scan (client bundle) ................. ✓ PASS
6/6  Test suite ................................. ✓ 90/90 passing
     Production build ............................ ✓ 7/7 routes prerendered
```

**Performance:** First Load JS **102 kB shared** — comfortably inside the Nairobi-3G budget that P-10 demanded.

**Verified in the prerendered artifact:** 5 × `D-14` placeholder markers, 2 × `D-51` pending markers, Gooseberry correctly *absent* from the storefront (draft — no photograph exists), and the Beetroot "Asset missing" fallback rendering rather than a broken image.

---

## 9. ⚠ Photography Is Now the Critical Path (R-03)

**The photo library cannot support an ecommerce site**, and this now blocks Phase 3.

What exists: **four** usable 16:9 landscape lifestyle frames.
What is missing: **packshots, square crops, 4:5 portraits, cut-outs, back-labels, process shots.**

| Asset | Status |
|---|---|
| Grape Ginger, Pineapple, Pineapple Ginger, Passion | ✓ one lifestyle frame each |
| **Beetroot** | ⚠ **label typography is illegible** — unusable on a PDP. Must be reshot. (A-05) |
| **Gooseberry** | ⛔ **no photograph exists.** Cannot be merchandised. Ships as `draft`. (A-07) |

The site renders an honest "⛔ Asset missing" state for these rather than a broken image — but that is a *scaffold*, not a solution.

**There is a deeper problem the photography brief must solve (R-12):** the Brand Book's label system is *uniform by design* — only the bottom strip changes. At a 160px grid thumbnail, in greyscale, **all six bottles look identical.** The swatch-plus-name treatment in `FlavourSwatch` mitigates this, but the real fix is art direction.

---

## 10. Gate G2 — The Backend Handover

The handover is designed as a **one-line environment change**:

```
NEXT_PUBLIC_ADAPTERS=mock  →  NEXT_PUBLIC_ADAPTERS=http
```

The acceptance test is in `tests/unit/adapters.g2.test.ts`. It runs the flow suite against the adapter set through the `Adapters` interface. Today the `http` entry is commented out because the backend does not exist; **at G2 it is uncommented and must pass unchanged.**

If it fails, backend logic has leaked above the adapter layer — and it is caught *there*, not in production.

The `http` adapter throws `NotImplemented` on every method rather than returning plausible fakes, because a silently-fake adapter would let this very gate pass against nothing (NN-04).

---

## 11. What Phase 3 Needs

**Blocking (cannot start without):**
1. **Photography sprint** (R-03) — Beetroot reshoot, Gooseberry shoot, packshots, portrait crops.
2. **D-50** — rooibos or hibiscus? The homepage cannot be written without knowing what the product *is*.
3. **D-13** — the product descriptor. It appears in every page title.

**Blocking checkout (Phase 5–6, but decide now — they have long lead times):**
4. **D-14** — approved prices.
5. **D-21/22/23** — delivery zones, fees, lead times.
6. **D-31/32** — M-PESA Daraja credentials + shortcode.
7. **D-35** — **verify with Stripe directly** whether KES settlement is possible for a Kenyan entity. If not, the card rail must be re-chosen.

**Also outstanding:** designer sign-off on the remediated logo assets (§2).

---

## 12. Files Not Yet Generated

`favicon.ico`, `apple-touch-icon.png`, `manifest.webmanifest`, `og-default.png` are referenced in metadata but not produced — they derive from the logo, which is pending sign-off. Generating them now would mean regenerating them after.
