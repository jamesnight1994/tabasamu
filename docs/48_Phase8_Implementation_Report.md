# 48 · Phase 8 Implementation Report — Content, SEO, Analytics, Accessibility & Trust

**Date:** 2026-07-15
**Result:** 443/443 tests (+48) · 54/54 routes (+14) · all six gates green · production build clean.
**Scope:** the content, discoverability, measurement, inclusive-use and trust layer. **No analytics vendor and no backend are connected** — a consent model, an event specification, honest content, and structured data that withholds itself where inputs are missing. [NN-04]

---

## 1. The one-sentence summary

Phase 8 made the site findable, measurable, inclusive and trustworthy **without inventing a single fact** — every gap that depends on a client decision renders as a visible "awaiting confirmation" panel and is registered, and structured data is *withheld* rather than faked wherever its inputs are incomplete.

## 2. What this phase found

The inspection surfaced one significant regression and three infrastructure gaps:

- **The footer linked to 12 pages that did not exist.** Every legal/trust link was a 404, plus three dead feature links. This was the largest trust hole on the site.
- **No `robots`, `sitemap` or `manifest`** — and the root metadata referenced an `apple-touch-icon.png` and `og-default.png` that were never created.
- **Analytics was defined but not consent-gated** and had no cookie mechanism.
- **Private routes were indexable.**

The existing content discipline was already strong: the homepage copy passed the forbidden-vocabulary and provenance audits with only the ban-list itself matching.

## 3. What was built

**SEO.** `robots.ts` (prod allow + private disallow; non-prod walled off), `sitemap.ts` (public routes + real product slugs), `manifest.ts`, `WebSite` + `BreadcrumbList` JSON-LD, a `SeoBreadcrumbs` component rendering visible trail and schema from one source, and real `apple-touch-icon`/`og-default` images generated from the brand marks.

**Structured-data withholding.** New builders for FAQ, breadcrumb, article and website — each returns `null` when incomplete. FAQ schema emits only client-confirmed answers; the 6 health/storage/pricing/delivery questions render on the page but are excluded from schema (D-46). Verified in built HTML: 3 questions in schema, zero blocked ones leaked.

**Analytics.** The full typed event union from the brief, a consent model (deny-by-default, DPA-aware), a `track()` gated on environment *and* consent, a consent banner (no dark pattern) and a durable Cookie Preferences page.

**Trust content.** 12 real pages, copy in scannable content modules, each naming its outstanding decisions on-page. `noindex` on account/cart/checkout/admin/auth.

## 4. The decisions that shaped the build

### 4.1 Withhold, don't fake — extended to a whole content layer
The Phase 4 rule (`productJsonLd` returns null until a price exists) is now the governing pattern for FAQ, breadcrumb and article schema, and for every trust page's blocked facts. A machine-readable claim republished at scale is the worst place for a guess.

### 4.2 Consent is deny-by-default, in one place
Two gates on `track()`, both required, checked centrally. A malformed stored consent value re-prompts rather than silently assuming yes. Reject is as prominent as accept.

### 4.3 The footer can never 404 again
Every footer link now resolves to a real page, and a filesystem test asserts it — so a future edit that adds a dead link fails the suite.

### 4.4 Honest gaps are a UI state, not a TODO
The "awaiting confirmation" panel is a real, styled, on-brand component that names the blocking decision. A customer and the client can see exactly what is outstanding, and doc 47 registers all 20 items.

## 5. Verification

| Gate | Result |
|---|---|
| typecheck | ✅ clean |
| lint + boundaries | ✅ 0 errors |
| lint:brand | ✅ no violations (scans new content) |
| lint:contrast | ✅ WCAG 2.2 AA |
| lint:secrets | ✅ no secret in client bundle (88 assets scanned) |
| test | ✅ 443/443 (+48 Phase 8) |
| build | ✅ 54/54 routes; robots.txt, sitemap.xml, manifest.webmanifest emitted |

Rendering spot-checks on the served production build confirmed: one H1 per page, breadcrumb schema and `aria-current`, `noindex` on cart/checkout/admin, FAQ schema limited to confirmed answers, and "awaiting confirmation" markers on every blocked block.

## 6. What is NOT verified

**No browser-based accessibility pass.** Playwright's browser is egress-blocked in this sandbox (carried from Phases 5–7). Structure was verified from built HTML; a full axe run and an NVDA/VoiceOver pass on the new pages remain a pre-launch task. Not claimed as passed. [NN-04]

## 7. Still blocked (surfaced honestly, never invented)

D-05, D-10, D-11, D-12, D-14, D-16, D-21/22/23/24, D-36/37, D-42, D-43, D-44, D-46, D-47, D-49, D-52 — each appears as a named, visible gap on the relevant page and in doc 47.

## 8. For the backend developer

Analytics: choose a vendor, implement an `AnalyticsSink`, attach the calls at the points listed in doc 46 §4, and set `NEXT_PUBLIC_ANALYTICS_ENABLED=true` — nothing fires without consent regardless. SEO: when a price lands (D-14), `productJsonLd()` begins emitting; when the Journal gains dated posts, `articleJsonLd()` does. Trust: as each decision in doc 47 is answered, replace the awaiting block with confirmed copy in the relevant `src/content/*` module — the page needs no structural change.
