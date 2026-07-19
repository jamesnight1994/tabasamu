# Recommended Phased Implementation Plan

**Nine phases.** Two of them are **gates** — points where the project stops until the client acts. They are placed deliberately, because the alternative is discovering the same problems in Phase 6, when they are ten times more expensive.

Every build phase ends with the same close-out ritual (see §Close-out, below).

---

## Phase overview

| # | Phase | Type | Depends on | Output |
|---|---|---|---|---|
| **1** | Discovery, Benchmarking, Requirements, IA | 📋 Spec | — | **This deliverable set** ✅ |
| **G1** | **CLIENT GATE — Decisions & Assets** | 🚧 **Gate** | Phase 1 | 9 blockers answered; logo remediated; photography produced |
| **2** | Design System & Brand Foundations | 🎨 Build | G1 | Tokens, type, components, Storybook |
| **3** | Static Storefront (mocked) | 🏗 Build | 2 | Home, Shop, PDP, editorial pages |
| **4** | Commerce Core (mocked) | 🏗 Build | 3 | Cart, Build-a-Box, checkout, delivery zones |
| **5** | Payments (mocked, then sandboxed) | 🏗 Build | 4 | M-PESA + card flows, all three outcome states |
| **6** | Accounts & Subscriptions | 🏗 Build | 5, **D-09** | Account, orders, subscription management |
| **7** | Admin Portal | 🏗 Build | 4 | Catalogue, fulfilment, care, content, roles |
| **G2** | **BACKEND HANDOVER** | 🚧 **Gate** | 2–7 | Ports contract verified; adapter swap tested |
| **8** | Integration & Hardening | 🏗 Build | G2 | Real backend, real payments, perf, a11y |
| **9** | Launch | 🚀 | 8 | Content freeze, sandbox→prod, monitoring |

---

## 🚧 G1 — CLIENT GATE (before any code)

> **This gate exists because 53% of the feature set is currently blocked, and three of the blockers are contradictions inside the binding brand document itself.** Building through them means building on guesses, and NN-05 forbids guessing.

### G1.1 — The nine blockers must be answered

| ID | Question | Why it is a gate |
|---|---|---|
| **D-01** | How many flavours? (3 per the Brand Book, 6 in reality) | **The catalogue cannot be modelled.** |
| **D-02** | 500ml or 1L? | The Brand Book says one; every photograph shows the other. |
| **D-03** | Strip colours for Passion / Beetroot / Gooseberry | The photographed colours are **off-palette**. Needs brand sign-off. |
| **D-04** | Primary button: type-size floor, or charcoal ground? | **The primary CTA currently fails WCAG AA.** |
| **D-05** | Ingredients + nutrition | **Regulated. A PDP cannot ship without it.** |
| **D-13** | "Caffeine Free" or "Gluten Free"? | **Different regulated food claims.** |
| **D-14** | Approved pricing | Nothing commercial can be built. |
| **D-35** | Can Stripe settle KES? | **May force a different card rail entirely.** |
| **D-50** | Rooibos or hibiscus? | **The brand's central "Kenyan soil" claim may be unsupportable.** |

### G1.2 — Asset production (runs in parallel)

| Work | Owner | Why it blocks |
|---|---|---|
| **Logo remediation** — outline the wordmark in **Fraunces Medium, –20 tracking** (the actual Brand Book spec, not the "Canela Trial" currently in the file); produce the **monogram**; produce cream-reversed variants; produce a 16×16 favicon | Designer | **Blocks the header, the mobile header, and the favicon.** Also a live font-licensing exposure. |
| **Photography sprint** — ~30 images. Packshots on cream, 1:1 and 4:5 crops, cut-outs, label macros, back-labels, process shots, a composition-(iii) hero with negative space for overlaid type. Reshoot **Beetroot** (current label is illegible). Shoot **Gooseberry** (does not exist). | Photographer | **A product grid, a PDP gallery, and a cart thumbnail cannot be built from four landscape lifestyle frames.** |

**Brief is already written, by the Brand Book itself:** *"shoot it like a quiet magazine essay about a maker's afternoon."* Natural light only. If the light is gone, end the shoot.

> **Recommendation:** G1.1 (decisions) and G1.2 (assets) run **in parallel**. The decisions are a meeting; the assets are a production sprint. Neither should wait for the other.

---

## Phase 2 — Design System & Brand Foundations

**Depends on:** G1 (D-03, D-04, and the logo).

| Deliverable | Notes |
|---|---|
| Colour tokens | 5 tokens. **Build fails on `#FFFFFF` as a ground** (NFR-04). |
| Type system | Fraunces + DM Sans preloaded; **JetBrains Mono lazy** (it never appears above the fold). Self-hosted WOFF2, Latin subset. |
| Spacing & layout | **Cream ≥60% of every viewport (P-01)** — verified by an automated screenshot test, not by eye. |
| Component library | Buttons, links, inputs, cards, nav, footer. **Links are forest green, not terracotta** (AX-01 — terracotta at body size is 4.0:1 and fails AA). |
| Logo component | Lockup + monogram + reversed. **The header is a solid cream band — never transparent over a photograph**, because the logo may not sit on an image. |
| Motion system | **≤200ms, opacity + small translate only.** No parallax. No scroll-jack. No entrance animations (P-11). |
| **Copy lint** | The Brand Book §07 banned list, extended with health-claim vocabulary. **Fails the build.** |
| **Colour adjacency lint** | Forest and terracotta may never share a border (P-12). |
| Storybook | Every component, at 360px and at 1440px. |

