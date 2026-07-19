# Phase 4 Implementation Report
## Product Catalogue, Search, Filtering, Product Detail & Bundles

**Date:** 14 July 2026
**Status:** Complete. All six gates green. **211/211 tests passing.** 15/15 routes built.

---

## 1. Inspection Summary

### 1.1 ✅ The photography arrived

Five images supplied. **Four usable, one not.** I zoomed into every label rather than judging from thumbnails.

| Flavour | Label reads | Verdict |
|---|---|---|
| Grape Ginger | "Caffeine Free Rooibos Kombucha" | ✅ Clean |
| Passion | "Caffeine Free Rooibos Kombucha" | ✅ Clean |
| Pineapple Ginger | "Caffeine Free Rooibos Kombucha" | ✅ Clean |
| **Pineapple** | ⚠️ **"GLUTEN FREE Rooibos Kombucha"** | ⚠️ Used — artwork defect |
| **Beetroot** | *illegible* | ⛔ **A-05 stands** |
| **Gooseberry** | — | ⛔ **A-07 — none exists** |

### 1.2 ⚠️ Two findings that needed a decision

**Beetroot is still garbled.** The wordmark letterforms are distorted and the descriptor line is illegible noise — a generation artefact, not a photograph of a real label. It cannot go on a page where the label *is* the product.

**The D-13 conflict is now confirmed in your own assets.** You answered D-13 as "Caffeine Free" and three labels agree — but **the Pineapple bottle says "Gluten Free."** These are different regulated food claims.

### 1.3 Your decisions (2026-07-14)

| Question | Decision |
|---|---|
| Beetroot + Gooseberry | **Image placeholders.** Both stay in the catalogue, both purchasable. |
| Pineapple | **Use it.** The site copy says Caffeine Free regardless. |
| Bundles | **Config-driven. No invented sizes or discounts.** |

> ⚠️ **Action for you:** the Pineapple **artwork must be corrected at the next print run**, so the pack and the site make the same regulated claim. Until then they disagree, and that is recorded in the code, surfaced on the page, and asserted by test.

---

## 2. ✅ R-12 Is Solved

This was the hardest visual problem in the project, and the photography solved it.

The Brand Book's label system is **uniform by design** — every bottle identical except the bottom strip. At 160px, in greyscale, on a mid-range Android in daylight, **all six bottles were the same photograph.**

Three defences now stack:

1. The flavour **name**, in Fraunces, the largest thing on the card *(built)*
2. A colour **swatch**, always paired with the name — colour never the sole carrier of meaning, WCAG 1.4.1 *(built)*
3. ✅ **A distinct fruit cue in each frame** — grapes + ginger root, halved passionfruit, pineapple slices, pineapple + ginger in a bowl *(the photography, exactly as the shot list asked)*

Defence 3 is what makes the grid **scannable**. The other two are what make it **accessible**.

---

## 3. ⚠️ A Missing Photo Is Not a Merchandising Decision

In Phase 3, Gooseberry was `draft` and hidden from the shop because it had no photograph.

Your decision changed that, and the code now models the two facts **separately**:

- `status: 'active'` — it is a real product, for sale
- `hasPhoto: false` — the image is pending

**Beetroot and Gooseberry are live, in the grid, and purchasable**, rendering an honest "photography pending" panel. Gooseberry additionally shows **Sold out** — because it has zero stock, which is a *different* fact again.

Conflating "no image" with "not for sale" would have silently hidden a third of the range from the shop. That is a far bigger lie than an honest placeholder.

---

## 4. What Was Built

### Shop (`/shop`)

Server-rendered, **URL-driven**. Search · sort · flavour/size/availability/subscription filters · product counts · clear-all · empty state · error state · pagination · mobile filter drawer.

> **⚠ The URL *is* the state.** There is no `useState` holding the query. That gives, for free: a **shareable** filtered link, a working **back button**, a surviving **reload**, and a **server-rendered** grid in the initial HTML. Holding it in component state would look identical in a screenshot and silently break all four.

**Facet counts are computed with that facet removed** — so the Beetroot checkbox tells you how many products you'd see *if you ticked it*, not how many you can see now. Counting with it applied shows "(0)" beside every unticked box, which is worse than no count.

### Product Detail (`/shop/[slug]`)

Gallery · variant + quantity · one-time/subscription · delivery summary · stock · add-to-cart · buy-now placeholder · ingredients · nutrition · storage · serving · FAQ · returns · related · recently-viewed · social metadata · **mobile sticky purchase bar**.

### Bundles (`/bundles/[slug]`)

Preset (*The full range*) + build-your-own. Flavour quantity controls, **inventory-aware ceilings**, live progress, running summary, mobile sticky bar.

### Data models

`Product` (+`flavour`, `position`, `subscriptionEligible`, `storage`, `seo`) · `Variant` · `Flavour` · `Collection` · `Media` · `Price` · `Inventory` · `SubscriptionOption` · `Bundle` · `BundleItem` · `Nutrition` · `Ingredient` · `SeoContent`.

All modelled for **admin-portal editing** (§6): stable IDs, explicit ordering, human-readable labels, no behaviour baked into the shape.

---

## 5. ⛔ D-06 — The Bundle Builder Refuses to Validate

**This is the most important behaviour in the phase.**

You said: *"Do not assume bundle sizes or discounts. Keep them configuration-driven."*

So `requiredBottles` is `Unavailable`, and `validateBundle()` returns `{ kind: 'unknown-requirement' }` — it does **not** fall back to a default.

