# Tabasamu Sips — Phase 1 Discovery Report

**Project:** Tabasamu Sips Ecommerce Website
**Phase:** 1 — Discovery, Benchmarking, Requirements, Information Architecture
**Date:** 13 July 2026
**Prepared by:** Daniel Omulo
**Status:** Specification only. No production UI implemented in this phase.

---

## 0. Inspection Summary

### 0.1 Files inspected

| File | Type | Status | Notes |
|---|---|---|---|
| `Tabasamu_Sips_Brand_Book.pdf` | Brand book v1.1, May 2026 | **BINDING AUTHORITY** | 13+ sections. Logo construction, colour, type, photography, packaging, voice. |
| `Tabasamu_Sips_Marketing_Strategy.docx` | Strategy, Apr 2026 | **SUPERSEDED where conflicting** | 12-day launch sprint. Predates Brand Book. |
| `Final_Logo.svg` | Vector logo | Usable, **needs remediation** | See 0.3. |
| `Final_Logo.pdf` | Vector logo | Usable | Print reference. |
| `Beetroot.jpg` | Product photo | **Unusable as-is** | See 0.3. |
| `grape_ginger.png` | Product photo | Approved (Brand Book ANCHOR·I) | Hand-carved stool, afternoon shadow. |
| `Passion.png` | Product photo | Usable, not in Brand Book | Same set/lighting as approved anchors. Consistent. |
| `Pineapple_flavor.png` | Product photo | Approved (Brand Book ANCHOR·V) | Woven sisal, ribbed shadow. |
| `pineapple_ginger.png` | Product photo | Approved (Brand Book ANCHOR·VI) | Linen curtain, hand-glazed bowl. |
| Existing repository | — | **None found** | Greenfield. No prior code, no prior reports. |

### 0.2 Conflicts identified (Brand Book wins in all cases)

| # | Subject | Strategy doc (Apr 2026) | Brand Book (May 2026) | Resolution |
|---|---|---|---|---|
| C-01 | Heading typeface | Montserrat / Plus Jakarta Sans | **Fraunces** | Fraunces. |
| C-02 | Body typeface | Inter or DM Sans | **DM Sans** | DM Sans. |
| C-03 | Flavour count | 6 flavours implied by photography | **3 flavours** ("Three flavours, one system") | See D-01 — unresolved, client decision. |
| C-04 | Botanical ingredient story | "hibiscus, ginger, turmeric" (Brand Story) and "hibiscus from Kerio Valley" (voice examples) | Product is **Rooibos** base, rooibos sprig motif | See R-01 — brand story contradicts the product. Internal Brand Book inconsistency. Client confirmation required. |
| C-05 | Bottle format | 1L primary (photography), 500ml in strategy | **500ml PET, black cap** in packaging section; photography shows **1 Litre** labels | See D-02 — both SKUs likely exist. Confirm. |
| C-06 | Voice: exclamation marks | Strategy example caption uses hype ("Your stomach will thank you") | **Prohibited.** No "wellness journey", no exclamation marks | Brand Book voice governs all site copy. |
| C-07 | Tagline set | "Energy your gut will love", "The drink that does more" | Mantra: **"Rooted in the soil, crafted for the soul."** / **"Feel the shift from within."** | Brand Book mantras only. Strategy taglines are prohibited (hype register). |
| C-08 | Photography cliché | Strategy recommends "pour shot… carbonation", "spray bottle for condensation effect" | **Explicitly forbidden** — "frozen droplets cliché" | No pour/splash/condensation imagery on site. |
| C-09 | Background colour | "Test logo on white" | **Pure white is forbidden** | Warm Cream #FDF6F0 is the ground. Never `#FFFFFF`. |
| C-10 | Health claims | "supports gut health", "probiotic", "your gut will thank you" | Voice bans "detox/cleanse/purify"; "The benefit is the product. We do not need to oversell it." | No health/efficacy claims on site without regulatory sign-off. See R-02. |

### 0.3 Asset defects requiring remediation before Phase 3

| # | Asset | Defect | Severity |
|---|---|---|---|
| A-01 | `Final_Logo.svg` | Wordmark is **live text set in "Canela Trial"** — a *trial* font, not licensed, and not the Brand Book's specified Fraunces Medium at –20 tracking. Will render as a fallback serif on any machine without the trial font. | **Blocker** |
| A-02 | `Final_Logo.svg` | Wordmark is not outlined to paths. Any SVG delivered to the web will break typography on client devices. | **Blocker** |
| A-03 | `Final_Logo.svg` | Contains no `<title>`/`<desc>`, no `role="img"`, no `aria-label`. Fails accessibility as an inline SVG. | Medium — fixable in code. |
| A-04 | `Final_Logo.svg` | Only the full lockup exists. Brand Book specifies **four required variants**: full lockup, monogram-only, plus cream-reversed versions. Monogram is required for the 40px digital minimum and the 16×16 favicon. | **Blocker** for favicon/mobile header. |
| A-05 | `Beetroot.jpg` | Label typography is **garbled and unreadable** — wordmark reads "Tabasamu Sips" with broken glyph rendering; descriptor renders as illegible characters ("Gtffiens Free Roolbo? Kombucha"); side panel text is noise. Composite artefact. | **Blocker** — cannot ship on a commerce PDP. |
| A-06 | `Beetroot.jpg` | Label descriptor is inconsistent with the rest of the family. Other photos read "Caffeine Free Rooibos Kombucha"; `Pineapple_flavor.png` reads **"Gluten Free Rooibos Kombucha"** — a different claim entirely. | **Blocker** — a food-labelling inconsistency, not just a design one. |
| A-07 | Photography set | **Gooseberry has no photograph.** Six flavours are referenced commercially; five images exist, one of which (Beetroot) is unusable. Usable set = 4. | High — blocks Shop grid completeness. |
| A-08 | Photography set | Every image is a **16:9 / 3:2 landscape lifestyle frame**. There are **no square crops, no 4:5 portrait crops, no packshots on plain cream, and no cut-out/transparent PNGs.** A PDP gallery, a cart line-item thumbnail, and a mobile product card all need assets that do not currently exist. | **High** — blocks Shop and PDP design. |
| A-09 | Photography set | No back-label photography exists. Ingredients and nutrition panels cannot be sourced from imagery. | Medium. |

**Consequence:** the visual system cannot be fully implemented from current assets. Phase 2 must not proceed on the assumption that the photo library is complete. See the Risks Register (R-03) and the Phase Plan (a photography and logo-remediation gate sits between Phase 1 and Phase 3).

