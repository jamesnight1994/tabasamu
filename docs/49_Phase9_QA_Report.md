# 49 · Phase 9 QA Report

**Date:** 2026-07-15
**Build under test:** the Phase 8 release candidate, re-verified from a clean `npm ci`.
**Verdict:** release-ready as a **frontend** deliverable. Every flow that can be exercised without a backend passes. Everything that depends on the backend (real payment settlement, live inventory, notifications, auth) is correctly stubbed, honestly labelled, and out of scope for this frontend sign-off (Gate G2).

---

## 1. Method

QA was run empirically, not from memory:

- Clean dependency install (`npm ci`), then all seven gates from a cold checkout.
- The production build served with `next start`, and **all 54 routes probed live** for HTTP status.
- Served production HTML inspected for structural guarantees (H1 counts, robots meta, JSON-LD, awaiting-confirmation markers).
- The mock-adapter flow suite (which models the real user journeys end-to-end) executed in full.

## 2. Gate results (from a clean install)

| Gate | Result |
|---|---|
| typecheck (`tsc --noEmit`) | ✅ clean |
| lint + boundaries | ✅ 0 errors (only upstream boundaries-plugin deprecation warnings) |
| lint:brand | ✅ no violations |
| lint:contrast | ✅ WCAG 2.2 AA on every permitted pair |
| lint:secrets | ✅ 57 client assets scanned, no secret in bundle |
| test | ✅ 449/449 (+6 Phase 9) |
| build | ✅ 54/54 routes, robots/sitemap/manifest emitted |

## 3. Functional QA (brief §1)

Flows are exercised by the mock-adapter suite (`adapters.g2.test.ts`, `flows.test.tsx`, `checkout.test.ts`, `account-flows.test.tsx`, `admin-workflows.test.ts`, `bundles.test.ts`) plus live route probing. The mock adapter is a faithful behavioural stand-in — the same domain code runs against it as will run against the HTTP adapter at G2.

| Flow | Result | Note |
|---|---|---|
| Browse products | ✅ | `/shop`, `/shop/[slug]` render; grid + PDP verified live (200) |
| Search | ⚪ N/A at launch | On-site search intentionally not offered (D-48); no dead search UI |
| Filter | ✅ | Facet filtering + canonical URL hygiene (default params omitted) |
| Product selection | ✅ | PDP resolves by slug; 6 flavours in catalogue |
| Variant selection | ✅ | `useVariantResolver` covered by unit tests |
| Bundle creation | ✅ | Build-your-own + fixed range; `bundles.test.ts` (23) |
| Add to cart | ✅ | `CartProvider`; add/remove/quantity |
| Edit cart | ✅ | Quantity + line removal |
| Apply coupon | ✅ | Discount application, valid/invalid paths |
| Guest checkout | ✅ | Checkout without a session |
| Signed-in checkout | ✅ | Session-attached checkout |
| M-PESA mocked checkout | ✅ | STK-push acknowledgement modelled; **outcome never decided client-side** |
| Stripe/card mocked checkout | ⛔ refused by design | Card rail disabled (D-35 — Stripe KES settlement unresolved); the mock **refuses** the card rail, asserted in test |
| Pending payment | ✅ | `unknown` is a first-class state, distinct from `failed` |
| Failed payment | ✅ | wrong_pin / cancelled_by_user / timeout paths in mock |
| Successful order | ✅ | success + success_late (late callback) both modelled |
| Account creation | ✅ | Registration → UNVERIFIED → cannot sign in until verified |
| Order history | ✅ | `/account/orders`, order detail |
| Reorder | ✅ | Covered in account flows |
| Subscription management | ✅ | pause → resume → cancel → reactivate arc tested |
| Admin product creation | ✅ | Admin screens + adapter |
| Inventory adjustment | ✅ | Stock-movement domain + admin UI |
| Order fulfilment | ✅ | Admin order workflow |
| Refund UI | ✅ | Present in admin (UI only; settlement is backend) |
| Content publishing | ✅ | Admin content screen |

**Payment trust boundary (the highest-risk area) — verified:** the mock proves an M-PESA acknowledgement yields only a `providerRef`, never a settled state; an `unknown` payment **never** self-settles to `failed`; and the card rail is refused while D-35 is open. These are the exact bugs that ship unpaid orders, and they are guarded by executable tests.

## 4. Responsive QA (brief §2)

**Live server + static analysis. No browser-driven pixel pass was possible** — the Playwright browser download is egress-blocked in this sandbox (carried from Phases 5–8), and this is not claimed as done.

What **was** verified:

- **Horizontal overflow:** source scanned for fixed-pixel widths. The only wide fixed widths (`min-w-[560px]`, `w-[1400px]`) are in **admin** screens and are wrapped in `overflow-x-auto` — an internal desktop tool where horizontal scroll on a data table is acceptable. Storefront tables (contrast ledger) use `overflow-x-auto` + `min-w` inside the scroll container, so the page never overflows the viewport.
- **Viewport meta:** `width=device-width, initial-scale=1`, and crucially **no `maximumScale`/`userScalable=false`** — pinch-zoom is preserved (WCAG 1.4.4).
- **Touch targets:** a `--touch-min` (44px) token is used across interactive primitives (14 usages); breadcrumb links carry `min-h-[--touch-min]`.
- **Art-directed imagery:** product images ship a separate 4:5 portrait crop for mobile via `<picture>` + `media`, not an over-cropped squeeze of the wide file — the brand rule that the label must stay intact is preserved on small screens.

| Width | Class | Static assessment |
|---|---|---|
| 320px | small Android | Layouts authored 360-first; single-column, full-width CTA. No fixed storefront widths > viewport. |
| 360px | Android | Primary mobile target; design system built to it. |
| 390px | iPhone | Within mobile range. |
| 430px | large mobile | Within mobile range. |
| Tablet portrait/landscape | `md` breakpoint | Grid switches at `md:`; verified in source. |
| 1024–1920px | laptop→desktop | `--container-wide` max-width caps line length; centred. |

**Recommended pre-launch:** a real device/emulator pass at 320/360/390 to confirm no visual overflow in dynamic states (long product names, error banners, cart with many lines). Static analysis found no structural cause for overflow, but a rendered pass is the honest completion of this item.

## 5. Browser QA (brief §3)

**Not executable in-sandbox** (no browser). The stack (Next.js 15 / React 19) targets modern evergreen browsers. The code uses no non-baseline APIs without guards — e.g. `crypto.randomUUID` is feature-detected in `newIdempotencyKey`, and `localStorage` access is wrapped and degrades to deny/empty (tested for Safari private mode). See the **Browser Matrix** (doc 52) for the intended support statement and the specific compatibility guards found in code. A real cross-browser pass (BrowserStack/Playwright) is a pre-launch task and is not claimed as done.

## 6. What QA could not cover (honest boundary)

- Real M-PESA / card settlement, live inventory, real notifications, real auth — **no backend exists** (Gate G2).
- Browser-rendered accessibility (axe) and screen-reader passes — no browser in sandbox.
- Real-network performance metrics (LCP/INP field data) — needs a deployed URL.

None of these is marked as passed anywhere in the Phase 9 outputs.
