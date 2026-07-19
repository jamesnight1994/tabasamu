# Risks & Assumptions Register

**Likelihood / Impact:** H / M / L
**Exposure:** Likelihood × Impact
**Owner:** who must act

---

## Part A — Risks

### 🔴 Critical exposure

| ID | Risk | L | I | Exposure | Mitigation | Owner |
|---|---|---|---|---|---|---|
| **R-01** | **The brand's central claim may be unsupportable.** The Brand Book's mission is *"rooted in Kenyan soil"* and its origin story cites *"Kenyan-grown hibiscus"*. But the product is **rooibos** — which is South African, not Kenyan-grown. The binding document contradicts the product it governs. | **H** | **H** | 🔴 | **Escalate to the brand owner immediately (D-50).** Do not write Our Story, Ingredients, or any provenance block until resolved. Three possible resolutions: (a) the Brand Book origin story is legacy copy and should be corrected; (b) the product genuinely contains Kenyan-grown hibiscus/ginger/turmeric *alongside* a rooibos base, in which case the story must say so precisely; (c) the "Kenyan soil" claim is softened. **Only the client can choose.** | Client / brand |
| **R-02** | **Invented health claims enter the site through the back door** — via FAQs, Journal entries, meta descriptions, or a well-meaning content editor. "Supports gut health", "aids digestion", "safe in pregnancy". | **H** | **H** | 🔴 | Three layers: (1) **copy lint in CI** on the Brand Book §07 banned list, extended with health-claim vocabulary; (2) the lint **runs on published CMS content, not just source** (F-95) — the editor is the highest-risk author; (3) **every FAQ answer touching safety, shelf life, or health must be supplied by the client in writing** (D-46). NN-05 is a hard rule. | Studio + client |
| **R-03** | **The photography library cannot support an ecommerce site.** Four usable images. All 16:9 landscape lifestyle. **No packshots, no square crops, no 4:5 portrait crops, no cut-outs, no back-labels, no process shots.** One flavour (Beetroot) has a garbled, illegible label. One (Gooseberry) has no image at all. A product grid, a PDP gallery, and a cart thumbnail all require assets that **do not exist**. | **H** | **H** | 🔴 | **This is a gate, not a task.** A photography production sprint sits between Phase 1 and Phase 3. Approx. 30 images needed (Content Inventory §3.2). Brief is already written by the Brand Book: *"shoot it like a quiet magazine essay about a maker's afternoon."* **Phase 2 must not proceed on the assumption the library is complete.** | Client / photographer |
| **R-04** | **The logo is not production-ready.** The wordmark is **live text set in "Canela Trial"** — an unlicensed trial font, and **not** the Brand Book's specified Fraunces Medium at –20 tracking. It will fall back to a system serif on any device. There is **no monogram**, which the Brand Book requires for the 40px digital minimum and the 16×16 favicon. There are no reversed variants. | **H** | **H** | 🔴 | **Blocks the header, the mobile header, and the favicon.** Designer must: outline the wordmark in **Fraunces Medium at –20 tracking** (the actual spec), produce the monogram, produce cream-reversed variants of both. Also a **licensing exposure** — shipping a trial font is a real legal risk. | Designer |
| **R-05** | **Stripe may not be able to settle KES for a Kenyan entity.** Stripe does not offer standard KES settlement for Kenyan-registered businesses. | **M** | **H** | 🔴 | **Found in Phase 1, deliberately — this is exactly the kind of thing that becomes a crisis in Phase 6.** Confirm the trading entity and settlement currency (D-35). If Stripe is not viable, an alternative card rail (Flutterwave, Pesapal, DPO) must be selected **now**, because it changes the integration spec, the checkout UI, and the webhook contract. **The port abstraction (`PaymentGateway`) is designed so this swap is survivable — but it must be known before the adapter is written.** | Client / finance |
| **R-06** | **M-PESA has no card-on-file equivalent, so subscriptions have no obvious recurring-charge mechanism.** A subscriber cannot be silently charged each month the way a Stripe customer can. | **H** | **H** | 🔴 | **This is the single most consequential unanswered question in the payments architecture (D-09).** Options: (a) re-prompt with an STK push each cycle (reliable, but the customer must be present and it will fail often); (b) M-PESA standing order / Ratiba (limited availability, needs bank involvement); (c) card-only subscriptions via the card rail (but see R-05); (d) a pre-paid model — buy a 3-month block up front. **Each of these produces a materially different subscription UX and data model.** It must be decided before any subscription code is written. | Client / dev |