### 0.4 What Phase 1 changes

Nothing in code. This phase produces specification documents only, listed in §6 of the brief. No repository is initialised, no dependency is installed, no component is written.

---

## 1. Brand Implementation Matrix

### 1.1 Purpose, audience, positioning

| Dimension | Definition | Source | Site implication |
|---|---|---|---|
| **Brand purpose** | To prove that wellness made on African soil can stand on the same shelf as any premium imported brand — without translation, apology, or the visual shorthand of the souvenir aisle. | Brand Book §01 | The site must look like a premium editorial commerce property, not an "African brand" website. No explanatory framing. |
| **Mission** | "To craft a kombucha rooted in Kenyan soil and Kenyan hands — and to make wellness feel like coming home, not arriving somewhere new." | Brand Book §01 | Homepage narrative arc: arrival, not discovery. |
| **Category** | Caffeine-free rooibos kombucha. Premium Kenyan. Small-batch. | Brand Book cover + §01 | Category descriptor appears once, high on Home. Never repeated as a slogan. |
| **Three pillars** | i. African roots (locally sourced, fermented, photographed). ii. Health mission (live cultures, low sugar, no synthetic additives — *the benefit is the product; we do not need to oversell it*). iii. Caffeine-free lifestyle (the afternoon ritual without the jitter). | Brand Book §01 | These are the three content zones on Home and the three anchors of Our Story. |
| **Primary audience** | Nairobi urban professionals, 26–40, who buy premium groceries and are caffeine-sensitive or caffeine-abstaining. Confident, not aspirational-anxious. | Brand Book §01 tone + Strategy personas (retained where non-conflicting) | Interface assumes competence. No hand-holding, no gamification, no urgency theatre. |
| **Secondary audiences** | Gift purchasers; corporate/office wellness buyers; cafés and health-food retailers (wholesale). | Strategy Channels 4–5 | Distinct entry points, not a single funnel. |
| **Positioning** | Premium, quiet, grounded. Competes with imported kombucha on quality signals, not on price. Explicitly *not* a mass-market health drink. | Brand Book §01 | Price is never the hero. No countdown timers, no "SALE" badges, no discount-driven layout. |
| **Personas (retained)** | Retained from Strategy but **re-registered**, because they were written against the pre-Brand-Book positioning. Their *wants* are still valid; their *tone* assumptions are not. | Strategy Phase 1 | See User Journey Map. |

### 1.2 Voice and tone

| Axis | Is | Is not | Site rule |
|---|---|---|---|
| Warmth | Warm, acknowledges small real moments | Sentimental; selling feelings | Microcopy states facts. "Two bottles left." Not "Hurry — almost gone!" |
| Knowledge | Knowledgeable, plain-spoken, exact | Clinical; jargon-laden | Ingredients page names farms and days. No SCOBY explainer written for a stranger. |
| Register | Encouraging, invitational, generous | Preachy; instructive; morally hierarchical | No "you should", "you deserve", "unlock". CTAs are plain: "Add to cart", "Read the story". |
| Rhythm | Short sentences carry meaning; long sentences carry texture; alternate | Uniform sentence length | Applies to all editorial copy, including 404 and error states. |
| Cultural stance | Uses *tabasamu* untranslated on primary touchpoints. Confidence is unspoken. | Explaining Kenya to anyone | The word `tabasamu` appears in the logo and in Our Story. It is not glossed on every page. |

**Approved messaging (verbatim, Brand Book §07):**
- Mantra: *"Rooted in the soil, crafted for the soul."* — reserved for primary touchpoints (footer, back of bottle, carton flap). **Use once per page maximum.**
- Display line: *"Feel the shift from within."*
- Shelf shout: *"Caffeine-free. Sugar-honest. Brewed in Nairobi."*
- Email opener register: *"The afternoon doesn't need fixing. Just a pause."*
- Name framing: *"Tabasamu. Swahili for smile. The kind that finds you, not the kind you wear."*

**Prohibited messaging (Brand Book §07 — hard ban, enforce in lint):**

| Banned | Also banned |
|---|---|
| "Wellness journey" | "Detox" / "cleanse" / "purify" |
| Any "-inspired" hedge ("African-inspired") | "Ancient wisdom" / "tribal traditions" |
| "Treat yourself" / "you deserve it" | "Game-changer" / "next-level" / "unlock" |
| "Vibes" — in any context | Exclamation marks in body copy |
| Emoji in long-form copy or product packaging | Any phrase that could appear in a tourism brochure |

**Additionally prohibited for this site** (derived, not verbatim): urgency language ("Hurry", "Ends tonight", "Only X left!"), scarcity theatre, "Best seller" badges, "Trending", social-proof popups ("Someone in Karen just bought…"), and exit-intent modals. All of these are the opposite of *"the voice of someone already at ease."*

### 1.3 Logo rules

| Rule | Value | Enforcement |
|---|---|---|
| Construction | Terracotta sun-burst above an abstracted smile; wordmark in **Fraunces Medium, –20 tracking**, forest green. Sun-burst position is **fixed** — no rotation, no independent recolour, no reproportioning. | Ship as outlined SVG. Never as live text. |
| Clear space | `x` = cap-height of the wordmark, on all four sides. No element may enter this zone. | CSS: logo wrapper has `padding: var(--logo-clearspace)`. |
| **Digital minimum — full lockup** | **120px wide** | Hard floor. Mobile header must switch to monogram, not shrink the lockup. |
| **Digital minimum — monogram** | **40px wide** | |
| Favicon | 16×16px, **monogram only** | |
| Approved grounds | Cream (primary), terracotta (reversed to cream), forest green (reversed to cream), charcoal (reversed, low-light editorial only) | Never on photography, never on a gradient, never on a busy field. |
| Forbidden | Stretch, distort, 3D, shadow, perspective, rotation, tilt, off-palette grounds, busy pattern, charcoal-on-terracotta | |

**Site consequence:** the logo may **never** be placed over a hero photograph. A transparent/overlaid header is therefore **not permitted**. The header must sit on a solid cream (or, when scrolled, solid cream with a subtle rule) band. This is a binding constraint on the Phase 3 layout.

### 1.4 Colour tokens and usage proportions