> **Why that is right, and not a cop-out.** Assuming six would produce a builder that *looks* finished: it would count to six, go green, and let a customer configure a box the business never agreed to sell — at a price nobody approved, with a discount that does not exist. **That bug is invisible in a screenshot and expensive in production.**

Everything else works: quantity controls, inventory ceilings, live progress, running summary, sticky mobile bar. **The one thing it cannot do is tell the customer they are finished — because nobody has said what finished means.**

**Set `requiredBottles` to a number and all of it starts working.** That is the whole change.

**The bundle price is not the sum of the parts.** A bundle costing exactly the sum of its parts is not a bundle, and presenting one implies a saving that does not exist.

---

## 6. ⛔ Nothing Was Invented

| What | Why nothing was written |
|---|---|
| **`schema.org/Product`** | ⛔ **D-14.** `offers` needs a price. Publishing a placeholder as structured data pushes a **false commercial claim into Google Shopping, at scale, mechanically**. `productJsonLd()` returns `null`. **Verified: zero `ld+json` tags in the built HTML.** |
| **Price** | ⛔ D-14 — every price marked *"indicative"* |
| **Compare-at price** | `null` on every variant. A fake *"was KES 700"* is an invented discount. |
| **Returns policy** | ⛔ **The one place inventing text would be actively dangerous.** A returns policy is a **legal commitment** — in Kenya it engages the Consumer Protection Act, and for a perishable live product the rules differ from a t-shirt. Writing a plausible "30-day returns" would be **drafting a contract on your behalf and binding you to it.** |
| **Delivery** | ⛔ D-21/22/23 — no zone, fee or lead time invented |
| **Subscription discount** | ⛔ D-09 — **"Save 0%" is a worse lie than saying nothing** |
| **Ingredients / nutrition** | ⛔ D-05 — regulated |
| **Shelf life** | ⛔ D-05 — a guessed shelf life is a **food-safety claim** |
| **Ferment duration** | ⛔ D-52 — Brand Book says six days, Strategy says fourteen |

---

## 7. Defects Found During Verification

### 7.1 ⚠️ The brand lint caught a real urgency violation — in my own copy

The bundle builder's out-of-stock message read **"Only 6 Passion left."**

That is **true** — and it is still the vocabulary of a countdown timer. P-07 forbids urgency architecture, and the Brand Book's voice is *"someone already at ease."* A scarcity construction borrows pressure it has not earned, even when the number behind it is honest.

**Rewritten as a flat fact:** *"Passion — 6 in stock."* Same information, no push.

**I took the lint's side against my own code.** That is what the guardrail is for.

### 7.2 The brand lint had a false positive — so I fixed the lint, not the comment

It flagged *"aids digestion"* inside a **JSX comment** that explains we never make that claim.

The cause: `isCopyLine` handled `//`, `*` and `/*` — but **not JSX `{/* */}` blocks**, whose *continuation lines* are plain indented prose with no marker.

**Fixed with a stateful block-comment tracker.** Then verified adversarially: planted a real urgency phrase and a real medical claim in shipped copy — **both still fire.** The lint is fixed, not weakened.

### 7.3 Two stale tests, correctly failing

- The G2 suite asserted Gooseberry was `draft`. Your decision changed that. **The test was stale, not the code.**
- The content suite asserted **zero** photography supplied. That test **existed precisely to fail when images arrived** — and it did.

---

## 8. Verification

```
ESLint (incl. architectural boundaries) ...... ✓ 0 errors, 0 warnings
TypeScript strict ........................... ✓ 0 errors
Contrast audit (WCAG 2.2 AA) ................ ✓ PASS
Brand lint .................................. ✓ PASS  (after 7.1 / 7.2)
Secret scan (client bundle) ................. ✓ PASS
Tests ....................................... ✓ 211/211
Production build ............................ ✓ 15/15 routes
```

**Live-verified against the real server and the prerendered artifacts:**

- `?flavour=passion` → isolates Passion
- `?q=ginger` → returns **both** ginger products, and **not** Pineapple
- `?availability=in-stock` → excludes Gooseberry (0 stock), **keeps Beetroot** — proving the placeholder is independent of purchasability
- `?q=zzzz` → the empty state, not an error
- Four real photographs served via `next/image`; two honest awaiting-asset panels
- **Zero `ld+json` tags** — the D-14 refusal holds

**Payload:** `/shop` 4.76 kB route JS · `/shop/[slug]` 4.35 kB · `/bundles/[slug]` 3.1 kB · 102 kB shared. Product images 20–36 kB per card at grid size (WebP), against a 60 kB budget.

---

## 9. What Phase 5 Needs

**Blocking:**
1. ⛔ **D-14 — approved prices.** Every price on the site is a placeholder, and this is what withholds `schema.org/Product`.
2. ⛔ **D-06 — bundle bottle count.** One number unlocks the whole builder.
3. ⛔ **D-21/22/23 — delivery zones, fees, lead times.**

**Long lead time — decide now:**
4. ⛔ **D-35 — verify with Stripe *directly* whether they can settle KES for a Kenyan entity.** If not, the card rail must be re-chosen. The port is provider-agnostic, so it is an adapter swap — but only if you find out in time.
5. ⛔ **D-31/32** — M-PESA Daraja credentials + shortcode.
6. ⛔ **D-09** — the subscription billing model.
7. ⛔ **Returns policy** — a legal document, not copy. Have someone qualified write it.

**Assets:**
8. **Beetroot reshoot** (A-05) · **Gooseberry first shoot** (A-07) · process/origin/journal editorial shots (R-03)
9. ⚠️ **Correct the Pineapple label artwork** — it says "Gluten Free"
10. Designer sign-off on the remediated logo (Phase 2 §2)
