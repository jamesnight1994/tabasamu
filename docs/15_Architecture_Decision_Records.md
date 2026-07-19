# Architecture Decision Records — Phase 2

---

## ADR-01 — The domain layer is pure TypeScript, and this is enforced by lint

**Context.** Phase 1 (R-13/NN-06): *"All pricing, cart maths, delivery-fee rules and phone normalisation live in the domain layer as pure functions. This is the single most important boundary in the codebase."*

**Decision.** `src/domain` imports nothing but itself and `src/tokens`. No React, no Next, no `fetch`, no `window`, no adapter. Enforced by `eslint-plugin-boundaries` + `no-restricted-imports`/`no-restricted-globals`. **A violation fails the build.**

**Why enforcement, not documentation.** A boundary that lives only in a document erodes. Under deadline, someone imports an adapter into a component "just this once", and the Gate G2 handover then fails in a way that takes days to unpick.

**Verified.** This immediately caught a real violation: `Price.tsx` was importing `PLACEHOLDER_PRICES` from `adapters/mock/fixtures`. It worked, and it would have broken at G2 when the mock ceases to exist. The flag moved to the domain, where it belongs — *"has a price been approved?"* is a business fact, not a mock artefact.

---

## ADR-02 — ⚠ `unknown` is a first-class payment state and is NEVER collapsed into `failed`

**Context.** M-PESA is a push-notification rail. The customer receives an STK prompt; the site awaits a Daraja callback. **Sometimes the callback never arrives** — and the site then genuinely does not know whether the money left the customer's account.

**Decision.** Three terminal states: `succeeded`, `failed`, **`unknown`**. `isFailure('unknown')` returns **`false`**, and there is a unit test asserting it.

**Consequences.**
- Three separate payment-outcome routes, not one generic error page.
- The unknown-state copy: *"Do not pay again. If the money left your account, we will find it and confirm by SMS."*
- **No retry button on `unknown`** — a retry is precisely how a customer gets charged twice.
- Payment state is **server-authoritative**, keyed by the `CheckoutRequestID`, so it survives a page reload and a dropped connection.
- The mock gateway produces `unknown` ~7% of the time, **with no callback ever arriving.**

**Why the mock must be imperfect.** A mock that always succeeds instantly lets you ship a UI that collapses the first time it meets a real Nairobi connection. Building against all three outcomes is the only way this bug does not reach production.

---

## ADR-03 — The payment port is provider-agnostic (`'mpesa' | 'card'`, not `'stripe'`)

**Context.** ⛔ **D-35 is unresolved and is a hard dependency.** It is not established that Stripe can settle KES for a Kenyan entity.

**Decision.** `PaymentGateway` names no vendor. The provider union is `'mpesa' | 'card'`. `CARD_PROVIDER` is an env value: `none | stripe | flutterwave | pesapal | dpo`.

**Consequence.** If Stripe cannot settle KES, the card rail becomes Flutterwave/Pesapal/DPO — and that is an **adapter swap**, not a rewrite. Naming Stripe in the domain would have made a foreseeable failure catastrophic.

**Action required:** verify with Stripe **directly**, before Phase 6.

---

## ADR-04 — Blocked fields are typed `Unavailable`, never guessed (NN-05)

**Context.** Six decisions remain unanswered, including regulated food information (D-05), the product descriptor (D-13), and the price (D-14).

**Decision.** A blocked field is **not** `null`, **not** `''`, and **not** a plausible placeholder. It is an `Unavailable` carrying the **ID of the decision that blocks it**, rendered by `PendingValue` as a visible ⛔ marker.

**Consequence.** **A ⛔ marker in production is the system working.** It means a real question is open and it is now impossible to miss. The alternative — a plausible-looking guess — is invisible, and ends up in a screenshot, a stakeholder deck, or a launch.

**Applied to:**
- Every price carries an *"indicative"* marker (D-14).
- **`tax` is `Unavailable`, not `zero()`** — "VAT: KES 0.00" would be an invented claim about the trading entity's VAT registration (D-16).
- **The cart total is `Unavailable` until a delivery zone exists** — we do not show a number that will change (D-21/22).
- **`MOCK_ZONES` is empty by design.** Inventing "Westlands · KES 200" would invent a delivery promise.
- **No `schema.org/Product` is emitted** — `offers` needs a price, and a placeholder price published to Google is a false commercial claim at scale.