| Token | Hex | Role | Proportion | Rules |
|---|---|---|---|---|
| `--cream` | `#FDF6F0` | Background / canvas | **60–70% of any composition** | The dominant ground of the entire site. |
| `--terracotta` | `#C05A2C` | Primary / figure | ~15–20% | Primary CTA, links, active states, the sun-burst. Type on terracotta is set in cream. |
| `--forest` | `#1D6B4F` | Secondary | ~10% | Wordmark, editorial sub-headings (Fraunces 500 italic), success states. |
| `--charcoal` | `#2D2D2D` | Text | Text only | **Principal text colour, on cream only.** Never on terracotta. |
| `--gold` | `#B8943E` | Accent | **≤2 appearances per composition** | Deliberate only. Rules, small marks, page numbers. Never for the mantra. Never for a CTA. |
| `#FFFFFF` | — | **FORBIDDEN** | 0% | Pure white must never become the ground. Not for cards, not for modals, not for input fields. |

**Combination rules (Brand Book §03, binding):**
- ✅ Cream · Terra · Gold
- ✅ Cream · Forest
- ✅ Terra · Cream · Gold
- ✅ Charcoal · Cream · Gold
- ❌ **Terracotta × Forest edge-to-edge** — cream must buffer them
- ❌ Pure white × Cream
- ❌ Charcoal text on terracotta
- ❌ All five in equal weight

**Flavour strip colours (packaging, Brand Book §06):**

| Flavour | Strip hex | Notes |
|---|---|---|
| Grape Ginger | `#4A2A55` | Deep aubergine |
| Pineapple | `#E9C25B` | |
| Pineapple Ginger | `#C05A2C` | Same as terracotta primary |
| Passion | *not in Brand Book* | Photograph shows a **blue** strip. **Undefined.** See D-03. |
| Beetroot | *not in Brand Book* | Photograph shows a **deep red** strip. **Undefined.** See D-03. |
| Gooseberry | *not in Brand Book* | No strip, no photograph. **Undefined.** See D-03. |

> **Critical:** flavour strips are a **packaging** system, not a **web** system. They must not be promoted into site chrome. Using `#4A2A55` or `#E9C25B` as a UI accent would break the five-colour palette. On the web, flavour strips appear **only** as a small identifying swatch on the product card and PDP — never as a card background, never as a section fill, never as a button colour.

### 1.5 Typography

| Style | Face | Spec | Web mapping |
|---|---|---|---|
| H1 · Display | Fraunces 400 | 64–88pt, –2% tracking, 0.95 leading, charcoal | `clamp(2.5rem, 6vw, 4.5rem)` |
| H2 · Section | Fraunces 400 | 32–40pt, –1.5% tracking, 1.0 leading, charcoal | `clamp(1.75rem, 3.5vw, 2.5rem)` |
| H3 · Sub / editorial | Fraunces **500 italic** | 14–16pt, forest green | `1rem` |
| Body | DM Sans 400 | 9.5–11pt, 1.55 leading, charcoal on cream | `1rem`/`1.0625rem`, `line-height: 1.55` |
| Label · micro caps | DM Sans 500 | 7.5–9pt, **0.22em tracking**, uppercase | `0.75rem`, `letter-spacing: 0.22em` |
| Spec · mono | JetBrains Mono 400 | 8–9pt | Colour codes, ingredient lists, **batch numbers**, order numbers, SKUs |
| Pull · mantra | Fraunces 400 **italic** | 13–16pt, 1.45 leading, forest green **or** terracotta — **never gold** | |

Rules: enable kerning + ligatures always. Fraunces is variable; DM Sans is variable. **Avoid DM Sans Bold (700+) unless absolutely necessary.** Both are SIL OFL — free for commercial use, self-hostable.

> **Note:** the Brand Book type hierarchy names Fraunces and DM Sans only, but the SPEC·MONO row specifies **JetBrains Mono**. This is a *third* face, not listed in §04's "Two faces, one voice." It is retained (the Brand Book explicitly specifies it for spec contexts) but its use is confined to the spec register: order IDs, batch numbers, SKUs, hex/CMYK values, nutrition figures. It never appears in navigation or editorial copy.

**Performance:** three variable fonts is a meaningful payload on a slow Nairobi mobile connection. Mandate: self-host WOFF2, subset to Latin, `font-display: swap`, preload only the two faces used above the fold (Fraunces display, DM Sans body). JetBrains Mono loads lazily — it never appears above the fold.

### 1.6 Photography direction

**Always:**
- Natural light only. Golden hour, 5:00–6:30pm Nairobi, or window light for interiors. *If the light is gone, end the shoot.*
- Warm white balance 5200–5800K. Shadows lifted into warm browns, not crushed blacks. Saturation 5–10% below camera default.
- Eye-level perspective — with the subject, not above or beneath.
- Generous negative space — **50% or more of the frame** (60–70% for the third composition).
- Material specificity: real Kenyan ceramic (Kazuri, Kitengela), hand-carved acacia, hand-thrown clay. Not terracotta-coloured plastic.
- One focal point per frame.

**Never:**
- Flash, ring-light, studio strobes.
- Teal-and-orange grading, HDR, cyan shadows, magenta skin, vintage/grain overlays, lens flare.
- **The frozen-droplets cliché.** No pours with motion-frozen splashes. *"Ours is the moment after the pour."*
- Maasai shukas, savanna sunsets, wildlife, anything from a tourism brochure.
- Staged laughter, model-looking-at-camera. *"Eyes downcast. Hint of a smile."*

**Three approved compositions:**
1. **Rule of thirds, loose** — subject on right-third intersection, light from upper-left. Default for hero product and ingredient stills.
2. **Centred & meditative** — symmetric light, often overhead window. For editorial features and packaging hero shots.
3. **Generous negative space** — subject in lower-right quadrant, 60–70% of frame empty. **Ideal for social and out-of-home formats with overlaid type.**

> **Site consequence:** composition (iii) is the only one that reliably accommodates overlaid type. It is therefore the required composition for any hero image that carries a headline. Composition (i) — which the existing `grape_ginger.png` uses — centres the bottle and leaves the *left* half open; overlaid type must therefore sit left. **No existing asset supports a right-aligned overlay.** This constrains hero layout and must be resolved in the reshoot.

**Photographer brief, one line:** *shoot it like a quiet magazine essay about a maker's afternoon.*

### 1.7 Product presentation