### 🟠 High exposure

| ID | Risk | L | I | Exposure | Mitigation | Owner |
|---|---|---|---|---|---|---|
| **R-07** | **The primary CTA fails accessibility.** Terracotta `#C05A2C` with a cream label is **4.0:1** — below the 4.5:1 AA threshold for normal text. Gold `#B8943E` on cream is **2.6:1**, failing entirely. | **H** | M | 🟠 | Not a bug to be fixed silently — it is a **brand decision** (D-04). Either enforce a type-size floor on primary buttons (≥19px semibold), or use a charcoal ground (13:1). **AX-01/AX-02/AX-03 already constrain the design accordingly: links are forest green, not terracotta; gold is never text.** The palette is internally coherent — the Brand Book itself names charcoal as the principal text colour. The failure only appears if terracotta is misused *as text*. | Client / brand |
| **R-08** | **Restraint reads as opacity.** The E-06 lesson: a quiet premium Kenyan site that is vague about delivery, fees, and returns loses the sale at exactly the moment the customer is deciding to trust it. | M | **H** | 🟠 | **P-03 is the mitigation, and it is binding:** the delivery fee for the customer's zone must be discoverable **before the cart** — a zone selector on the PDP. Delivery & Returns is a first-class page. *Quiet ≠ vague.* | Studio |
| **R-09** | **The build-a-box picker breaks on a 360px Android, or fails keyboard testing.** **Every reference implementation of this pattern does** (E-07). | **H** | M | 🟠 | Author it at **360px first** (P-09). Persistent summary must not occlude the picker. Full keyboard operability is a P0 acceptance criterion (F-37), tested with a screen reader, not assumed. **It is one of the three journeys prototyped first.** | Studio |
| **R-10** | **An M-PESA payment is lost across a connection drop**, and the customer does not know whether their money left their account. | **H** | **H** | 🟠 | **The single hardest technical requirement in the build (F-58).** The pending state must be **server-authoritative**, keyed by `CheckoutRequestID`, and must survive a page reload. Three distinct outcome routes — success, failed, **unknown** — because **guessing about a customer's money is the fastest way to destroy trust in this market.** Prototyped first (Journey 1). | Studio + backend |
| **R-11** | **Two order-intake paths.** If WhatsApp remains an *ordering* channel alongside the cart (as the Strategy document assumes), inventory will drift and reconciliation will break. | M | **H** | 🟠 | **Decide before the data model is fixed (D-42).** Recommendation: WhatsApp is a **support link and a notification channel**, not an order channel. If the client insists on WhatsApp ordering, it must write into the *same* order entity via the admin, not a parallel book. | Client |
| **R-12** | **Product discovery fails because every label is identical.** The Brand Book's label system is *deliberately* uniform — *"one layout, one type lockup, one botanical motif. Only the bottom strip changes."* At a 160px thumbnail, the bottles are indistinguishable. | **H** | M | 🟠 | **This is a constraint the brand system creates, and no reference brand has solved it — because no reference brand has a deliberately uniform label.** It requires an original solution (P-06): the strip swatch + the ingredient cue in the photograph + the flavour name in Fraunces. **Acceptance test: can a user distinguish two flavours at 160px, in greyscale?** One of the three journeys prototyped first. | Studio |
| **R-13** | **Backend logic leaks into components.** Pricing rules, delivery-fee maths, or M-PESA phone normalisation end up hard-coded in a React component — and the backend handover becomes a rewrite. | M | **H** | 🟠 | **NN-06 exists precisely to prevent this.** Enforced by an **import-boundary lint rule**: components may not import adapters. The domain layer is pure TypeScript with zero dependencies. **Verification: the full flow test suite runs against both `MockAdapters` and `HttpAdapters` with zero changes above the adapter layer.** | Studio |
| **R-14** | **The site is slower than Jumia on Nairobi 3G**, and the premium positioning collapses. A slow site is not calm; it is broken. | M | **H** | 🟠 | **P-10.** Performance is a brand attribute, not an engineering nicety. Budget enforced in CI (PRD §3.3): <100KB above-fold JS, LCP <2.5s on Slow 4G. **Three variable fonts is a real payload** — subset, self-host, preload only two. Test on a throttled Moto G, not a MacBook. | Studio |