---

## ADR-05 — Flavour strips are quarantined to a swatch (R-15)

**Context.** Four of the six client-supplied strip colours are **outside** the five-colour Brand Book palette. Passion's `#0B8BFF` is a saturated digital blue with nothing in common with a system built from clay, soil and cream.

**Decision.** A flavour strip is a **packaging** system, not a **web** system. On the site it appears **only** as a small identifying swatch beside the flavour name. `FlavourSwatch` is the **only** component permitted to consume a strip hex; `check-brand.mjs` fails the build otherwise.

**Consequence.** The client's colour decision is honoured *and* the palette survives. The swatch is always paired with the name — colour is never the sole carrier of meaning (WCAG 1.4.1), which also mitigates R-12 (all six labels are identical by design at thumbnail size).

---

## ADR-06 — The primary button is charcoal, not terracotta (D-04a)

**Context.** Terracotta `#C05A2C` on cream `#FDF6F0` = **4.14:1**. WCAG AA requires **4.5:1** for normal text. **The brand's primary colour could not legally be the primary button.**

**Decision.** Client authorised option (a): primary CTA = charcoal/cream (**12.87:1**, AAA). Terracotta = secondary/outline CTA — a *border* needs only 3:1, and the label is charcoal.

The solid-terracotta `accent` variant is retained for large-format CTAs, and the component **force-upgrades it to `lg` at runtime**, because 4.14:1 *does* clear the 3:1 large-text threshold.

**Why runtime enforcement.** The rule is enforced in code, not left to a future designer to remember a ratio.

---

## ADR-07 — The header is a solid cream band, always

**Context.** Brand Book §02: the mark must always have *"a calm, single-tone field"* — never a busy or image ground.

**Decision.** The site header is **solid cream**. It is never transparent over a hero photograph, and it does not become so on scroll. `LogoGround` has **no `image` option** — the type system forbids it.

**Consequence.** A brand constraint decided the layout architecture, rather than the layout being drawn first and the brand bent to fit.

**Corollary — the monogram is load-bearing.** The full lockup has a 120px digital minimum. At 360px, a 120px lockup + cart control + menu control does not fit with 44px touch targets. The header therefore uses the **monogram** on mobile. The supplied logo had none — which is exactly why its absence was a Phase 1 blocker (R-04).

---

## ADR-08 — The component catalogue is a route, not Storybook

**Decision.** `/catalogue` renders every primitive **inside the real app**, with the real fonts, the real tokens, and the real CSS cascade. `noindex`, and excluded from production.

**Rationale.** A component that passes in an isolated Storybook iframe and then breaks in the app has taught us nothing. It also avoids a second build pipeline that inevitably drifts out of step.

---

## ADR-09 — Secrets are split into a `server-only` module (NN-03)

**Context.** The secret scanner fired on the first real build. The chain: `error.tsx` (client) → `logger` → `clientEnv()` → `env.ts`, which held **both** schemas in one module. The whole server-env schema was being pulled into the **client bundle**.

**Decision.** The server schema moved to `server-env.ts`, carrying `import 'server-only'`.

**Why this mattered even though nothing leaked.** It shipped only harmless field *names*. But the moment anyone writes `MPESA_PASSKEY: z.string().default('...')`, that default becomes a **live credential in a public JavaScript file**. The split makes that mistake **structurally impossible** rather than merely discouraged — and the failure is now a loud build error, not a silent leak found in production.

---

## ADR-10 — Money is an integer in minor units

**Decision.** `Money.amount` is an **integer** count of KES cents. Never a float. `MoneyError` is thrown on a non-integer.

**Rationale.** `0.1 + 0.2 !== 0.3`. A rounding drift in a cart total is not an aesthetic defect — it is a **customer dispute**, and it erodes exactly the trust this brand is built on. Rounding happens **once**, explicitly, at the point of division. Tested against a 1,000-item summation with zero drift.