| Rule | Detail |
|---|---|
| Label system | One layout, one type lockup, one botanical motif. **Only the bottom strip changes** — a single bar of flavour-coded colour. |
| Label spec | 186 × 126mm wraparound. Uncoated cream stock. Single-colour flexo for strip, CMYK for botanical. |
| Format (Brand Book) | 500ml PET, black cap |
| Format (photography) | 1 Litre PET, black cap |
| Descriptor | "Caffeine Free Rooibos Kombucha" — **but see A-06**, one asset says "Gluten Free". |
| Botanical motif | Single rooibos sprig, line-drawn, greyscale. Consistent across all flavours. |
| Anchor moments | ANCHOR·I (hand-carved stool — *the default hero*), ANCHOR·V (woven sisal — texture), ANCHOR·VI (linen curtain, hand-glazed bowl — mood; *"feel the shift from within"*) |

**Site consequence:** because the label system is deliberately uniform, **product cards will not differentiate by label alone.** The bottles look near-identical at thumbnail size. Product discovery must differentiate by (a) the flavour strip swatch, (b) the ingredient cue in the lifestyle photograph, and (c) the flavour name in Fraunces. This is a real usability constraint of the brand system and must be designed around, not fought.

### 1.8 Cultural guardrails

| Guardrail | Rule |
|---|---|
| No souvenir aisle | No shukas, no savanna, no wildlife, no beadwork-as-decoration, no "safari" typography, no map-of-Africa graphics. |
| No explanation | *"We do not explain Kenya to anyone."* `tabasamu` appears untranslated on primary touchpoints. Translate once, in Our Story, and then trust the reader. |
| No "-inspired" | The brand *is* Kenyan. It is not "African-inspired." |
| No extraction imagery | No hands-of-the-farmer stock trope, no poverty framing, no "empowerment" narrative. Supply-chain honesty is stated plainly: farm, region, days. |
| Specificity earns trust | Name the place. *"Ginger from Meru. Six days in the jar."* |
| Language | English primary. Swahili used for the brand name and where naturally exact — never as decoration. |

### 1.9 Accessibility considerations

**Contrast audit against the binding palette** (WCAG 2.2):

| Foreground | Background | Ratio | AA normal (4.5:1) | AA large (3:1) | Verdict |
|---|---|---|---|---|---|
| Charcoal `#2D2D2D` | Cream `#FDF6F0` | **~13.0:1** | ✅ | ✅ | **Primary text pairing. Excellent.** |
| Forest `#1D6B4F` | Cream `#FDF6F0` | **~5.9:1** | ✅ | ✅ | Safe for body text and links. |
| Terracotta `#C05A2C` | Cream `#FDF6F0` | **~4.0:1** | ❌ | ✅ | **⚠ FAILS AA for normal-size text.** |
| Cream `#FDF6F0` | Terracotta `#C05A2C` | ~4.0:1 | ❌ | ✅ | Same — fails at body size. |
| Gold `#B8943E` | Cream `#FDF6F0` | **~2.6:1** | ❌ | ❌ | **⚠ FAILS AA entirely.** |
| Charcoal `#2D2D2D` | Terracotta `#C05A2C` | ~3.2:1 | ❌ | ✅ | Already banned by the Brand Book anyway. |
| Cream `#FDF6F0` | Forest `#1D6B4F` | ~5.9:1 | ✅ | ✅ | Safe. |
| Cream `#FDF6F0` | Charcoal `#2D2D2D` | ~13.0:1 | ✅ | ✅ | Safe. |

*(Ratios computed from the specified hex values; to be re-verified with an automated audit in Phase 3.)*

**Three binding accessibility rules follow, and they constrain the design directly:**

- **AX-01 — Terracotta must not carry normal-size text on cream.** A `1rem` terracotta link on a cream ground fails AA. Terracotta may be used for: large text (≥24px, or ≥19px bold), icons, borders, fills, and the sun-burst. For inline links at body size, the link colour must be **forest green** (5.9:1), with terracotta reserved for the **hover/focus** state plus a persistent underline. *This is a deviation from the instinct that "terracotta is primary" — the Brand Book makes terracotta the primary **figure**, not the primary **text**, and the Brand Book itself specifies charcoal as the principal text colour. The palette is internally consistent; the failure mode is only introduced if we misuse terracotta as a text colour.*
- **AX-02 — Terracotta CTA buttons must set their label in cream at ≥19px semibold, or ≥24px regular.** A small terracotta button with a cream label at 14px fails. Primary buttons therefore have a minimum type size. Alternatively, the primary button may be **charcoal** ground with cream label (13:1) — but this is a visual departure and requires client approval (D-04).
- **AX-03 — Gold is never used for text or for any element conveying information.** It is decorative only: hairline rules, ornamental marks, and non-essential dividers. It must never be a link, a badge, a status colour, or a price. This is consistent with the Brand Book's own "no more than twice in any one composition."

**Other accessibility requirements:**
- Target size ≥44×44px (WCAG 2.5.8), critical for the small-Android audience.
- Focus visible: 2px forest-green outline with a 2px cream offset. Never `outline: none`.
- `prefers-reduced-motion: reduce` disables all transitions and parallax. (The brand is calm; motion should be minimal even by default.)
- Every product image needs meaningful `alt`. Decorative images get `alt=""`.
- Colour is never the sole carrier of meaning — the flavour strip swatch is always accompanied by the flavour name.
- Full keyboard operability including the cart drawer, the build-a-box picker, and the M-PESA polling state.
- Form errors announced via `aria-live="polite"`, and never colour-only.
- Semantic landmarks; a single `<h1>` per page; a visible skip link.
- Language: `lang="en-KE"`.
- **Accessibility statement page is in scope** (site map §4).

---

## 2. Competitive Benchmarking

15 references evaluated — 8 ecommerce, 7 non-ecommerce. Analysis is of publicly observable patterns as a matter of design research. **No branding, copy, layout, or asset from any reference is to be copied.** The output of this section is the original Tabasamu Sips design principles in §2.3.

### 2.1 Ecommerce references

---

#### E-01 · Health-Ade Kombucha — *premium beverage / category leader*
- **Does well:** Flavour-as-colour system that survives thumbnail size; strong "our process" transparency page; subscription is a first-class object, not an afterthought.
- **Do not copy:** High-saturation, high-energy visual register. Bubbles, splashes, exclamation. Directly antithetical to Tabasamu's photography rules.
- **Navigation:** Flat horizontal — Shop / Flavours / Our Story / Find Us. Sticky.
- **Homepage hierarchy:** Hero → flavour grid → process → press → subscribe.
- **Product discovery:** Colour-coded flavour grid. Effective *because* their labels differ. **Tabasamu's labels deliberately do not.** Direct transplant fails.
- **PDD:** Large packshot, flavour notes, nutrition panel, subscribe/one-time toggle.
- **Checkout:** Standard multi-step, guest allowed.
- **Mobile:** Sticky add-to-cart bar. Worth adopting.
- **Storytelling:** Founder-led, health-outcome-forward.
- **Photography:** Studio, bright, high-key. Rejected.
- **Motion:** Bouncy micro-interactions. Rejected.
- **Accessibility:** Adequate; colour-coding is the sole carrier in places — a failure to avoid.
- **Trust:** Reviews, press logos, nutrition transparency.
- **Applicable:** Subscribe/one-time toggle on PDP; sticky mobile ATC; process transparency as a *page*, not a banner.

