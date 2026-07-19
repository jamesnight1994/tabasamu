# Changelog — Tabasamu Sips Ecommerce

All notable changes to this project are recorded here.
Format: [Keep a Changelog](https://keepachangelog.com/). Versioning: phase-based.

---

## [Phase 11] — 2026-07-15 — Logo Brand Remediation

**Type:** Controlled brand remediation. **No redesign, no colour or content changes.** 449/449 tests, production build clean, `npm run verify` green. Full detail: `docs/logo-remediation/LOGO-REMEDIATION.md`.

### What changed
- **Replaced every reconstructed / generated / typed logo with the approved artwork** supplied in `Logos tabasamu.zip`. The Phase 2 note was accurate: the previously-shipped wordmark was a re-cut of Fraunces Medium pending designer sign-off. Approved artwork is now supplied and in use.
- **Approved production assets** added under `public/brand/approved/`: `tabasamu-full-logo.png` (cap mark + "Tabasamu" + "SIPS"), `tabasamu-monogram.svg` (coloured `#C05A2C`), `tabasamu-monogram-white.svg` (fully reversed). Verbatim sources retained in `public/brand/_reference/`. Full-logo PNG trimmed to a uniform margin and losslessly optimised; SVGs scoured (colour/viewBox/paths unchanged).
- **`Logo` component rewritten** — variants `full` / `monogram`, tone `light` / `dark`, corrected intrinsic aspect ratios, a deliberate clear-space **wrapper** (not baked-in padding), enforced minimum sizes, and correct alt/aria. Removed the `wordmark` variant and the `ground` prop; removed the "requires sign-off / reconstructed" comments.
- **Removed three live-text logos** (auth, account, admin) — a logo is never typed text. Auth/account now use the approved full logo; admin uses the approved coloured monogram + a plain "Admin" label.
- **Icons & metadata** regenerated from the approved monogram: favicon (16/32/48), apple-touch, manifest PNG set + `maskable-512`. Organization JSON-LD logo → approved full logo. The `og-default.png` social card was **rebuilt preserving its design**, sourcing the mark from the approved full logo. On dark surfaces the **white monogram** is used — no reversed full lockup was fabricated.
- **Brand lint extended** (`scripts/check-brand.mjs`) to fail the build on obsolete-asset references, unsupported logo variant/tone, CSS filters / `object-fit:cover` / rotation-skew on logo assets, a full logo on a dark tone, and missing approved assets.
- **Removed** the seven obsolete reconstructed assets (0 code references; now 404).

### Verification
Lint, type-check, contrast, brand lint, 449/449 unit tests, and the production build all pass. Live-server sweep: every approved asset `200`, both obsolete assets `404`. Visual QA at 320–1920px in `docs/logo-remediation/`.



**Type:** Handover. **No application source changed; no feature added.** 449/449 tests, 51-route build, all 7 gates green — Phase 9 baseline reproduced exactly. Full detail: doc 70.

### What changed
- **Consolidated the scattered handover knowledge** (55 docs + code comments) into a coherent package without regenerating existing docs. The `src/ports` directory remains the authoritative backend contract; the new docs reference and extract from source rather than duplicating it.
- **New documents (56–70)** — START-HERE for the backend developer (56), consolidated system architecture (57), a **data dictionary extracted from the domain types** (58), an API specification (59) with a validated machine-readable **`docs/openapi.yaml`** (OpenAPI 3.1, 61 operations, 20 tag groups), consolidated M-PESA (60) and Stripe/card (61) guides with sandbox/production checklists, an admin guide + permission matrix (62), a content & placeholder register (63), an operations & deployment runbook (64), and the final QC set — QA (65), security (66), accessibility (67), known issues (68), handover checklist (69), and this phase's report (70).
- **Packaged** the final source ZIP and a flat docs bundle.

### Honesty held
Nothing is claimed operational that is not connected: the http adapter still throws `NotImplemented`, payments remain blocked on D-31/32/35, and every regulated/commercial gap stays a registered placeholder (doc 63) tied to a decision (doc 08). One stale summary comment (D-13/D-50 marked "blocked" while the fields are correctly answered) was **logged as K-16**, not silently edited, consistent with the do-not-touch-working-code discipline of a packaging phase.

### Changelog backfill
This phase also backfilled the missing **Phase 7** and **Phase 9** entries below from their implementation reports (docs 43, 55), so the changelog is complete through handover.

---

## [Phase 9] — 2026-07-15 — QA, Security, Performance & Release Readiness

**Type:** Release-readiness. **No feature added.** 449/449 tests (+6). 54/54 routes verified live; all 7 gates green; production build clean. Full detail: doc 55.

- **Security hardening (3 findings fixed + locked with tests):** added the full security-header set + CSP (default-deny, first-party-scoped) + production-only HSTS in `next.config.ts`; suppressed `X-Powered-By`; centralised JSON-LD breakout escaping so a future dev cannot reintroduce the hole via the "other" emission path.
- **Empirical verification** of the served build: live header probe, 54-route sweep (all 200; unknown → 404), served-HTML checks (one H1 per shipping page, noindex on private routes, escaped JSON-LD, awaiting-markers rendering).
- **Release document set** produced (docs 49–55): QA report, bug register, security review, browser/device/a11y matrices, performance report, release checklist + rollback outline, implementation report.
- **Stated plainly as NOT verified** (needs a browser/deployment/backend): rendered axe + screen-reader passes, rendered responsive/cross-browser passes, field Core Web Vitals, Gate G2.

---

## [Phase 7] — 2026-07-15 — Admin Back Office, RBAC, Audit & Reporting

**Type:** Feature. Admin surface + authorisation model. Full detail: doc 43.

- **Role-based access control** — 8 roles (super_admin, store_manager, order_manager, inventory_manager, content_editor, customer_care, marketing, finance_analyst) with a fail-closed permission matrix generated from `src/domain/admin/rbac.ts` (doc 38). The UI gate is nav/action visibility; the backend re-checks every permission independently.
- **Admin routes** — products, inventory, orders, customers, delivery, payments, promotions, subscriptions, content, reports, audit, staff, settings.
- **Audit** — append-only `AuditEvent` catalogue (doc 40) with reversibility tags; every mutation is audited. **Stock movements** are recorded, never silently overwritten.
- **Reporting** schema (doc 41). The "money bar" withholds refunds/payment mutations from operational roles; feature-flag and staff management are super_admin-only.

---

## [Phase 8] — 2026-07-15 — Content Completion, SEO, Analytics, Accessibility & Trust

**Type:** Discoverability, measurement, inclusive use, and trust. 443/443 tests (+48). 54/54 routes (+14 pages incl. robots/sitemap/manifest). All six gates green. **No analytics vendor and no backend connected** — consent model, event spec, and honest content only. [NN-04]

### The through-line

The site is now findable, measurable, inclusive, and trustworthy — without inventing a single fact. Every gap that depends on a client decision renders as a visible "awaiting confirmation" panel and is registered, rather than filled with a plausible guess. Structured data is *withheld* where its inputs are incomplete, never faked.

### The regression this phase found and closed

**The footer linked to 12 pages that did not exist** — every legal/trust link (`/privacy`, `/terms`, `/delivery-and-returns`, `/contact`, `/faqs`, `/stockists`, `/wholesale`, `/corporate`, `/cookie-preferences`, `/accessibility`) plus `/our-story`, `/ingredients` was a 404, and `/build-a-box`, `/subscriptions`, `/journal` pointed nowhere. All are now real pages (or repointed to real routes), and a filesystem test asserts every footer link resolves so this cannot silently return.

### §1 — Content audit

Scanned all source for the brief's forbidden vocabulary, urgency, and medical claims. Existing copy was already clean (the only matches were the ban-list itself, in comments). New trust/legal/info copy lives in `src/content/{trust,faqs,story}.ts` so `check-brand.mjs` and the tests scan it exactly like the homepage. Provenance honesty (D-50: rooibos is not Kenyan-grown) is enforced on the new copy too.

### §2 — SEO

Added `robots.ts` (production allows + disallows private paths; non-prod walls off entirely), `sitemap.ts` (public routes + real product slugs only), `manifest.ts`, `WebSite` + `BreadcrumbList` JSON-LD, and a `SeoBreadcrumbs` component that renders the visible trail and its schema from one source. Generated a real `apple-touch-icon.png` and `og-default.png` from the brand marks (the root metadata referenced files that did not exist). Search-friendly URLs and canonical hygiene (no trailing slashes, defaults omitted) were already in place from Phase 3.

### ⚠️ Structured data is withheld, not faked

`productJsonLd` stays `null` until a price exists (D-14, unchanged). **FAQ schema emits only confirmed answers** — the 6 health/storage/pricing/delivery questions render on the page with an "awaiting confirmation" marker and are *excluded* from `FAQPage` JSON-LD (D-46), because Google requires a complete, visible, factual answer. Breadcrumb schema needs ≥2 crumbs; Article schema needs a real date and invents no author. Verified in the built HTML: FAQ schema contains 3 questions, zero blocked ones leaked.

### §3 — Local search

Organisation schema still carries no address/phone/email (D-47, not supplied). Nairobi is stated as fact where true (footer, story). No spam location pages were created.

### §4 — Analytics: consent-aware, PII-free

Full typed event union covering every event in the brief. Two gates on `track()`: the environment flag AND opt-in consent — **default is deny** (Kenya DPA 2019, D-43). Consent model, provider, banner (reject as prominent as accept — no dark pattern), and a durable Cookie Preferences page. No PII or money in any payload.

### §5 — Accessibility (WCAG 2.2 AA)

Consent banner and new pages follow the established baseline: one H1 per page, real landmarks, `aria-current` breadcrumbs, 44px targets, visible focus, no colour-only meaning. `noindex` enforced on account/cart/checkout/admin/auth via a client `<NoIndex>` component (those layouts are client components and can't export metadata) plus the robots disallow.

### §6 — Trust

All trust surfaces now reachable and real: contact, delivery/returns, privacy, terms, cookie preferences, accessibility, FAQs, stockists, wholesale, corporate. Each names its outstanding decisions on-page and in the new Legal-Content Requirements Register.

### ⚠️ Not browser-verified

Playwright's browser remains egress-blocked in the sandbox (carried from Phases 5–7). Rendering was verified via the production build output and served HTML (heading hierarchy, schema, noindex, awaiting markers all confirmed); a full axe/screen-reader pass on the new pages is a pre-launch task.

### Added

- **SEO routes:** `src/app/{robots,sitemap,manifest}.ts`
- **SEO libs:** `src/lib/seo/routes.ts` (public route registry), `src/lib/seo/structured-data.ts` (breadcrumb/FAQ/article/website builders, all withholding)
- **SEO components:** `src/components/seo/{StructuredData,NoIndex}.tsx`
- **Analytics:** `src/lib/analytics/consent.ts`, `src/components/analytics/{ConsentProvider,CookiePreferences}.tsx`; consent gate added to `src/lib/analytics/index.ts`
- **Content:** `src/content/{trust,faqs,story}.ts`
- **Trust component:** `src/components/trust/TrustPageView.tsx`
- **12 pages:** contact, delivery-and-returns, privacy, terms, stockists, wholesale, corporate, accessibility, faqs, cookie-preferences, our-story, ingredients
- **Assets:** `public/brand/apple-touch-icon.png`, `public/brand/og-default.png`
- **Tests:** `tests/unit/phase8.test.ts` (48)
- **Docs:** `44`–`47` (content audit; SEO & schema; analytics spec; accessibility, remediation & legal-content register), `48` (this phase's report)

### Changed

- `src/app/layout.tsx` — added WebSite JSON-LD
- `src/app/(storefront)/layout.tsx` — wrapped in `ConsentProvider`
- `src/components/layout/Footer.tsx` — repointed 3 dead links to real routes; exported `FOOTER_COLUMNS` for the integrity test
- `src/lib/config/env.ts` — added test-only `resetClientEnv()`
- private layouts/pages (`account`, `auth`, `admin`, `cart`, `checkout`) — `<NoIndex />`

### Still blocked (unchanged — surfaced honestly, never invented)

D-05 (ingredients/nutrition), D-10 (stockists), D-11/12 (wholesale/corporate), D-14 (price), D-21/22/23/24 (delivery), D-36/37 (returns/refunds), D-43 (ODPC), D-46 (FAQ health answers), D-47 (contact details), D-49 (farms), D-52 (fermentation days).

---


**Type:** Staff admin console. 395/395 tests. 40/40 routes (14 admin). All six gates green. **No admin backend connected** — architecture, contracts, and mocks only. [NN-04]

### The through-line

An operations console where every action is gated by role and recorded in an audit trail, and which refuses — structurally — to move money from the browser or show a number that depends on an unanswered decision.

### What this phase completed

Most of the admin domain/ports/mock already existed (RBAC, audit, promotions, stock, reporting; 16-service contract; 4 of 14 screens). Phase 7 finished the console: **10 new screens** (Orders, Products, Payments, Customers, Subscriptions, Delivery, Content, Reports, Audit, Settings), **14 route files**, both providers wired in the layout, and demo data so it's explorable.

### ⚠️ RBAC is fail-closed; the UI only reflects it

Nav sections and action buttons are computed from a pure `permissionsForRole`. Null/inactive staff get nothing. The UI gate is a courtesy; the backend re-enforces every permission. Tested from domain, adapter, and rendered UI.

### ⚠️ No privileged payment call from the browser

Payments is read + queue management: reconcile flags for the server, a refund is a request the server settles. Structural — the mock has no money-moving method for a screen to call. [brief §6]

### ⚠️ Blocked values render as `Unavailable`, never faked

Revenue, lifetime value, report money columns, subscription amounts → "awaiting confirmation" (D-14, D-09). Tax off until D-16. Delivery reports zero zones (D-21/22/23).

### ⚠️ Every mutation leaves an audit event

The adapter writes audit, never the UI. Tests assert the count increments on permitted actions and that a role without `audit.view` sees nothing. The catalogue classifies each action's reversibility.

### ⚠️ A test-assumption correction

A first workflow test wrongly assumed `store_manager` lacks `settings.edit` (it doesn't — only feature flags are super_admin-only). Corrected the test, not the code; recorded in the report.

### ⚠️ Mobile layout NOT browser-verified

Carried from Phases 5–6: Playwright's browser is egress-blocked. Render + RBAC logic covered in jsdom (6 tests); whether the dense admin tables scroll cleanly at 360px is **outstanding**.

### Added

| Area | Detail |
|---|---|
| UI | `screens-b` (Orders/Payments/Customers/Subscriptions/Delivery), `screens-c` (Products/Content/Reports/Audit/Settings), 14 page files |
| Layout | both `AdminProvider` + storefront `AdapterProvider` wired |
| Mock | demo payments (incl. review-queue states) + demo customers |
| Tests | `admin-workflows` (14), `admin-render` (6) |
| Docs | `38`–`43`: permission matrix, admin API contract, audit catalogue, reporting schema, workflow test plan, Phase 7 report |

### Still blocking launch

D-09, D-14, D-16, D-21/22/23, D-35, D-46/49/50/51/52. None invented; each surfaces as a visible marker.

---

## [Phase 6] — 2026-07-15 — Authentication, Account, Orders & Subscriptions

**Type:** Customer self-service. 327/327 tests. 26/26 routes. All six gates green. **No auth, email, or subscription-billing integration is live** — architecture, contracts, and mocks only. [NN-04]

### The through-line

An account area that manages everything and pretends nothing: full self-service, while every field depending on an unanswered decision renders as an honest "awaiting confirmation".

### ⚠️ Provider-neutral auth (a gap we found and filled)

There was **no auth decision on record** — now raised as D-53–D-56. The whole area is built behind an `AuthService` port and a `Session` descriptor, so the eventual choice (bespoke / Firebase / Supabase / Auth0) is a swap, not a rewrite. **The frontend never holds a token** — only a descriptor; the credential is an httpOnly cookie the JS can't read.

### ⚠️ Enumeration resistance as a hard requirement

Sign-in, password reset, and resend-verification all refuse to reveal whether an email has an account. Wrong-password and unknown-email return the **same** error. The mock rate-limits and enforces a verification gate; three tests lock this in.

### ⚠️ Subscription management is real; billing is blocked (D-09)

Pause, resume, skip, change flavours/quantity/address/payment, cancel, reactivate — all implemented and tested. But **no method moves money**: M-PESA has no card-on-file and the billing model is undecided. Next-charge date/amount render as `Unavailable`; `reactivate` creates a NEW subscription so history stays honest.

### ⚠️ Consent is a legal record, not a boolean (D-43)

Every consent change **appends** an event; current state is derived from the log. Transactional messages can't be switched off; deletion is a request with a status, not an instant purge.

### ⚠️ The single-default address invariant

At most one default, exactly one if non-empty — enforced by pure domain functions. Removing the default promotes another. Two addresses can never both be default.

### ⚠️ The brand lint caught 11 violations

Account cards used `bg-white/40`; the Brand Book forbids pure white as a ground. Replaced with the on-palette `bg-charcoal/[0.02]`. The guardrail working as designed.

### ⚠️ Mobile layout NOT browser-verified

Carried from Phase 5: Playwright's browser can't be installed in the sandbox (egress-blocked). Journey *logic* is covered by jsdom (52 tests); pixel layout at 360px **remains outstanding**.

### Added

| Area | Detail |
|---|---|
| Domain | `identity/auth`, `identity/customer`, `subscription`, `preferences` |
| Adapters | `mock/accounts` (realistic auth/subscription/consent), 5 `http` stubs |
| UI | `(auth)` sign-in/register/reset/verify; `(account)` dashboard/orders/addresses/subscriptions/preferences; `SessionProvider`; route guard |
| Ports | `AuthService`, `CustomerService`, `AddressService`, `SubscriptionService`, `PreferencesService` |
| Docs | `33`–`37`: auth contract, account API contract, state/error handling, test matrix, Phase 6 report; register D-53–D-56 |

### Still blocking launch

D-07/08/09 (subscriptions), D-40/41/42 (notifications), D-43 (ODPC), D-53/54/55 (auth), D-56 (social login). None invented.

---

## [Phase 5] — 2026-07-15 — Cart, Checkout, Delivery & Payment Architecture

**Type:** Commerce / payment architecture. 275/275 tests. 17/17 routes. All six gates green. **No payment integration is live** — architecture and specs only. [NN-04]

### The through-line

A checkout that refuses to lie about money: it will not quote a delivery fee it does not have, will not report a payment it cannot confirm, and will not charge twice however the customer taps.

### ⚠️ `unknown` is a first-class payment state

When M-PESA's callback never arrives, the money may still have left the customer's account. Showing "failed" — the intuitive default — invites a second payment. So `unknown` is terminal, never collapsed into `failed`, offers **no retry button**, and routes to `manual_reconciliation`. This is the most important decision in the phase.

### ⚠️ The brand lint caught a real violation

The stock-reduced copy first read "We only have N left" — a scarcity cue P-07 forbids. The build failed. Rewritten to state the quantity without pressure. The guardrail working as designed.

### ⚠️ Mobile layout NOT browser-verified

Playwright's browser could not be installed in the build sandbox (egress-blocked). Flow *logic* was driven through jsdom (12 tests), but pixel layout at 360px — overflow, touch targets — **remains outstanding** and must be run in a real browser before launch. Not claimed as passed.

### Added

| Area | Detail |
|---|---|
| Domain | `order` (15-state machine), `payment/contracts`, `delivery`, `checkout`, `cart` |
| Adapters | mock M-PESA/card gateway (all 7 outcomes), idempotent checkout, `http` stub |
| UI | `CartProvider`, cart drawer + `/cart`, `/checkout`, `PaymentStatus` (3 outcomes), `AdapterProvider` |
| Product | add-to-cart now real; refuses lines with no approved price (D-14) |
| Docs | `25`–`32`: state diagrams, M-PESA spec, card spec, webhooks, endpoint contracts, env guide, test matrix, Phase 5 report |

### Key architectural decisions

- **Card ships disabled, provider-neutral** (`none|stripe|flutterwave|pesapal|dpo`) pending D-35 (can the processor settle KES?).
- **Blocked data renders `Unavailable`, never zero** — the order total is honestly unknown while no delivery zone exists (D-21/22/23).
- **Idempotency is two layers** — a synchronous ref guard (this tab) plus an idempotency key (the server); the backend needs a DB unique constraint, documented in the handover.
- **The cart is treated as hostile input** — corrupt/expired/tampered storage discards cleanly and never crashes the storefront.

### Still blocking launch

D-14 (prices), D-16 (VAT), D-21/22/23 (delivery), D-25 (free-delivery threshold), D-31/32 (M-PESA creds), D-35 (card settlement), D-36/37 (refunds), D-41 (SMS). None invented; each renders as a visible blocked marker.

---

## [Phase 4] — 2026-07-14 — Product Catalogue, Search, Filtering, Product Detail & Bundles

**Type:** Catalogue. 211/211 tests. 15/15 routes. All six gates green.

### ✅ Photography landed — R-12 is solved

Four usable frames supplied (Grape Ginger, Pineapple, Pineapple Ginger, Passion). Each carries a **distinct fruit cue in-shot**, which was the hard requirement in the Phase 3 shot list — so the six bottles are now distinguishable at 160px in greyscale, despite the labels being identical by design.

Each frame derived into **two crops**: 1800×1200 landscape (PDP, editorial) and 1200×1500 portrait (grid, mobile). The portrait is a real crop around the bottle centre, **not a squeeze** — every one visually verified for a whole, uncut label.

### ⚠️ Two asset defects, both recorded

- **Beetroot (A-05)** — label typography still ILLEGIBLE. Placeholder, by client decision. **Reshoot required.**
- **Gooseberry (A-07)** — no photograph exists. Placeholder, by client decision.
- ⚠️ **Pineapple (D-13)** — the label in the photograph reads **"GLUTEN FREE"**; every other bottle reads **"CAFFEINE FREE"**. Different regulated food claims. **Image used per client decision** (the site says Caffeine Free), but **the artwork must be corrected at the next print run.**

### ⚠️ A missing photo is NOT a merchandising decision

Beetroot and Gooseberry are now **`active` and purchasable** with an honest "photography pending" panel. In Phase 3, Gooseberry was `draft` and hidden. `status` and `hasPhoto` are separate facts — conflating them silently hid a third of the range from the shop.

### Added

| Area | Detail |
|---|---|
| **Shop** | Server-rendered, **URL-driven**. Search, sort, 4 filter groups, counts, clear-all, empty/error states, pagination, mobile drawer |
| **PDP** | Gallery, variants, quantity, subscription, delivery, stock, add-to-cart, buy-now placeholder, ingredients, nutrition, storage, FAQ, returns, related, recently-viewed, mobile sticky bar |
| **Bundles** | Preset + build-your-own, inventory-aware, live progress, sticky summary |
| **Domain** | `catalogue/query.ts` — search/filter/sort/paginate as PURE functions |
| **Models** | Collection, Media, SubscriptionOption, Bundle, BundleItem, SeoContent, StorageGuidance |
| **Ports** | `CollectionRepository`, `BundleRepository` |
| **Tests** | +58 — catalogue query (32) and bundles (23) |
| **Docs** | `22_Product_Content_Schema`, `23_SEO_Schema`, `24_Phase4_Implementation_Report` |

### ⛔ D-06 — the bundle builder REFUSES to validate against a guess

`validateBundle()` returns `unknown-requirement` rather than defaulting to six. Assuming a number would produce a builder that **looks finished** — counting to six, going green, letting a customer configure a box the business never agreed to sell, at a price nobody approved.

Everything else works: quantity controls, inventory ceilings, progress, summary. **Set `requiredBottles` and it all starts working.**

The bundle price is **not** the sum of the parts — a bundle costing exactly the sum of its parts is not a bundle.

### ⛔ Nothing invented

- **No `schema.org/Product`** — `offers` needs a price (D-14). Publishing a placeholder pushes a false commercial claim into Google Shopping **at scale**. Verified: zero `ld+json` tags in the built HTML.
- **No returns policy** — a **legal commitment**, not copy. Writing one would be drafting a contract on the client's behalf.
- **No shelf life** — a guessed shelf life is a **food-safety claim**.
- **No compare-at price**, no subscription discount ("Save 0%" is a worse lie than saying nothing), no delivery promise, no ferment duration.

### Fixed

- ⚠️ **The brand lint caught a real urgency violation in my own copy.** The bundle's stock message read *"Only 6 left"* — true, and still the vocabulary of a countdown timer (P-07). Rewritten as a flat fact: *"Passion — 6 in stock."*
- **The brand lint had a false positive**, flagging *"aids digestion"* inside a JSX comment explaining we never make that claim. `isCopyLine` didn't understand `{/* */}` blocks, whose continuation lines are unmarked prose. **Fixed the lint with a stateful block tracker — then adversarially verified it still catches real urgency and medical claims.** Fixed, not weakened.
- Two stale tests updated (G2 Gooseberry draft; content "zero photography" — which existed precisely to fail when images arrived).

### Still blocked

**D-14** price · **D-06** bundle size · **D-21/22/23** delivery · **D-35** can Stripe settle KES? · **D-31/32** M-PESA credentials · **D-09** subscription billing · **D-05** ingredients/nutrition/shelf-life · **D-52** ferment duration · **returns policy** · **Beetroot reshoot** · **Gooseberry shoot** · **Pineapple artwork correction**

---

## [Phase 3] — 2026-07-14 — Responsive Storefront, Homepage & Brand Story Experience

**Type:** Storefront. All 13 homepage sections, fully responsive, 153/153 tests passing.

### ⛔ Blocking conflict raised before any code was written

**The brief said "build the homepage using the approved product photography". NO PHOTOGRAPHY WAS SUPPLIED** — the upload contained zero image files. R-03 has now blocked two phases.

Rather than crop landscape lifestyle frames into portrait (which the brief forbids: *"do not stretch or overcrop"*, *"do not generate substitute bottles"*), the phase was built with a rigorous **image-slot contract**. Every section is production-ready; each image slot declares its exact crop, aspect, focal safe-zone, responsive `sizes`, final alt text and shot direction. Drop the files in and the homepage is finished.

### Client decisions resolved

| ID | Decision |
|---|---|
| **D-13** | **"Caffeine Free"** is the approved descriptor — now in the title, meta and hero |
| **D-50** | **Rooibos** is the base — ⚠ see below |
| — | **Small-batch / locally-crafted** positioning approved |

### ⚠ The provenance problem (D-50)

**Rooibos grows in South Africa. It is not grown in Kenya.**

The Brand Book's origin story ("Kenyan-grown hibiscus") is **not this product**, so the *"Rooted in the soil"* mantra **cannot be attached to the tea**. Writing "our Kenyan rooibos" would put a **false provenance claim on the brand's most important sentence**.

The copy therefore claims what is TRUE — **Kenyan fruit, a Nairobi kitchen, Kenyan craft** — and names the rooibos without a provenance claim. A test fails the build if anyone ever writes "Kenyan rooibos".

**⚠ Client action:** the label artwork still says both "Caffeine Free" and "Gluten Free". Correct it at the next print run.

### Added

| Area | Detail |
|---|---|
| **Homepage** | All 13 sections — announcement, hero, collection, proposition, ingredients, process, origin, subscription, social proof, wholesale, journal, newsletter, footer |
| **Copy layer** | `src/content/homepage.ts` — every customer-facing word, lintable in one place |
| **Image contract** | `src/content/image-slots.ts` — 12 slots + `SlotImage` with art-directed mobile crops |
| **Components** | `Hero`, `ProductCard`, `CollectionPreview`, `Sections`, `Newsletter`, `AnnouncementBar` |
| **Tests** | +40 content tests — voice, urgency, medical claims, tourism shorthand, false provenance, fabricated testimonials |
| **Docs** | `17_Content_Map`, `18_Image_Usage_Register` (the shot list), `19_Accessibility_Report`, `20_Performance_Baseline`, `21_Phase3_Implementation_Report`, screenshots |

### Performance — server components by default

**Only FOUR components ship JavaScript:** AnnouncementBar (dismissal), CollectionPreview (quick-add), Process (accordion), Newsletter (form). The other nine sections are **server components** and arrive as plain HTML.

**Homepage route JS: 9.57 kB → 5.67 kB (−41%).** CSS 8.2 kB gzipped. HTML 15.8 kB gzipped.

### Deliberate omissions

- **No carousel.** The brief permits one only if research shows a benefit. It does not.
- **No icon row** in the Proposition — the brief asks for *"editorial layout rather than icon clutter"*. The only ornament is a typographic numeral.
- **No fabricated testimonial.** Three empty frames: *"We would rather show you nothing than show you something we wrote ourselves."*
- **No fermentation duration** (D-52 — the two source documents disagree).
- **No delivery promise** (D-21) — the announcement strip is disabled by default.
- **No subscription savings figure** (D-09).

### Fixed

- The Gate G2 test asserted `descriptor`/`base` were still blocked. The client had just answered D-13 and D-50, so the **test** was stale, not the code. Updated to assert the new truth and the remaining blockers.
- The mantra was rendering twice on the homepage (Origin + Footer). The Brand Book says *"once per page, maximum"* — the Footer now suppresses its copy on `/`.
- Six static sections were shipping as client JS for no reason. Converted to server components.

### ⚠ Screenshots — honest note

**Chromium cannot be installed in the build sandbox.** The only renderer available (`wkhtmltoimage`, WebKit) **ignores `@layer`**, dropping every Tailwind v4 utility. Rather than ship a misleading capture, the screenshots are a **faithful re-render from the same design tokens** in plain CSS — accurate to the design, but not a pixel-capture of the React build. **The real page must be screenshotted and Lighthouse'd in a modern browser before sign-off.**

### Still blocked

**📷 PHOTOGRAPHY (R-03)** — now blocking two phases · **D-14** price · **D-21/22/23** delivery · **D-35** can Stripe settle KES? · **D-31/32** M-PESA credentials · **D-09** subscription billing model · **D-05** ingredients/nutrition · **D-49** farms · **D-52** ferment duration

---

## [Phase 2] — 2026-07-14 — Technical Architecture, Design System & Application Foundation

**Type:** Foundation. Next.js 15 + TypeScript strict + Tailwind v4. **No storefront pages built** — that is Phase 3, blocked on the photography sprint (R-03).

### Client decisions resolved

| ID | Decision |
|---|---|
| **D-01** | Six flavours: Grape Ginger, Pineapple, Pineapple Ginger, Beetroot, Passion, Gooseberry |
| **D-02** | **1 Litre.** The Brand Book's 500ml spec (§06) is superseded. |
| **D-03** | Strip colours supplied — Passion `#0B8BFF`, Beetroot `#8B2635`, Gooseberry `#4A7C59` |
| **D-04** | **Option (a)** — primary CTA charcoal/cream (12.87:1). Terracotta becomes the secondary/outline CTA. |

### Added

| Area | Detail |
|---|---|
| **Domain layer** | Pure TS. `Money` (integer minor units), `normalisePhone` (E.164/M-PESA), `calculateTotals`, three-state payment model, `Unavailable` honest-absence type |
| **Ports** | The typed backend contract — provider-agnostic (`'mpesa' \| 'card'`, **not** `'stripe'`) |
| **Adapters** | `mock` (working, simulates all three M-PESA outcomes incl. ~7% `unknown`) + `http` (throws `NotImplemented`) |
| **Design tokens** | Single source of truth + CSS projection. Audited contrast ledger. |
| **Components** | 25+ primitives — forms, overlays, commerce, layout. Live at `/catalogue`. |
| **Fonts** | Self-hosted Latin-subset variable WOFF2 — 58 KB + 36 KB + 20 KB |
| **Enforcement** | 4 CI gates that **fail the build**: boundaries, contrast, brand, secrets |
| **Tests** | 90 passing — money, phone, pricing, payment, G2 adapter swap |
| **Docs** | `13_Phase2_Implementation_Report`, `14_Design_Token_Reference`, `15_Architecture_Decision_Records`, `16_Accessibility_Baseline` |

### ⚠ Logo remediated (R-04)

**The re-uploaded `Final_Logo.svg` was unchanged and still defective.** Its wordmark was live `<text>` in **"Canela Trial"** — an *unlicensed trial font*, not the Brand Book's Fraunces Medium — and it had no monogram and no reversed variants.

Extracted the (sound) monogram; **re-cut the wordmark by outlining Fraunces Medium at −20 tracking**; generated the cream-reversed variants. **7 assets delivered — these require designer sign-off.**

Without a monogram the mobile header is unsolvable: a 120px lockup + cart + menu does not fit at 360px with 44px touch targets.

### Fixed — three real defects caught by the verification chain

- ⚠ **A foreign phone number could be coerced into a valid Kenyan MSISDN**, which would send an M-PESA STK push **to a stranger's handset**. Foreign country codes are now rejected explicitly and first. Tests broadened to cover Tanzania (+255) and Uganda (+256) — one digit from Kenya's +254.
- ⚠ **The server env schema was being pulled into the client bundle.** Split into a `server-only` module, so a client import is now a build error rather than a future credential leak.
- **A component was importing an adapter** (`Price.tsx` → `adapters/mock/fixtures`), which would have broken at Gate G2. Moved to the domain.

### Deliberately NOT done

- **No tax logic** — `tax` is `Unavailable`, not `zero()`. "VAT: KES 0.00" would be an invented claim (D-16).
- **No delivery zones** — `MOCK_ZONES` is empty. Inventing "Westlands · KES 200" would invent a delivery promise (D-21).
- **No `schema.org/Product`** — `offers` needs a price; a placeholder published to Google is a false commercial claim (D-14).
- **No product descriptor in any title or meta** — "Caffeine Free" vs "Gluten Free" are different regulated claims and the artwork disagrees with itself (D-13).

### Still blocked

**D-05** ingredients/nutrition (regulated) · **D-13** descriptor · **D-14** price · **D-21/22/23** delivery · **D-35** can Stripe settle KES? · **D-50** rooibos or hibiscus? · **D-52** ferment duration

**R-03 — photography is now the critical path.** Four usable frames exist. Beetroot's label is illegible (must be reshot); **Gooseberry has no photograph at all** and ships as `draft`, excluded from the storefront.

---

## [Phase 1] — 2026-07-13 — Discovery, Benchmarking, Requirements & Information Architecture

**Type:** Specification. **No code written. No production UI implemented.** As instructed.

### Added

| File | Description |
|---|---|
| `docs/01_Phase1_Discovery_Report.md` | Inspection summary, brand implementation matrix, competitive research, requirements, conclusions |
| `docs/02_Competitive_Benchmark_Matrix.md` | 15 references (8 ecommerce, 7 non-ecommerce) + adoption traceability + explicit anti-patterns |
| `docs/03_Product_Requirements_Document.md` | Scope, non-negotiables, platform/performance budget, architecture, full commerce requirements |
| `docs/04_User_Journey_Map.md` | 11 user groups: tasks, frustrations, success criteria, surfaces |
| `docs/05_Site_Map.md` | Complete route table — public, transactional, account, legal, admin |
| `docs/06_Feature_Inventory.md` | 98 features, prioritised, with blocker status |
| `docs/07_Content_Inventory.md` | Every piece of copy, imagery and data — with source, owner, status |
| `docs/08_Client_Decisions_Register.md` | **52 open decisions.** Nothing guessed. |
| `docs/09_Risks_and_Assumptions_Register.md` | 28 risks, 15 assumptions |
| `docs/10_Data_Entity_Map.md` | Domain model + the `ports/` handover contract |
| `docs/11_Phased_Implementation_Plan.md` | 9 phases + 2 gates |
| `docs/12_Backend_Handover_Requirements.md` | Endpoints, webhooks, security, env placeholders |
| `CHANGELOG.md` | This file |

### Established (binding for all future phases)

- **The Brand Book v1.1 (May 2026) is the binding authority.** Where it conflicts with the Marketing Strategy (April 2026), the Brand Book wins. **10 conflicts catalogued** (Discovery §0.2).
- **15 original design principles (P-01 … P-15)** derived from the benchmarking. No reference brand's work is copied.
- **7 hard non-negotiables (NN-01 … NN-07)**, including: pure white is never the ground; no secret in frontend code; no integration described as operational until tested; **no legal, nutritional, delivery, pricing or health claim invented.**
- **3 binding accessibility rules (AX-01 … AX-03)** following a contrast audit of the palette.
- **The port/adapter architecture**, so the backend handover is a swap, not a rewrite.

### Findings — asset defects

| ID | Finding |
|---|---|
| **A-01/A-02** | 🔴 `Final_Logo.svg` wordmark is **live text in "Canela Trial"** — an unlicensed trial font, and **not** the Brand Book's specified Fraunces Medium at –20 tracking. Will fall back to a system serif on any device. **A live licensing exposure.** |
| **A-04** | 🔴 **No monogram variant exists.** The Brand Book requires it for the 40px digital minimum and the 16×16 favicon. **Blocks the mobile header.** |
| **A-05** | 🔴 `Beetroot.jpg` label typography is **garbled and illegible.** Unusable on a PDP. |
| **A-06** | 🔴 `Pineapple_flavor.png` label reads **"Gluten Free Rooibos Kombucha"**; all others read **"Caffeine Free"**. **These are different regulated food claims.** |
| **A-07** | 🟠 **Gooseberry has no photograph at all.** |
| **A-08** | 🟠 **All five images are 16:9 landscape lifestyle frames.** No packshots, no square crops, no 4:5 portrait crops, no cut-outs, no back-labels. **A product grid, a PDP gallery, and a cart thumbnail cannot be built from these.** Usable images: **4.** Required: **~30.** |

### Findings — contradictions inside the binding document

| ID | Finding |
|---|---|
| **D-50** | 🔴 **The Brand Book's origin story says the brand ferments *"Kenyan-grown hibiscus, ginger, and turmeric"* — but the product is rooibos kombucha, and rooibos is South African, not Kenyan-grown.** The mission claims *"rooted in Kenyan soil"*. **The brand's central claim may be unsupportable as written.** |
| **D-52** | 🟠 **Fermentation period: the Brand Book says "six days in the jar"; the Strategy document says "14 days".** Specificity is the brand's stated trust mechanism — a specific number that is wrong is worse than none. |
| **D-01** | 🔴 **The Brand Book says three flavours ("Three flavours, one system"). Six exist commercially.** The catalogue cannot be modelled. |
| **D-02** | 🔴 **The Brand Book packaging spec says 500ml PET. Every photograph shows 1 Litre.** |

### Findings — commercial

| ID | Finding |
|---|---|
| **D-35** | 🔴 **Stripe may not be able to settle KES for a Kenyan-registered entity.** An alternative card rail (Flutterwave / Pesapal / DPO) may be required. **The `PaymentGateway` port is deliberately provider-agnostic so this swap is survivable — but it must be known before the adapter is written.** Surfaced now rather than in Phase 6. |
| **D-09** | 🔴 **M-PESA has no card-on-file equivalent, so subscriptions have no obvious recurring-charge mechanism.** Four candidate models, each producing a materially different data model and UX. **No subscription code will be written until the client chooses.** |
| **D-04** | 🔴 **The primary CTA currently fails WCAG AA.** Terracotta `#C05A2C` with a cream label is **4.0:1** (threshold 4.5:1). Gold on cream is **2.6:1** and fails entirely. **A brand decision, not a silent workaround.** |

### Not done (deliberately)

- **No code written.** Phase 1 is specification only, per the brief.
- **No commercial rule invented.** Where a rule was absent, it was logged (52 entries), not guessed.
- **No health, nutritional, legal, delivery or pricing claim written.** NN-05.
- **No reference brand's design copied.** Research was converted into 15 original principles.

### Gate

> **Phase 2 does not begin until:**
> 1. The **9 blocking decisions** are answered (Client Decisions Register).
> 2. The **logo is remediated** — wordmark outlined in Fraunces Medium, monogram produced, reversed variants produced.
> 3. The **photography sprint is complete** — ~30 images (Content Inventory §3.2).
>
> **53% of the feature set is currently blocked on information that has not been supplied.** This is the expected output of an honest discovery phase, not a failure of it.

---

## [Unreleased] — Phase 2: Design System & Brand Foundations

Blocked on Gate G1.

---

## Phase 9 — QA, Security Review, Performance & Release Readiness (2026-07-15)

**Result:** 449/449 tests (+6) · all seven gates green · production build clean · 54 routes verified live (all 200, unknown → 404).

### Security hardening
- **[S-1] Added a full security-header set** in `next.config.ts` (previously empty): Content-Security-Policy (default-deny, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`), X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy (camera/mic/geolocation/FLoC denied), and HSTS (production-only, 2-year + preload). Verified live via header probe.
- **[S-2] Suppressed `X-Powered-By: Next.js`** (`poweredByHeader: false`) — framework-fingerprint information disclosure. Verified absent on live response.
- **[S-3] Centralised the JSON-LD `</script>` breakout escape** in `jsonLdString()`. Previously only `<JsonLd>` escaped `<`; `layout.tsx` used a bare `JSON.stringify` for Organization/WebSite schema. All emission paths now uniformly safe by construction.

### Tests
- Added `tests/unit/phase9.test.ts` (6 assertions): JSON-LD breakout escaping (4) and security-header configuration (2). Locks the fixes against regression.

### Changed files
- `next.config.ts` — security headers + poweredByHeader (was a 7-line stub)
- `src/lib/seo/structured-data.ts` — `jsonLdString` now applies the breakout escape
- `src/components/seo/StructuredData.tsx` — dropped now-redundant local escape
- `src/app/layout.tsx` — routes both JSON-LD blocks through `jsonLdString`
- `tests/unit/phase9.test.ts` — new

### Verified, not claimed
- No browser-based axe/screen-reader pass (Playwright browser download remains egress-blocked in the sandbox, carried from Phases 5–8). Structure re-verified from served production HTML: one H1 per shipping page, noindex on /account & /admin, awaiting-confirmation markers rendering, 4 JSON-LD blocks on home. A real assistive-tech pass stays a pre-launch task.
