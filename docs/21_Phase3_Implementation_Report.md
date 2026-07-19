# Phase 3 Implementation Report
## Responsive Storefront, Homepage & Brand Story Experience

**Date:** 14 July 2026
**Status:** Complete. All six verification gates green. 153/153 tests passing.
**Build:** 7/7 routes prerendered static. Homepage route JS **5.67 kB**.

---

## 1. Inspection Summary

### 1.1 What was supplied

`files__6_.zip` contained **my own Phase 2 outputs, returned unchanged**: the Phase 2 project ZIP, the logo lockup, the changelog, and the Phase 2 report.

### 1.2 ⛔ The blocking conflict — no photography

The brief states:

> *"Build the public-facing homepage and core editorial storefront experience **using the approved product photography**."*
> *"Use the approved images **as supplied**."*

**No images were supplied.** I checked every path in the archive: **zero image files.** `public/products/` contained only the README I wrote in Phase 2 flagging the gap.

This is not a small omission. Phase 2 named photography as **R-03, the critical path that blocks Phase 3**, and nothing has changed:

| Flavour | Status |
|---|---|
| Grape Ginger, Pineapple, Pineapple Ginger, Passion | One 16:9 **landscape lifestyle** frame each — in conversation context only, never on disk |
| **Beetroot** | Label typography **illegible** — unusable on a product page (A-05) |
| **Gooseberry** | **No photograph exists at all** (A-07) |

Even the four "usable" frames are landscape. A hero and a product grid need **portrait crops, square crops and packshots** — none exist.

And the brief itself forbids the shortcuts: *"do not stretch or overcrop products"*, *"do not generate substitute bottles"*, *"preserve labels, proportions and colour"*. There was no honest path to "use the approved photography."

**I raised this before writing code**, rather than quietly cropping landscape frames into portrait and calling it done.

### 1.3 Client decisions resolved this session

| ID | Decision | Effect |
|---|---|---|
| **D-13** | **"Caffeine Free"** is the descriptor | Now appears in the page title, meta description and hero eyebrow |
| **D-50** | **Rooibos** is the base | ⚠ Has a serious consequence — see §3 |
| — | **Small-batch / locally-crafted** positioning approved | Used in the Proposition section |

---

## 2. ⚠ The Provenance Problem (D-50)

**This is the most important thing in this report.**

D-50 is answered: the base is **rooibos**.

Rooibos (*Aspalathus linearis*) grows in the **Cederberg region of South Africa**. It is **not grown in Kenya**, and essentially cannot be — it needs that specific fynbos soil and climate.

The Brand Book's origin story describes fermenting **"Kenyan-grown hibiscus."** **That is not this product.**

**Therefore the mantra — *"Rooted in the soil"* — cannot be attached to the tea.** Writing "our Kenyan rooibos" would put a **false provenance claim on the brand's single most important sentence**, in the one place a competitor or a regulator would look first.

### What the copy claims instead — all of it true

| Claim | Status |
|---|---|
| The **fruit** is Kenyan | ✓ passion, pineapple, beetroot, gooseberry, grape |
| The **brewing** is Nairobi's | ✓ |
| The **craft and the people** are Kenyan | ✓ |
| The **rooibos** is named as rooibos | ✓ with no provenance claim attached |
| ~~The rooibos is Kenyan-grown~~ | ✗ **false. Never written.** |

The hero reads:

> *"A rooibos base, fermented in small batches and finished with fruit grown here."*

**This is not a workaround. It is the only honest reading — and it is a better story:** a Nairobi kitchen choosing a caffeine-free base *on purpose*, and building the flavour from fruit grown down the road.

**Guarded by test.** `tests/unit/content.test.ts` fails the build if anyone ever writes "Kenyan rooibos", "rooibos grown here", or any of five other false-provenance phrasings.

> **⚠ Action for the client:** the physical **label artwork** still says both "Caffeine Free" and "Gluten Free" on different bottles. Correct it at the next print run so the pack and the site make the same regulated claim.

---

## 3. What Was Built

### 3.1 All 13 homepage sections