---

#### E-02 · Remedy Kombucha — *sugar-free positioning*
- **Does well:** A single, hard, specific claim ("no sugar") owned relentlessly. Nutrition panel is prominent, not buried.
- **Do not copy:** Loud, youth-coded, high-contrast graphic language.
- **Navigation:** Mega-menu by product family.
- **Homepage hierarchy:** Claim → proof → range → stockists.
- **Product discovery:** Filter by product family and pack size.
- **PDP:** Claim reinforced above the fold; nutrition immediately visible.
- **Checkout:** Conventional.
- **Mobile:** Solid; large tap targets.
- **Storytelling:** Claim-led, not story-led.
- **Photography:** Product-on-colour. Rejected.
- **Motion:** Minimal. Fine.
- **Accessibility:** Contrast is strong (a consequence of the loud palette).
- **Trust:** Nutrition panel as trust device — **strongly applicable.**
- **Applicable:** Tabasamu owns "caffeine-free" the way Remedy owns "no sugar" — one claim, stated once, proved with a panel. But Tabasamu proves it quietly. *"Caffeine-free. Sugar-honest. Brewed in Nairobi."*

---

#### E-03 · Karma Drinks / Karma Cola — *ethical supply chain, editorial commerce*
- **Does well:** Supply-chain story is the product story. Farm-level specificity. Editorial and commerce genuinely interleaved.
- **Do not copy:** Hand-drawn, folksy illustration; the "good deed" register can slide into the extraction trope.
- **Navigation:** Drinks / Our Story / Foundation / Stockists.
- **Homepage hierarchy:** Story → product → impact → buy.
- **Product discovery:** Small, curated range — no filtering needed.
- **PDP:** Ingredient provenance sits *above* the nutrition panel.
- **Checkout:** Simple.
- **Mobile:** Editorial holds up in single column.
- **Storytelling:** **Best-in-class for a small range.** Story pages have real depth and are linked from the PDP, not siloed.
- **Photography:** Documentary, warm, natural. **Closest register to Tabasamu's rules.**
- **Motion:** Restrained.
- **Accessibility:** Middling.
- **Trust:** Named farms, named regions. **Exactly the Tabasamu voice: "Ginger from Meru. Six days in the jar."**
- **Applicable:** **Highest applicability of any ecommerce reference.** Provenance-above-nutrition on the PDP; story pages deep-linked from product; a small curated range that needs no filter UI.

---

#### E-04 · Dr. Squatch / Native — *DTC subscription mechanics*
- **Does well:** Subscription flow is unambiguous. Frequency, skip, pause, swap, cancel are all findable and all self-serve.
- **Do not copy:** Everything about the tone and the aggressive upsell architecture.
- **Navigation:** Product-led.
- **Homepage hierarchy:** Offer-driven. Rejected.
- **Product discovery:** Quiz-led. Rejected for Tabasamu (a quiz is instructive; the brand is invitational).
- **PDP:** Subscribe-first pricing, one-time de-emphasised. **Rejected** — Tabasamu must present both neutrally.
- **Checkout:** Aggressive upsells and order bumps. **Rejected outright** — this is urgency theatre.
- **Mobile:** Strong.
- **Storytelling:** Minimal.
- **Photography:** Studio. Rejected.
- **Motion:** Heavy. Rejected.
- **Accessibility:** Weak.
- **Trust:** Reviews at volume.
- **Applicable:** **The subscription-management surface only.** Skip / pause / swap flavour / change frequency / change address / cancel — all self-serve, no email required, no dark pattern. Tabasamu adopts the *capability*, not the *pressure*.

---

#### E-05 · Vivo Activewear (Kenya) — *Kenyan DTC, mobile-first payments*
- **Does well:** M-PESA is a first-class, expected payment method — not an "alternative". The flow assumes the customer knows STK push and expects the prompt.
- **Do not copy:** The visual system is unrelated.
- **Navigation:** Category-led, conventional.
- **Homepage hierarchy:** Promotional.
- **Product discovery:** Category + size filters.
- **PDP:** Standard.
- **Checkout:** **The key artefact.** Phone number is a primary field. STK-push prompt is explained *before* it fires. A pending state exists and is honest about it.
- **Mobile:** The primary surface. Desktop is secondary. **Correct for the Kenyan market.**
- **Storytelling:** Light.
- **Photography:** Studio + lifestyle.
- **Motion:** Minimal.
- **Accessibility:** Basic.
- **Trust:** Local delivery zones stated explicitly. Physical store addresses.
- **Applicable:** **Essential.** M-PESA as default, not fallback. Explicit pending/confirming state. Delivery-zone clarity. Mobile-first, genuinely — not "responsive as an afterthought".

---

#### E-06 · Kikoromeo / Kenyan boutique ecommerce — *African premium, mobile payment*
- **Does well:** Premium African brand that doesn't perform its Africanness for a foreign gaze. Restrained. Confident.
- **Do not copy:** Sparse product data; thin PDPs.
- **Navigation:** Minimal.
- **Homepage hierarchy:** Editorial hero → collection.
- **Product discovery:** Collection-led.
- **PDP:** Under-specified — a lesson in what *not* to omit.
- **Checkout:** M-PESA + card.
- **Mobile:** Adequate.
- **Storytelling:** Understated. **Register is right.**
- **Photography:** Natural light, warm. **Aligned.**
- **Motion:** Minimal.
- **Accessibility:** Weak.
- **Trust:** Thin — no reviews, unclear delivery. **A cautionary tale: restraint must not become opacity.**
- **Applicable:** Confirms the register is commercially viable in Kenya. Also warns: *quiet ≠ vague.* Tabasamu must be quiet **and** completely explicit about delivery, fees, timing, and returns.

---