### 🟡 Medium exposure

| ID | Risk | L | I | Exposure | Mitigation | Owner |
|---|---|---|---|---|---|---|
| **R-15** | **Off-palette colours enter via the flavour strips.** Passion (blue) and Beetroot (deep red) appear in photography but are **not in the five-colour Brand Book palette**. If promoted into site chrome, they break the palette. | **H** | M | 🟡 | **D-03 must be answered by the brand owner.** Regardless: flavour strips are a **packaging** system, not a **web** system. On the site they appear **only** as a small identifying swatch on the card and PDP — never as a card background, a section fill, or a button colour. | Client / brand |
| **R-16** | **Pure white creeps in** through a modal, an input field, a card, or a third-party embed. The Brand Book forbids it. | **H** | L | 🟡 | **NFR-04: a colour lint fails the build on `#FFFFFF` as a ground.** Applies to third-party embeds too — the Stripe Payment Element must be themed (P-08). | Studio |
| **R-17** | **Forest and terracotta placed edge-to-edge**, which the Brand Book explicitly forbids. | M | L | 🟡 | **P-12** + an automated adjacency check (F-12). Cream always buffers. | Studio |
| **R-18** | **Urgency architecture creeps in** from stakeholder pressure — a "Only 2 left!" badge, a launch countdown, a first-order popup. Each one individually seems harmless. | M | M | 🟡 | **P-07 is binding and the copy lint enforces it** (grep for `!`, "hurry", "last chance", "don't miss"). **Frame it commercially, not aesthetically:** a countdown timer on a premium editorial brand does not raise conversion — it lowers price perception. The brand's own voice document is the authority: *"the voice of someone already at ease."* | Studio + client |
| **R-19** | **The content editor publishes banned vocabulary.** They are the highest-risk author on the project and the least likely to have read the Brand Book. | **H** | M | 🟡 | **The copy lint runs on published CMS content, not just on source code (F-95).** A draft containing "wellness journey" **cannot be published.** This is a product feature, not a process suggestion — process fails. | Studio |
| **R-20** | **Fulfilment view sorted by time, not by geography** — and therefore useless for routing deliveries in Nairobi. | M | M | 🟡 | **F-86: the default order view groups by delivery zone.** This came directly from how deliveries are actually routed. Depends on D-21. | Studio / ops |
| **R-21** | **Customer care cannot answer "did my money go through?"** — the single most common support question on an M-PESA store. | M | **H** | 🟡 | **F-88: order lookup by phone number AND by M-PESA reference.** The customer will quote the M-PESA code, not an order number. **It is the primary support key in Kenya.** Plus read-only webhook history (F-89) and an idempotent STK re-trigger (F-90). | Studio |
| **R-22** | **The M-PESA refund is presented as a one-click operation** in the admin, when it is actually a manual B2C reversal. Ops promises a refund they cannot deliver in one click. | M | M | 🟡 | **F-91: refunds are presented as a task with a state, never as a button that implies completion.** Records who did it and when. | Studio |
| **R-23** | **The checkout visually hands off to a payment vendor** at the moment of highest trust, and the premium positioning collapses. | M | **H** | 🟡 | **P-08.** Stripe Payment Element embedded and themed. No redirect to a vendor-branded page. **Acceptance test: screenshot the checkout — is it >60% cream, in Fraunces and DM Sans?** | Studio |
| **R-24** | **Small-batch stock-outs create dead ends.** Fermentation means running out is *normal*, but a bare "Out of stock" is a lost customer. | **H** | M | 🟡 | Design the honest state: *"Next batch bottles on {date}"* is far more on-brand than a dead end, and it is *true*. Requires a batch calendar (D-28, D-29, F-98). Plus notify-me (F-31). | Client / studio |
| **R-25** | **Scope creep from the Strategy document.** It is a 12-day launch sprint doc from *before* the Brand Book, and it contains taglines, a quiz-like persona funnel, and photography direction (pour shots, condensation spray) that the Brand Book **explicitly bans**. | M | M | 🟡 | **The Brand Book takes precedence — this is stated in the brief.** All ten conflicts are catalogued in Discovery §0.2. The Strategy doc is retained for its market research (pricing bands, channels, personas) and **discarded for its creative direction.** | Studio |

