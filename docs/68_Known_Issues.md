# 68 · Known Issues

The honest list of everything that is imperfect, incomplete, or deferred at
handover. Nothing here is hidden. Severity: 🔴 blocks launch · 🟠 must fix before
GA · 🟡 minor / tidy-up · ⚪ informational.

---

## Launch-blocking (not frontend defects — external dependencies)

These are the reason the site cannot go live yet. They are client/backend owned.

| # | Sev | Item | Owner | Ref |
|---|---|---|---|---|
| K-01 | 🔴 | **Backend not connected** — runs on mock adapters. Gate G2 not yet run. | Backend dev | doc 56 §3 |
| K-02 | 🔴 | **M-PESA credentials missing** (shortcode + Daraja app). No live payment possible. | Client | D-31/32, doc 60 |
| K-03 | 🔴 | **Card rail undecided** — Stripe may not settle KES. Card disabled. | Client/finance | D-35, doc 61 |
| K-04 | 🔴 | **Prices not approved** — no price displayed; product JSON-LD withheld. | Client | D-14 |
| K-05 | 🔴 | **Ingredients + nutrition missing** (regulated) — PDP cannot fully publish. | Client | D-05 |
| K-06 | 🔴 | **Auth mechanism not chosen/connected** — provider-neutral, not live. | Client/eng | D-53/54/55 |
| K-07 | 🔴 | **Notification providers missing** — no order confirmation sends (SMS is the expected KE channel). | Client | D-40/41 |
| K-08 | 🔴 | **~20 legal/delivery/pricing decisions open** — each is a visible "awaiting" panel. | Client | docs 08, 63 |

## Must fix before GA

| # | Sev | Item | Owner | Ref |
|---|---|---|---|---|
| K-09 | 🟠 | **Beetroot product photo** — supplied frame has illegible label typography; reshoot required. | Studio | doc 63 §3 (A-05) |
| K-10 | 🟠 | **Gooseberry product photo** — none exists; shoot required. | Studio | doc 63 §3 (A-07) |
| K-11 | 🟠 | **Off-palette strip colours** (Passion blue, Beetroot red) supplied but outside the Brand Book palette; need brand-owner ratification. | Brand | D-03, doc 63 §4 |
| K-12 | 🟠 | **Physical Pineapple artwork** says "Gluten Free" while the approved descriptor is "Caffeine Free" — pack and site must make the same regulated claim. | Client | D-13 |
| K-13 | 🟠 | **Rendered a11y/responsive/cross-browser/CWV passes** not run (browser egress-blocked in build env). | Launch owner | doc 67, doc 69 |
| K-14 | 🟠 | **CSP `script-src` uses `'unsafe-inline'`** — migrate to a nonce before adding any third-party script. | Backend/infra | doc 66 §2 |

## Minor / tidy-up

| # | Sev | Item | Ref |
|---|---|---|---|
| K-15 | 🟡 | **Boundary-lint deprecation warnings** — `eslint-plugin-boundaries` v6→v7 renamed `rules`→`policies` and flags legacy selectors. **Warnings only; lint passes.** Migrate config at leisure. | doc 64 §13 |
| K-16 | 🟡 | **Stale summary comment in `src/domain/catalogue/index.ts`** — the file-top comment lists D-13 and D-50 as "STILL BLOCKED", but the field-level comments and the mock fixtures correctly record both as **ANSWERED (2026-07-14)** ("Caffeine Free"; "Rooibos"). The behaviour is correct (answered); only the summary comment is out of date. Update the comment to avoid confusing a future reader. | — |
| K-17 | 🟡 | **`/catalogue` specimen page** — a non-shipping developer specimen that 404s in production; documented, not a broken flow. | doc 50 |

## Informational

| # | Sev | Item |
|---|---|---|
| K-18 | ⚪ | Subscriptions/build-a-box/search/gifting/batch-calendar/promotions/stockists are **deliberately flagged off**, each blocked on a decision (doc 63 §11). Not bugs. |
| K-19 | ⚪ | `HttpAdapters` throw `NotImplemented` by design — an honest stub, not a fake backend. This is what keeps Gate G2 meaningful. |
| K-20 | ⚪ | Brand Book §06 states 500ml packaging; the client confirmed **1L** (D-02), which supersedes it. Recorded so the discrepancy is not re-flagged. |