#### E-07 · Sakara Life / Daily Harvest — *subscription-first premium food*
- **Does well:** Build-a-box flow is genuinely good — a running total, live constraint feedback ("choose 6"), and a persistent summary that follows you.
- **Do not copy:** Wellness-lifestyle copy register. Full of exactly the banned vocabulary.
- **Navigation:** Shop / How it works / Subscriptions.
- **Homepage hierarchy:** How-it-works → build → subscribe.
- **Product discovery:** Within the box builder itself. **Very applicable.**
- **PDP:** Individual items are secondary to the box.
- **Checkout:** Subscription-native.
- **Mobile:** Box builder degrades badly on small screens. **A specific trap to avoid.**
- **Storytelling:** Lifestyle-heavy.
- **Photography:** Overhead, styled, high-key. Rejected.
- **Motion:** Moderate.
- **Accessibility:** Box builder is poorly keyboard-operable. **Explicit anti-pattern.**
- **Trust:** Nutritionist framing.
- **Applicable:** The **build-a-box mechanics** — running count, live constraints, persistent summary. And a hard warning: the box builder is the single hardest component to get right on a small Android device. Design it mobile-first or it will fail.

---

#### E-08 · Jumia Kenya — *mass-market Kenyan commerce baseline*
- **Does well:** Assumes low bandwidth and low-end devices. Aggressive image optimisation. Works on a 3G connection. Payment-on-delivery and M-PESA are normal.
- **Do not copy:** Everything visual. Dense, cluttered, urgency-saturated.
- **Navigation:** Mega-menu, deep.
- **Homepage hierarchy:** Deal-driven.
- **Product discovery:** Search + heavy facets.
- **PDP:** Dense, spec-heavy.
- **Checkout:** Multiple payment rails, including pay-on-delivery.
- **Mobile:** **The benchmark for performance, not aesthetics.** Fast on bad connections.
- **Storytelling:** None.
- **Photography:** Poor.
- **Motion:** None (which helps).
- **Accessibility:** Poor.
- **Trust:** Order tracking, returns policy, delivery estimate per item.
- **Applicable:** **The performance floor.** If Tabasamu's site is slower than Jumia on a Nairobi 3G connection, the site has failed regardless of how beautiful it is. Also: **per-item delivery estimate** and **explicit returns policy** are baseline Kenyan-market trust expectations.

---

### 2.2 Non-ecommerce references

---

#### N-01 · Kinfolk — *editorial magazine*
- **Does well:** Generous negative space as a structural principle, not a decoration. Type does the work. Silence is the design.
- **Do not copy:** The near-total absence of commerce affordances; the Scandinavian coldness.
- **Navigation:** Minimal, top-level only.
- **Homepage hierarchy:** One featured story, then a quiet grid.
- **Discovery:** Editorial browse, not filter.
- **Detail:** Long-form, wide margins, single column.
- **Checkout:** N/A.
- **Mobile:** Type scales beautifully. Single column throughout.
- **Storytelling:** **The register Tabasamu aspires to.** *"Shoot it like a magazine, not an ad."*
- **Photography:** Natural light, muted, generous space. **Directly aligned.**
- **Motion:** Almost none. **Correct.**
- **Accessibility:** Good contrast, semantic structure.
- **Trust:** Editorial authority.
- **Applicable:** **The spatial system.** 60–70% empty is not wasted space — it is the brand. Tabasamu's cream ground *is* Kinfolk's white space, warmed.

---

#### N-02 · Cereal Magazine — *travel/editorial*
- **Does well:** Restraint at scale. A large image library presented without noise. Type hierarchy is disciplined and never shouts.
- **Do not copy:** Monochrome coldness; the tourism subject matter (which is *precisely* the trap Tabasamu must avoid).
- **Navigation:** Text-only nav, no icons.
- **Homepage hierarchy:** Image-led, minimal text.
- **Discovery:** Chronological + category.
- **Detail:** Full-bleed images alternating with narrow text columns.
- **Checkout:** Light (print subscriptions).
- **Mobile:** Clean.
- **Storytelling:** Place-led, quiet.
- **Photography:** Muted, wide, empty. **Register aligned.**
- **Motion:** None.
- **Accessibility:** Fine.
- **Trust:** Craft.
- **Applicable:** Alternating full-bleed image / narrow text column is the right rhythm for **Our Story** and **Ingredients & Fermentation**. Text-only navigation (no icons) suits the brand's restraint.

---

#### N-03 · Aesop — *the closest analogue overall*
- **Does well:** Premium restraint *with* full commerce. Product cards are almost austere and still convert. Ingredient lists are treated as editorial content. The store locator is a first-class page.
- **Do not copy:** The specific typographic voice; the near-clinical coolness (Tabasamu is warm).
- **Navigation:** Text-only, quiet, comprehensive.
- **Homepage hierarchy:** Restrained hero → curated products → editorial.
- **Product discovery:** Category + a "consult" path. No aggressive filtering.
- **PDP:** **Model to study.** Ingredients, provenance, and usage sit alongside the buy box, not below the fold. The buy box is small and calm.
- **Checkout:** Quiet, no upsell pressure.
- **Mobile:** Excellent single-column PDP.
- **Storytelling:** Product-integrated, not siloed.
- **Photography:** Muted, still-life, natural. **Aligned.**
- **Motion:** Minimal, purposeful.
- **Accessibility:** Strong.
- **Trust:** Ingredient transparency; stockists; no reviews at all — and it doesn't hurt them.
- **Applicable:** **Highest applicability of any reference on this list.** Proves the thesis: *a quiet, editorial, restraint-led commerce site converts at premium price points.* Adopt: the calm buy box; ingredients as editorial; the stockist page as a real page; the absence of review-count theatre.

---

#### N-04 · The Nairobi/Kenyan boutique hotel sector (e.g. Hemingways, Giraffe Manor) — *boutique hospitality*
- **Does well:** Sells a *feeling of place* without tourism cliché (at their best). Booking flow is transactional but never breaks the mood.
- **Do not copy:** Where they do fall into safari imagery — **that is precisely the guardrail**. Study these to know what *not* to do.
- **Navigation:** Rooms / Dining / Story / Book.
- **Homepage hierarchy:** Immersive hero → offer → book.
- **Discovery:** Browse by room type.
- **Detail:** Long-form room pages with generous imagery.
- **Checkout:** Date-driven booking engine, often a jarring third-party embed. **Anti-pattern:** never let checkout look like it belongs to a different company.
- **Mobile:** Variable.
- **Storytelling:** Place and mood.
- **Photography:** Natural light, interiors, warm. Aligned when they resist the savanna.
- **Motion:** Slow fades, parallax. **Rejected** — Tabasamu's motion must be near-zero.
- **Accessibility:** Weak.
- **Trust:** Awards, press.
- **Applicable:** **Checkout must feel like the same brand.** If M-PESA or Stripe drags the customer into a visually foreign surface, the premium positioning collapses at the exact moment it matters. Checkout is styled as Tabasamu, end to end.

