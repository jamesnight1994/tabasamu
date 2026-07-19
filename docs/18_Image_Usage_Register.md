# Image Usage Register

**Generated from `src/content/image-slots.ts`** — the single source of truth. The doc and the code cannot drift.

---

## ✅ Photography partially landed (2026-07-14)

**Supplied: 6 of 11 slots.** Four flavours, plus the hero and the ingredients slot which reuse two of those frames.

| Flavour | Status |
|---|---|
| **Grape Ginger** | ✅ Clean, legible. *"Caffeine Free Rooibos Kombucha"* |
| **Passion** | ✅ Clean |
| **Pineapple Ginger** | ✅ Clean |
| **Pineapple** | ⚠️ **Used — but the label reads "GLUTEN FREE"** (see below) |
| **Beetroot** | ⛔ **A-05 — label typography illegible.** Placeholder, by client decision |
| **Gooseberry** | ⛔ **A-07 — no photograph exists.** Placeholder, by client decision |

---

## ✅ R-12 is solved — by the photography

The Brand Book's label system is **uniform by design**: every bottle is identical except the strip along the bottom. At 160px, in greyscale, all six would be the same photograph.

The supplied frames each carry a **distinct fruit cue in-shot** — grapes + ginger root, halved passionfruit, pineapple slices, pineapple + ginger in a bowl. That was the hard requirement in the Phase 3 shot list, and it was met.

Three defences now stack:
1. The flavour **name**, in Fraunces, largest thing on the card *(built)*
2. A colour **swatch**, always paired with the name — colour never the sole carrier of meaning, WCAG 1.4.1 *(built)*
3. ✅ **A distinct fruit cue in each frame** *(the photography)*

---

## ⚠️ The Pineapple artwork defect

The supplied Pineapple photograph's label reads **"Gluten Free Rooibos Kombucha"**. Every other bottle reads **"Caffeine Free"**.

**These are different regulated food claims.**

- ✅ **The site says "Caffeine Free"** — D-13, answered by the client.
- ✅ **The image is used as supplied** — client decision, 2026-07-14.
- ⚠️ **The artwork must be corrected at the next print run**, so the pack and the site make the same claim.

Until then, the site and this one photograph disagree. That is recorded on the slot (`blockedBy`), surfaced on the product page, and asserted by test — so it cannot be quietly forgotten.

---

## Crops

Each supplied frame ships in **two** crops, derived from the original:

| Crop | Size | Used by |
|---|---|---|
| `{slug}.jpg` | 1800×1200 (3:2) | PDP gallery, editorial sections |
| `{slug}-portrait.jpg` | 1200×1500 (4:5) | Product grid, mobile hero |

**⚠ The portrait is a real crop around the bottle centre, not a squeeze.** The brief forbids stretching or overcropping the product, and the label *is* the product. Every crop was visually verified: full bottle, whole label, fruit cue still in frame.

**Payload at grid size (WebP, 600×750):** 20–36 kB per card, against a 60 kB budget.

---

## Register

| Slot | Status | Aspect | Path | Note |
|---|---|---|---|---|
| `hero-primary` | ✅ supplied | **3/2** + 4:5 | `/products/grape-ginger.jpg` | — |
| `product-grape-ginger` | ✅ supplied | **4/5** + 4:5 | `/products/grape-ginger.jpg` | — |
| `product-pineapple` | ✅ supplied | **4/5** + 4:5 | `/products/pineapple.jpg` | D-13 ARTWORK DEFECT |
| `product-pineapple-ginger` | ✅ supplied | **4/5** + 4:5 | `/products/pineapple-ginger.jpg` | — |
| `product-passion` | ✅ supplied | **4/5** + 4:5 | `/products/passion.jpg` | — |
| `product-beetroot` | ⛔ pending | **4/5** | `/products/beetroot.jpg` | A-05 |
| `product-gooseberry` | ⛔ pending | **4/5** | `/products/gooseberry.jpg` | A-07 |
| `process-ferment` | ⛔ pending | **3/2** | `/products/process-ferment.jpg` | R-03 |
| `origin-kitchen` | ⛔ pending | **4/5** | `/products/origin-kitchen.jpg` | R-03 |
| `ingredients-fruit` | ✅ supplied | **3/2** | `/products/pineapple-ginger.jpg` | — |
| `journal-preview` | ⛔ pending | **3/2** | `/products/journal-1.jpg` | R-03 |

---

## ⛔ Still needed

| Asset | Why |
|---|---|
| **Beetroot** | Reshoot. The current frame's label typography is illegible (A-05). |
| **Gooseberry** | First shoot. No photograph has ever existed (A-07). |
| **Process / ferment** | The vessel, in the kitchen. Carries the "small-batch" claim — must not look industrial. |
| **Origin / kitchen** | ⚠ **No tourism shorthand.** A working kitchen: surfaces, vessels, hands mid-task. Brand Book §08. |
| **Journal** | Editorial still life. |