**Exit criteria:** every component renders correctly at **360px** (the authoring baseline). Contrast audit passes. Copy lint is live in CI.

---

## Phase 3 — Static Storefront (mocked data)

**Depends on:** Phase 2, and the photography from G1.2.

| Deliverable | Notes |
|---|---|
| Home | Editorial-first. **No carousel, no popup, no newsletter modal.** |
| Shop / flavour grid | ⚠ **The hard problem (R-12): every label is identical by design.** Discovery must work via the strip swatch + the ingredient cue in the photograph + the flavour name. **Acceptance test: can a user distinguish two flavours at 160px, in greyscale?** |
| PDP | **DOM order is binding (P-05):** what it is → where it came from → what's in it → how to buy. **Never buy-then-justify.** |
| Our Story · Ingredients · Journal · Stockists | ⛔ Blocked on D-49, D-50, D-52, D-10. |
| Wholesale · Corporate | **Enquiry flows, not cart flows.** |
| 404 / 500 | **Written in-voice. No jokes. No exclamation marks.** |

**Exit criteria:** Lighthouse Perf ≥90 on a **throttled Moto G**, not a MacBook (P-10). LCP <2.5s on Slow 4G.

---

## Phase 4 — Commerce Core (mocked)

| Deliverable | Notes |
|---|---|
| Cart | Persistent. localStorage for guests, server-side when authenticated. |
| **Build-a-Box** | ⚠ **Prototype this FIRST, at 360px, keyboard-first.** Every reference implementation of this pattern breaks on small screens and fails keyboard testing (R-09, AP-09). The persistent summary must not occlude the picker. |
| **Delivery zones on the PDP** | **P-03.** The fee must be knowable **before the cart** — this is the biggest first-time-buyer frustration in this market and the mitigation for R-08. |
| Checkout | **Styled as Tabasamu end-to-end (P-08).** Guest checkout never blocked. Separate billing/delivery addresses (the gift journey). |
| Discounts | **A coupon field and a cart line item. No banner, no timer, no badge (P-07).** |
| Domain layer | **All pricing, cart maths, delivery-fee rules, and phone normalisation live here as pure functions.** Unit-tested independently of any UI. **This is the single most important boundary in the codebase (R-13, NN-06).** |

**Exit criteria:** the domain layer has 100% unit-test coverage and **zero React imports.** Build-a-Box passes a screen-reader test at 360px.

---

## Phase 5 — Payments (mocked → sandboxed)

> **The highest-risk phase in the build.**

| Deliverable | Notes |
|---|---|
| Phone normalisation | `07…` / `+254…` / `7…` → `2547XXXXXXXX`. **In the domain layer, not in a component.** |
| **STK push, pre-explained** | The customer knows the prompt is coming **before** it fires (adopted from E-05). |
| **The pending state** | ⚠ **The single hardest technical requirement in the build (F-58, R-10).** **Server-authoritative, keyed by `CheckoutRequestID`. Must survive a page reload and a connection drop.** A customer who loses signal mid-payment must be able to reopen the site and see the true state. |
| **Three outcome routes** | `success` / `failed` / **`unknown`** — as **separate first-class routes**, not one generic error page. **`unknown` must never be collapsed into `failed`. Guessing about whether a customer's money left their account is the fastest way to destroy trust in this market.** |
| Card rail | ⛔ **D-35.** **The `PaymentGateway` port is deliberately provider-agnostic** — if Stripe cannot settle KES, swapping to Flutterwave/Pesapal/DPO must not ripple upward. |
| Webhooks | Idempotent. Signature-validated. **Append-only `WebhookEvent` log** — never mutated, never deleted. This is what lets customer care answer *"did my money go through?"* |
| Sandbox testing | Daraja sandbox. **⚠ NN-04: the integration is not described as operational until it has actually been connected and tested.** |

**Exit criteria:** Journey 1 (first-time shopper → M-PESA → pending → confirmation, on a 360px Android, **with the connection deliberately killed mid-payment**) passes. If it does not, nothing else matters.

---

## Phase 6 — Accounts & Subscriptions

**⛔ HARD-BLOCKED on D-09.**

> **M-PESA has no card-on-file equivalent.** A subscriber cannot be silently charged each cycle. The four candidate models (re-prompt each cycle / standing order / card-only / pre-paid block) produce **materially different** data models and UX. **No subscription code will be written until the client chooses (R-06).**

| Deliverable | Notes |
|---|---|
| Account, orders, addresses | |
| **Reorder** | One tap → pre-filled cart. |
| **Subscription management** | **Skip · pause · resume · swap flavour · change frequency/date/address/payment · cancel — all self-serve, no contact required.** |
| **Cancel** | ⚠ **One tap. No retention gauntlet. No "are you sure" chain. No interstitial.** This is a **brand-voice** requirement, not merely a UX one: *"We invite. We never instruct."* |

