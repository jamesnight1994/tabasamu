# 53 · Phase 9 Performance Report

**Date:** 2026-07-15
**Method:** production build analysis + served-response inspection. **No field Core Web Vitals** (LCP/INP) were measured — that needs a deployed URL and real devices, and is not claimed.

---

## 1. Bundle profile (from the production build)

| Metric | Value | Assessment |
|---|---|---|
| First Load JS shared by all | **218 kB** | Reasonable for a Next 15 / React 19 app with Radix primitives |
| Largest shared chunk | 68.4 kB | Framework + React |
| Typical storefront route First Load | 280–286 kB | Acceptable; most is shared and cached across routes |
| Route-specific JS (trust pages) | **0 B** | Static content pages ship no route JS |
| CSS (shared) | 11.5 kB | Small; Tailwind v4, purged |

Static/SSG/dynamic split is sensible: trust and content pages are **static** (`○`), product pages are **SSG** (`●`) with `generateStaticParams`, `/shop` is dynamic (`ƒ`) for filtering.

## 2. Already-good practices found (retained, not re-done)

- **Fonts:** self-hosted woff2 (Fraunces, DM Sans) with `<link rel="preload">` and `crossOrigin` — no render-blocking third-party font fetch, no FOIT from a slow CDN. `themeColor` set.
- **Images:** `next/image` everywhere; **art-directed** mobile crops via `<picture>` (a separate 4:5 file, not an over-cropped wide file), so a phone doesn't download a 1800px-wide hero to show a strip of it.
- **Layout stability:** every image slot declares explicit `width`/`height` and an `aspect` class, and the awaiting-asset panel occupies the **same** aspect box — so a late-landing image causes **no CLS**.
- **Caching:** static routes serve with long `s-maxage` (`Cache-Control: s-maxage=31536000` observed on `/`), `ETag`, and `x-nextjs-cache: HIT` on prerendered pages.
- **No third-party scripts** at launch — analytics is specified but unwired, so there is zero third-party JS weight and zero third-party blocking today.

## 3. Image quality guard (brief §4 — explicit requirement)

The brief forbids degrading images to the point labels become unreadable. **No image re-compression was done in Phase 9.** The supplied product frames are used as-is; the label is the product, and `next/image` resizes responsively without destroying label legibility. The one legibility problem (Beetroot, A-05) is a **generation artefact in the source asset**, not a compression choice, and is handled by showing a placeholder — not by shipping an unreadable label.

## 4. Recommendations for the deployed environment (not doable in-sandbox)

| Item | Action | Owner |
|---|---|---|
| Field LCP/INP | Measure on the real domain with real devices; target LCP < 2.5s, INP < 200ms on 4G | infra/pre-launch |
| Image format | Confirm `next/image` serves AVIF/WebP via the deployment's image optimiser (or a CDN loader) | infra |
| Edge caching | Put the static/SSG output behind a CDN close to Nairobi users | infra |
| Slow-network | The app already degrades gracefully offline (cart survives, mocks are local); confirm on throttled 3G at the URL | pre-launch |
| Third-party budget | When analytics/payment SDKs land, keep them `async`/deferred and add their origins to CSP | G2 |

## 5. Honest status

Bundle sizes and build-time characteristics are **measured and good**. Runtime field metrics are **not measured** and not claimed — they require a deployment. Nothing here overstates performance.