### ⚪ Low exposure

| ID | Risk | L | I | Mitigation |
|---|---|---|---|---|
| **R-26** | Search is built and nobody uses it (the range is 3–6 SKUs). | M | L | **Recommend omitting at launch (D-48).** |
| **R-27** | Three variable fonts (Fraunces, DM Sans, JetBrains Mono) inflate the payload. | M | L | JetBrains Mono is confined to the spec register (order IDs, batch numbers) and **never appears above the fold** — so it loads lazily. |
| **R-28** | The Brand Book names JetBrains Mono in the type hierarchy but declares "two faces, one voice" in the same section. | L | L | Retained — the Brand Book explicitly specifies it for spec contexts. Its use is confined to the spec register. Noted rather than resolved. |

---

## Part B — Assumptions

These are working assumptions. **Each one, if wrong, changes the build.** Each is flagged for client confirmation.

| ID | Assumption | If wrong | Confirm by |
|---|---|---|---|
| **A-01** | The Brand Book v1.1 (May 2026) is the **latest** version and supersedes the Strategy document (April 2026). | The whole visual system is built on a superseded document. | Client sign-off |
| **A-02** | The primary market is **Nairobi**, with delivery limited to (or focused on) the city. | The delivery-zone model, the fulfilment view, and the entire logistics assumption change. | D-24 |
| **A-03** | **M-PESA is the primary payment rail** and card is secondary. | The checkout hierarchy inverts. | D-31 |
| **A-04** | The primary device is a **mid-range Android on an inconsistent connection**, not a desktop. | The authoring baseline (360px) and the performance budget change. | Analytics, if any exist |
| **A-05** | The customer base is **Kenyan and English-speaking**. No localisation, no multi-currency at launch. | i18n becomes in scope. | Client |
| **A-06** | The range is **small (3–6 SKUs)** and will remain so at launch. | The no-filter, no-search IA fails. | D-01 |
| **A-07** | **Guest checkout is acceptable** — an account is never forced. | If accounts are mandatory, conversion drops materially on a first-time mobile purchase. | Client |
| **A-08** | The **admin portal is in scope** and must be usable by a non-developer. | If the client is content with a developer making catalogue changes, a large amount of scope disappears. | Client |
| **A-09** | The **backend will be built by someone else, later.** The port/adapter architecture exists for this reason. | If the backend is never built, the mocks become production — which they are not designed to be. | Client |
| **A-10** | The four usable photographs (Grape Ginger, Pineapple, Pineapple Ginger, Passion) are **brand-approved**. Passion is *not* in the Brand Book but is visually consistent with the approved anchors. | Passion may need reshooting. | Brand owner |
| **A-11** | The `1 Litre` bottles shown in **all** photography are the current retail format, despite the Brand Book packaging spec saying 500ml. | The entire photo library shows the wrong product. | **D-02 — this is a serious one.** |
| **A-12** | The client can supply **named farms and regions** (D-49). The Brand Book's own voice template (*"Ginger from Meru"*) implies this information exists. | The provenance block — a P0 PDP element and the brand's stated trust mechanism — cannot be built. | D-49 |
| **A-13** | The client has, or can obtain, **ingredients and nutritional data** (D-05). | **A PDP cannot legally ship without it.** | D-05 |
| **A-14** | Fonts are **self-hostable**. Fraunces and DM Sans are SIL OFL; JetBrains Mono is OFL. | No issue expected — all three are OFL. | Verified ✅ |
| **A-15** | The trading entity is **Kenyan-registered**. | If it is registered elsewhere, R-05 (Stripe/KES) may resolve itself. | D-35 |

---

## Summary

| | Count |
|---|---|
| 🔴 Critical risks | **6** |
| 🟠 High risks | 8 |
| 🟡 Medium risks | 11 |
| ⚪ Low risks | 3 |
| **Total risks** | **28** |
| Assumptions requiring confirmation | **15** |

**The six critical risks are not engineering problems.** Five of them (R-01, R-03, R-04, R-05, R-06) are things the studio cannot solve alone — they require a decision or an asset from the client. The sixth (R-02) is a process the studio must build *into the product*, because process alone will fail.