---

#### N-05 · Studio MK27 / David Chipperfield — *architecture studio*
- **Does well:** Content-first, chrome-almost-absent. A grid that lets the work speak. Zero decoration.
- **Do not copy:** The commercial coldness; the near-hostile lack of wayfinding.
- **Navigation:** Sparse, sometimes to a fault.
- **Homepage hierarchy:** A grid of work. Nothing else.
- **Discovery:** Project grid, filterable by type/year.
- **Detail:** Image-dominant, text as caption.
- **Checkout:** N/A.
- **Mobile:** Simple stacking.
- **Storytelling:** Implicit — the work argues for itself.
- **Photography:** Architectural, natural light, composed.
- **Motion:** None.
- **Accessibility:** Often poor (a common failing of this genre).
- **Trust:** The portfolio.
- **Applicable:** The **near-absent chrome** principle. Tabasamu's UI should recede. Buttons, borders, cards, and shadows should be as few as the brand can bear — but **not at the cost of wayfinding**, which is where this genre fails.

---

#### N-06 · African design & craft organisations (e.g. Design Network Africa, Ardmore, Kazuri) — *cultural confidence*
- **Does well (at best):** Present African craft as craft, priced and photographed as such. No apology, no explanation.
- **Do not copy:** Where they slide into "artisan empowerment" framing, or into pattern-as-wallpaper decoration. Both are traps.
- **Navigation:** Maker / Collection / Story.
- **Homepage hierarchy:** Maker-led.
- **Discovery:** By maker or by collection.
- **Detail:** Provenance-heavy.
- **Checkout:** Often weak.
- **Mobile:** Variable.
- **Storytelling:** Maker narrative. **Applicable if it stays specific and avoids the extraction trope.**
- **Photography:** Object-focused. Aligned.
- **Motion:** Minimal.
- **Accessibility:** Weak.
- **Trust:** Provenance.
- **Applicable:** The Brand Book already names **Kazuri and Kitengela ceramic** as required props. There is a genuine, non-decorative provenance story here. Ingredients & Fermentation should name farms and regions with the same directness that a craft site names its makers — *and stop there*. No empowerment narrative. No hands-of-the-farmer photograph.

---

#### N-07 · Emergence Magazine / Calm cultural publications — *quiet long-form*
- **Does well:** Long-form reading that respects the reader. Typography-first. Reading progress and estimated time given without gimmick.
- **Do not copy:** The heavy scroll-driven motion some of these employ.
- **Navigation:** Minimal.
- **Homepage hierarchy:** Featured essay.
- **Discovery:** Editorial index.
- **Detail:** **The best long-form reading experience on this list.** Measure ~65ch. Comfortable leading. Images breathe.
- **Checkout:** N/A.
- **Mobile:** Excellent.
- **Storytelling:** Deep.
- **Photography:** Natural, documentary.
- **Motion:** Some scroll-jacking. **Rejected.**
- **Accessibility:** Strong typographic accessibility.
- **Trust:** Editorial rigour.
- **Applicable:** The **Journal / Notes** section. Measure, leading, and image rhythm. And a hard no on scroll-jacking — `prefers-reduced-motion` must be honoured and motion should be near-zero regardless.

---

### 2.3 Original Tabasamu Sips design principles

Derived from the research, expressed as binding rules for Phases 2–3. These are original to this project.

| # | Principle | Meaning | Test |
|---|---|---|---|
| **P-01** | **Cream is the room.** | The 60–70% cream ground is not a background — it is the primary design element, the same way negative space is the primary element in the photography. Every screen is mostly cream. | If a screenshot is <60% cream, it is off-brand. |
| **P-02** | **The interface recedes; the product and the writing advance.** | Minimal chrome. Few borders. No shadows. No cards-with-elevation. Buttons are the only strongly-figured UI element on any screen. | Count the UI elements that are not content. If >5 per viewport, remove some. |
| **P-03** | **Quiet is not vague.** | The single greatest risk of a restrained premium site in the Kenyan market is that restraint reads as opacity. Delivery zones, fees, timings, payment states, and returns must be **more** explicit than a loud site's, not less. | Can a first-time buyer in Kasarani find the delivery fee to their estate in ≤2 taps, before entering the cart? |
| **P-04** | **One claim, stated once, proved with a panel.** | "Caffeine-free" is the claim. It is stated once, prominently, in the brand's plain register. It is then *proved* with a nutrition/ingredients panel — not repeated as a slogan on every section. | Does the phrase "caffeine-free" appear more than twice on any single page? If so, cut. |
| **P-05** | **Provenance sits above nutrition, and both sit above persuasion.** | On a PDP, the order is: what it is → where it came from → what's in it → how to buy. Never: buy → then justify. | PDP DOM order must match this. |
| **P-06** | **The label does not differentiate; the photograph and the strip do.** | Because the label system is deliberately uniform, product discovery must lean on the flavour strip swatch, the ingredient cue in the lifestyle image, and the flavour name in Fraunces. Never on the bottle silhouette. | Can a user distinguish two flavours at a 160px thumbnail, in greyscale? |
| **P-07** | **No urgency, ever.** | No countdowns, no scarcity theatre, no exit-intent, no social-proof popups, no "only 2 left!". Stock messaging is factual and calm: "Two bottles remaining." | Grep the copy for `!`, "hurry", "last chance", "don't miss". Should return zero. |
| **P-08** | **Checkout is the same brand as the homepage.** | M-PESA and Stripe must be embedded in Tabasamu's own visual system. The customer must never be visually handed off to a payment vendor's interface at the moment of highest trust. | Screenshot checkout. Is it >60% cream, in Fraunces and DM Sans? |
| **P-09** | **Mobile-first is literal, not responsive-as-afterthought.** | The primary device is a mid-range Android on an inconsistent connection. The design is authored at 360px and *expanded*, never authored at 1440px and *squeezed*. | The build-a-box picker is the test case. If it works at 360px, everything does. |
| **P-10** | **Performance is a brand attribute.** | A slow site is not calm; it is broken. If the site is slower than Jumia on Nairobi 3G, the premium positioning has failed. Target: LCP <2.5s on Slow 4G, <1.5s on 4G. Total above-fold JS <100KB gzipped. | Lighthouse on throttled Moto G. |
| **P-11** | **Motion is near-zero by default.** | Not "reduced motion when requested" — *reduced motion as the default*, with `prefers-reduced-motion` removing what little remains. No parallax. No scroll-jacking. No entrance animations. Transitions ≤200ms, opacity and small translate only. | Any animation >200ms or involving scroll position is rejected. |
| **P-12** | **Silence between forest and terracotta.** | Never place the two saturated brand colours edge to edge. Cream always buffers. This applies to section boundaries, button groups, and any adjacent fills. | Automated check: no forest element may share a border with a terracotta element. |
| **P-13** | **Gold is a rumour.** | Gold appears at most twice per composition, never as text, never as a link, never as a status. It is a hairline, a mark, a small ornament. It fails all contrast tests and is therefore *structurally* decorative. | Count gold instances per viewport. >2 is a defect. |
| **P-14** | **We do not explain Kenya.** | No glossaries, no "did you know", no maps of Africa, no flags, no explanatory subtitles under Swahili words beyond a single confident translation in Our Story. | Grep for "-inspired", "traditional", "exotic", "authentic". Zero. |
| **P-15** | **Ingredients are editorial, not a compliance footnote.** | The Ingredients & Fermentation page is a real editorial destination — named farms, named regions, named days — linked from every PDP. It is not an accordion at the bottom of the buy box. | Is Ingredients reachable in one click from every PDP? |