| # | Section | Notes |
|---|---|---|
| 1 | Announcement | Editable, **dismissible with persistence**, no urgency. ⛔ **Disabled by default** — no approved copy (D-21) |
| 2 | Hero | **No carousel.** Deliberate mobile content order (§4) |
| 3 | Collection | Six flavours, swatch + name, price placeholder, size, stock state, quick add |
| 4 | Proposition | Forest band. **Three points as prose — no icon row** |
| 5 | Ingredients | Editorial two-column |
| 6 | Process | **Progressive disclosure** via accordion |
| 7 | Origin | Nairobi story. **No tourism shorthand** |
| 8 | Subscription | Practical benefit only. ⛔ **No savings % invented** (D-09) |
| 9 | Social proof | ⚠ **No testimonial fabricated** (§5) |
| 10 | Wholesale | Cafés, offices, corporate |
| 11 | Journal | ⛔ No article, title or date invented |
| 12 | Newsletter | Real validation. ⛔ **Not connected** (D-40), and says so |
| 13 | Footer | Four columns; the mantra suppressed here (§6) |

### 3.2 Deliberate omissions

**No carousel.** The brief permits one only if *"research demonstrates a clear benefit"*. It does not: slides past the first are seen by a low single-digit percentage of visitors, the component costs layout shift, autoplay conflicts with `prefers-reduced-motion`, and it hands the brand's most valuable surface to a control nobody operates. **One composition, chosen.**

**No icon row in the Proposition.** The brief asks for *"editorial layout rather than icon clutter."* An icon row is the fastest way to make a considered brand look like a SaaS pricing page. The only ornament is a **typographic numeral** in Fraunces.

---

## 4. ⚠ The Mobile Hero Order Is Designed, Not Inherited

**Desktop:** two columns — type left, bottle right.

**Mobile:** `eyebrow → headline → IMAGE → standfirst → CTAs`

The image is **neither first nor last**, and both alternatives are wrong:

- **Image first** pushes the headline below the fold on a 360px phone.
- **Image last** makes the customer read three paragraphs about a drink they have not yet seen.

It goes **after the headline**: the promise, then the proof, then the ask. Implemented with explicit `order-*` utilities — not by accepting whatever DOM order the desktop grid happened to need.

**The product grid is TWO columns at 360px, not one.** A single-column grid shows one bottle per screen and turns the range into a long scroll — so the customer never perceives that a *range* exists, which is the entire purpose of the section.

---

## 5. ⚠ Nothing Was Fabricated

Every gap is a **visible ⛔ marker** in the UI carrying its decision ID.

| What | Why nothing was written |
|---|---|
| **Testimonials** | **A fabricated review is not a placeholder — it is a lie a customer reads and believes, and it is unlawful in Kenya, the UK and the EU.** Three empty frames say so plainly: *"We would rather show you nothing than show you something we wrote ourselves."* |
| **Fermentation duration** | ⛔ **D-52** — Brand Book says six days; Strategy says fourteen. **No figure is published.** A specific number that is wrong is worse than none. |
| **Delivery promise** | ⛔ **D-21** — the announcement strip is **disabled by default**. An invented "Free delivery in Nairobi" would invent a commercial promise. |
| **Subscription savings** | ⛔ **D-09** — M-PESA has no card-on-file equivalent, so a recurring charge cannot be taken silently. **No percentage is shown** — none is approved. |
| **Newsletter** | ⛔ **D-40** — the form validates, handles errors and manages focus, but is **not connected**. Silently swallowing an address is *worse* than having no form: the customer believes they signed up, never hears from the brand, and concludes it died. |
| **Prices** | ⛔ **D-14** — every price carries a visible *"indicative"* marker. |
| **Farms** | ⛔ **D-49** — no farm is named. |
| **Journal entries** | None invented. |
| **Gooseberry** | ⛔ **A-07** — no photograph, so it ships as `draft` and is **absent from the storefront**. |

**Guarded by 40 new tests** in `tests/unit/content.test.ts`: banned vocabulary, urgency phrases, medical claims, tourism shorthand, false provenance, invented delivery/discount/duration, and fabricated testimonials.

---

## 6. Architecture — Performance Is a Design Decision

**Only four components ship JavaScript:**

`AnnouncementBar` (dismissal) · `CollectionPreview` (quick-add) · `Process` (accordion) · `Newsletter` (form)

**The other nine sections are server components** and arrive as plain HTML.

> **Homepage route JS: 9.57 kB → 5.67 kB (−41%)** after moving the static sections off the client.

Shipping eleven sections of static prose as React would be bytes the customer pays for and CPU they wait on, for zero interactivity, on a mid-range Android over Nairobi 3G. [P-10]

