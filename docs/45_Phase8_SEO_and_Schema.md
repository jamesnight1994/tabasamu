# 45 · Phase 8 SEO Implementation & Schema Documentation

**Date:** 2026-07-15
Supersedes and extends doc 23 (SEO Schema, Phase 4).

---

## 1. What ships

| Requirement (brief §2) | Where | Status |
|---|---|---|
| Page titles | `rootMetadata()` template + per-page `pageMeta()` | ✅ |
| Meta descriptions | `pageMeta({ description })`, linted as copy | ✅ |
| Canonicals | `alternates.canonical` in `pageMeta` | ✅ |
| Open Graph | `openGraph` in `pageMeta` + real `og-default.png` | ✅ |
| Social previews | `twitter: summary_large_image` | ✅ |
| Robots directives | `src/app/robots.ts` | ✅ |
| Sitemap | `src/app/sitemap.ts` → `/sitemap.xml` | ✅ |
| Product structured data | `productJsonLd()` | ⛔ withheld until D-14 |
| Organisation structured data | `organizationJsonLd()` in root layout | ✅ |
| Breadcrumb structured data | `breadcrumbJsonLd()` via `SeoBreadcrumbs` | ✅ |
| Article structured data | `articleJsonLd()` | ✅ builder (Journal pending) |
| FAQ structured data (where eligible) | `faqJsonLd()` | ✅ confirmed answers only |
| Heading hierarchy | one H1/page, ordered H2s | ✅ verified in built HTML |
| Product image alt text | Phase 4 register (doc 18) | ✅ |
| Search-friendly URLs | Phase 3 filter URLs | ✅ |
| Redirect strategy | see §5 | documented |
| 404 handling | `not-found.tsx` (in-voice) | ✅ |
| No-index (account/cart/checkout/admin) | `<NoIndex>` + robots disallow | ✅ |

## 2. robots.ts

Two policies by environment. **Non-production** (`development`/`staging`) returns `Disallow: /` — a staging URL indexed by Google outranks nothing useful and confuses customers. **Production** allows `/` and disallows `/account`, `/cart`, `/checkout`, `/admin`, and the auth paths. Both emit the sitemap URL. Verified: the sandbox build (development env) correctly produced `Disallow: /`.

## 3. sitemap.ts

Enumerates only the public route registry (`src/lib/seo/routes.ts`) plus real product slugs from the catalogue domain. Private surfaces are absent by construction — they are not in the registry. `lastModified` is the build time (honest; per-entity timestamps need the backend). A test asserts every trust page has a matching public route and that no route carries a trailing slash.

## 4. Structured data — the withholding principle

The rule from doc 23 now governs every builder in `src/lib/seo/structured-data.ts`:

> **Never emit schema for content that does not exist.** Structured data is a claim made to a machine and republished at scale to an audience that cannot see the caveat next to it on the page.

| Builder | Emits when | Returns `null` when |
|---|---|---|
| `organizationJsonLd` | always (name/url/logo only) | — (no address/phone — D-47) |
| `websiteJsonLd` | always | — (no SearchAction — search not offered, D-48) |
| `productJsonLd` | never yet | **always, until D-14 (price)** |
| `breadcrumbJsonLd` | ≥2 crumbs | <2 crumbs |
| `faqJsonLd` | ≥1 confirmed answer | all answers awaiting (D-46) |
| `articleJsonLd` | a real `datePublished` exists | no date; author never invented |

### FAQ eligibility (D-46)

Google requires an FAQ answer to be complete, visible, and non-promotional. The 6 questions touching health, storage, pricing or delivery render on the page with an "awaiting confirmation" marker and are **excluded** from the `FAQPage` schema. Verified in the built HTML: schema contains exactly the 3 answerable questions (what kombucha is, caffeine, sediment); zero blocked questions leaked.

## 5. Redirect & canonical strategy

- **Canonical hygiene (Phase 3, retained):** default query params are omitted, so `/shop` and `/shop?sort=featured&page=1` are one URL, not two. Bad query strings are clamped, not crashed.
- **Redirects:** none are hard-coded in the frontend. When the backend and final IA land, 301s (e.g. legacy `/faq` → `/faqs`, or a renamed collection) belong in `next.config.ts` `redirects()` or at the edge. The register of intended redirects is empty at launch because no URL has yet changed; this is the honest state, not an omission.

## 6. Assets created

`apple-touch-icon.png` (180×180) and `og-default.png` (1200×630) were generated from the brand lockup on the cream canvas — the root metadata referenced both, and they did not previously exist. No PNG icon set beyond these is referenced; a maskable set is a pre-launch nicety, not invented here.