---

## 3. User & Business Requirements

*(See `04_User_Journey_Map.md` for the full task/frustration/success breakdown per group. Summarised here.)*

### 3.1 Customer-side groups

| Group | Primary job | Key frustration to eliminate | Success criterion |
|---|---|---|---|
| **First-time shopper** | Understand what this is and whether it's worth KES X, then buy without friction. | Not knowing the delivery fee to their area until checkout. Not knowing when it arrives. | Reaches order confirmation in ≤5 minutes on mobile, and knew the total cost before entering the cart. |
| **Returning customer** | Reorder the same thing, fast. | Re-entering the address. Re-choosing the flavour. | Reorder in ≤3 taps from account. |
| **Subscriber** | Set a rhythm and forget it — then change it when life changes. | Having to email or WhatsApp to skip a week. | Skip, pause, swap flavour, change date and cancel — all self-serve, no contact required. |
| **Gift purchaser** | Send to someone else, with a note, without the recipient seeing the price. | Price appearing on the delivery note. Delivery address confusion. | Separate recipient address, gift note, no pricing in the parcel. |
| **Wholesale / corporate buyer** | Get a price list and a contact, not a shopping cart. | Being funnelled into a consumer checkout. | Submits a qualified enquiry and receives a wholesale sheet. |

### 3.2 Internal groups

| Group | Primary job | Key requirement |
|---|---|---|
| **Store administrator** | Manage products, variants, stock, pricing, discounts, content. | Full CRUD on the catalogue without a developer. Stock adjustment must be one field. |
| **Operations staff** | Fulfil orders. Print run sheets. Manage delivery zones. | A daily fulfilment view, grouped by delivery zone. Batch status updates. |
| **Customer care staff** | Resolve order and payment issues, especially M-PESA. | Order lookup by phone number **and** M-PESA reference. Read-only access to payment webhook history. Ability to re-trigger a failed STK push. |
| **Content editor** | Publish Journal entries, edit Our Story, manage stockists. | Draft/preview/publish. No access to orders or customers. |
| **Finance / reporting** | Reconcile M-PESA and Stripe. Report on revenue, VAT, subscriptions. | Export orders + payments to CSV. Payment reference must be visible on every order. |
| **Backend developer** | Replace the mocked services with a real backend. | Every data access goes through a documented, typed interface. Zero backend logic in components. See `11_Backend_Handover_Requirements.md`. |

### 3.3 Business requirements

- Sell direct to consumer in Nairobi, with M-PESA as the primary rail.
- Support a subscription model (the highest-LTV channel).
- Support wholesale and corporate as *enquiry* flows, not cart flows.
- Preserve premium positioning — the site must never compete on discount.
- Be maintainable by a non-developer for content and catalogue.
- Be handed to a backend developer without rework.

---

## 4. Site Map

See `05_Site_Map.md`.

## 5. Commerce Requirements

See `06_Product_Requirements_Document.md` §5, and `08_Client_Decisions_Register.md` for everything unresolved.

**No commercial rule has been invented.** Every pricing, delivery, tax, refund, promotion, and inventory rule that was not present in the supplied documents has been logged as a client decision, not guessed.

---

## 6. Phase 1 Deliverables Index

| # | Document | File |
|---|---|---|
| 1 | Phase 1 Discovery Report | `01_Phase1_Discovery_Report.md` *(this document)* |
| 2 | Competitive Benchmark Matrix | `02_Competitive_Benchmark_Matrix.md` |
| 3 | Product Requirements Document | `03_Product_Requirements_Document.md` |
| 4 | User Journey Map | `04_User_Journey_Map.md` |
| 5 | Site Map | `05_Site_Map.md` |
| 6 | Feature Inventory | `06_Feature_Inventory.md` |
| 7 | Content Inventory | `07_Content_Inventory.md` |
| 8 | Client Decisions Register | `08_Client_Decisions_Register.md` |
| 9 | Risks & Assumptions Register | `09_Risks_and_Assumptions_Register.md` |
| 10 | Initial Data Entity Map | `10_Data_Entity_Map.md` |
| 11 | Phased Implementation Plan | `11_Phased_Implementation_Plan.md` |
| 12 | Backend Handover Requirements | `12_Backend_Handover_Requirements.md` |
| 13 | Changelog | `CHANGELOG.md` |

---

## 7. Phase 1 Conclusion — the three things that block Phase 2

1. **The photography library cannot support an ecommerce site.** Four usable images, all landscape lifestyle frames, no packshots, no square or portrait crops, no cut-outs, one flavour entirely unphotographed and one photographed with a broken label. A reshoot or an asset-production sprint is a **gate**, not a nice-to-have.
2. **The logo is not production-ready.** Live text in an unlicensed trial font, no monogram variant, no reversed variants. This blocks the header, the favicon, and every mobile viewport.
3. **The flavour count is unresolved.** The Brand Book says three. The photography implies six. The commerce catalogue cannot be modelled until this is answered.

Everything else in this report is executable. These three are not.