---

## Phase 7 — Admin Portal

| Deliverable | Notes |
|---|---|
| Catalogue CRUD | **Stock adjustment is ONE field.** |
| **Fulfilment view** | ⚠ **Groups by DELIVERY ZONE, not by time** (F-86, R-20) — because that is how deliveries are actually routed in Nairobi. A time-sorted order list is useless to a rider. |
| Printable run sheet | **With customer phone numbers. The rider will call.** |
| **Customer care** | **Lookup by phone AND by M-PESA reference** (F-88, R-21) — the customer will quote the M-PESA code, not an order number. **It is the primary support key.** Read-only webhook history. Idempotent STK re-trigger. |
| **Refunds** | ⚠ **Presented as a task with a state, never as a one-click button.** An M-PESA refund is a manual B2C reversal. **The UI must not pretend otherwise (R-22).** |
| Content | Draft → preview → publish. ⚠ **The copy lint blocks publishing banned vocabulary (F-95, R-19).** The editor is the highest-risk author on the project. |
| **Role isolation** | **A content editor cannot reach orders, customers, or payments.** A requirement, not a nicety. |

---

## 🚧 G2 — BACKEND HANDOVER GATE

**The acceptance test:** the **full user-flow test suite runs green against both `MockAdapters` and `HttpAdapters`, with zero changes above the adapter layer.**

If that test passes, the handover is clean. **If it fails, backend logic has leaked upward (R-13)** — and it is caught here, not in production.

| Deliverable |
|---|
| `ports/` — every interface, typed, documented, versioned |
| `12_Backend_Handover_Requirements.md` — every endpoint, payload, webhook, idempotency key, and security requirement |
| Data entity map |
| **Env-var placeholder manifest — no secret has ever entered the frontend bundle (NN-03), verified by a build-time scan** |
| The adapter-swap test, green |

---

## Phase 8 — Integration & Hardening

| Deliverable | Notes |
|---|---|
| Real backend connected | Mocks retired. |
| **Real payments, sandbox → production** | ⚠ **NN-04: nothing is described as operational until it has been connected and tested.** |
| Performance | Budget enforced in CI. **Tested on a throttled Moto G.** LCP <2.5s on Slow 4G. **If the site is slower than Jumia on Nairobi 3G, the premium positioning has failed (P-10).** |
| Accessibility | **Lighthouse A11y = 100.** Manual keyboard + screen-reader pass on: PDP, Build-a-Box, cart, checkout, **and the M-PESA pending state.** |
| Security | Secret scan. Webhook signature validation. Rate limiting. |
| Load | ⚠ Test the **M-PESA callback endpoint** under concurrency. Duplicate callbacks **must** be a no-op. |

---

## Phase 9 — Launch

| Deliverable |
|---|
| Content freeze; final copy lint on **published CMS content**, not just source |
| Sandbox → production credentials (env only) |
| Monitoring: payment success rate, **`unknown` payment rate** (the number to watch), LCP, error rate |
| Runbook for customer care: *"did my money go through?"* |
| Rollback plan |

---

## Close-out ritual — every build phase (2–8)

Per the brief, without exception:

1. Lint
2. Type check (`strict: true`, **no `any` in the domain layer**)
3. Production build
4. Test the relevant user flows
5. Check desktop **and** mobile layouts (**360px first**)
6. Document every changed file
7. Update `CHANGELOG.md`
8. Write the implementation report
9. **Package the complete project as a ZIP**

And before coding in every phase:

1. Inspect every attached file
2. Inspect the existing repository
3. Read all previous reports
4. Identify conflicts, missing information, regressions
5. Produce a concise inspection summary
6. State exactly what will change
7. **Do not begin implementation until the inspection is complete**

---

## Sequencing rationale — why the three riskiest journeys are prototyped first

Ranked by **risk**, not by frequency. Each is built early, in a throwaway prototype, before the phase that depends on it.

| # | Journey | Prototype in | Why first |
|---|---|---|---|
| **1** | **M-PESA payment on a 360px Android, with the connection killed mid-flight** | Before Phase 5 | It is the primary revenue path **and** it contains the hardest technical problem in the build. If payment resilience fails, nothing else matters. |
| **2** | **Build-a-Box at 360px, keyboard-operable** | Before Phase 4 | **Every** reference implementation of this pattern breaks on small screens and fails keyboard testing. It is the component most likely to be built badly. |
| **3** | **Product discovery when every label is identical** | Before Phase 3 | This constraint is **created by the brand system itself**. No reference brand has solved it, because no reference brand has a deliberately uniform label. **It cannot be copied. It requires an original solution.** |

---

## What this plan refuses to do

- **It will not build through the nine blockers.** Guessing a price, a nutrition panel, or a delivery fee is worse than stopping.
- **It will not proceed on the assumption that the photo library is complete.** It is not, and Phase 3 would collapse.
- **It will not write subscription code before the M-PESA recurring model is chosen.** All four candidates produce different data models.
- **It will not describe any integration as operational until it has been connected and tested (NN-04).**