**The data comes through the port.** The homepage does not know a mock adapter sits behind `getAdapters()`. At Gate G2 the adapter is swapped for HTTP and this file does not change. **The boundary lint enforces it** — no component may import an adapter.

**The mantra appears once per page.** The Origin section renders it, so the storefront layout **suppresses the Footer's copy on `/`**. Brand Book: *"once per page, maximum."*

---

## 7. The Image Slot Contract — The Main Deliverable

Given that no photography exists, the most valuable thing I can hand over is a **precise, machine-checked contract** for what is needed.

`src/content/image-slots.ts` declares **12 slots**. Each carries:

- the **exact crop and aspect** (product cards are **4:5 portrait** — a bottle is a tall object; a landscape crop of a tall object is mostly worktop)
- a **separate mobile file** where art direction demands it (the hero is 3:2 desktop, **4:5 mobile** — `<picture>` + `media`, *not* an `object-fit` squeeze, which would overcrop the product the brief tells us to preserve)
- responsive `sizes` — a 360px phone never downloads a 2400px file
- a **text safe zone**, so type never crosses the label
- **final alt text**, written now, to be used verbatim
- **shot direction** for the photographer

**`docs/18_Image_Usage_Register.md` is generated from this file and doubles as the shot list.** Drop the images into `public/products/`, flip `supplied: true`, and the homepage is finished. **Nothing above the asset layer changes.**

### Meanwhile

Each slot renders a **designed "awaiting asset" panel** — not a broken image, not a grey box, not a stock photo of someone laughing with a drink. It names the slot and its spec, so a missing asset is **impossible to miss in review**, and it is genuinely useful to the photographer.

### ⚠ R-12 — the hard problem the shoot must solve

The label system is **uniform by design**: every bottle is identical except the bottom strip. **At 160px, in greyscale, all six bottles are the same photograph.**

Three defences, layered:
1. The flavour **name**, in Fraunces, largest thing on the card *(built)*
2. A colour **swatch**, always paired with the name — colour never the sole carrier of meaning *(built)*
3. **A distinct fruit cue in each frame** *(art direction — a hard requirement in the register, and a test asserts every product slot demands one)*

---

## 8. Verification

```
ESLint (incl. architectural boundaries) ...... ✓ 0 errors, 0 warnings
TypeScript strict ........................... ✓ 0 errors
Contrast audit (WCAG 2.2 AA) ................ ✓ PASS
Brand lint (voice, urgency, palette) ........ ✓ PASS
Secret scan (client bundle) ................. ✓ PASS
Tests ....................................... ✓ 153/153
Production build ............................ ✓ 7/7 static
```

**One test failed during the run and was correct to fail:** the Gate G2 suite asserted `descriptor` and `base` were still blocked. The client had just answered D-13 and D-50 — so the **test** was out of date, not the code. Updated to assert the new truth *and* that the remaining blockers (D-05, D-49, D-52) are still honestly absent.

### ⚠ Screenshots — an honest note

**Chromium cannot be installed in the build sandbox** (`playwright install` exits 100). The only available renderer is WebKit-based `wkhtmltoimage`, which **ignores `@layer` wholesale** — dropping every Tailwind v4 utility and collapsing the page to 35px.

Rather than ship a broken or misleading capture, the screenshots in `docs/screenshots/` are a **faithful re-render from the same design tokens** (identical hexes, type scale, spacing, section order and copy) in plain CSS. They are accurate to the design; they are **not** a pixel-capture of the React build.

**The real page must be screenshotted, Lighthouse'd and axe-tested in a modern browser before sign-off.**

---

## 9. What Phase 4 Needs

**Blocking:**
1. **📷 PHOTOGRAPHY.** It has now blocked two phases. `docs/18_Image_Usage_Register.md` is the shot list.
2. **D-14** — approved prices. Every price on the site is a placeholder.
3. **D-21/22/23** — delivery zones, fees, lead times. The cart total is `Unavailable` without them.

**Long lead time — decide now:**
4. **D-35** — **verify with Stripe directly** whether they can settle KES for a Kenyan entity. If not, the card rail must be re-chosen (the port is already provider-agnostic, so it is an adapter swap, not a rewrite).
5. **D-31/32** — M-PESA Daraja credentials + shortcode.
6. **D-09** — the subscription billing model.

**Also outstanding:** designer sign-off on the remediated logo (Phase 2 §2), and correction of the label artwork so it stops saying both "Caffeine Free" and "Gluten Free".
