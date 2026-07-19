# Tabasamu Sips — Logo Remediation

**Date:** 2026-07-15
**Scope:** Replace every reconstructed / generated / typed logo with the approved
brand artwork supplied in `Logos tabasamu.zip`. No redesign, no colour changes,
no content changes beyond the logo system and its supporting metadata.

This document is the master report. The supporting deliverables are:

- `LOGO-USAGE-AUDIT.md` — the pre-edit audit table (Step 1)
- `ASSET-MAPPING.md` — approved-file → usage mapping + before/after table
- `CHANGED-FILES.md` — the changed-files register
- `RESPONSIVE-SPACING.md` — spacing / clear-space specification
- `VISUAL-QA.md` — visual QA report (screenshots in `./screenshots/`)
- `TEST-REPORT.md` — lint / typecheck / test / build results
- `HANDOVER.md` — developer handover note
- `REMAINING-ISSUES.md` — anything outside scope or left open

---

## Inspection completed

**Files inspected**

- `src/components/primitives/Logo.tsx` (central logo component)
- `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`
- `src/app/(auth)/layout.tsx`, `src/app/(account)/layout.tsx`, `src/app/(admin)/layout.tsx`
- `src/app/(storefront)/catalogue/page.tsx` (component style-guide)
- `src/app/manifest.ts`, `src/lib/seo/index.ts`
- `src/app/favicon.ico`
- `public/brand/*` (all reconstructed assets, favicon, apple-touch, OG card)
- `scripts/check-brand.mjs` (brand CI lint)
- The full `src` tree and `tests/` (grep sweep for `Logo`, `lockup`, `monogram`,
  `wordmark`, `brand/`, and typed "Tabasamu Sips" used as a mark)

**Existing logo system found**

- A single `Logo` component with three variants (`lockup`, `monogram`,
  `wordmark`) and four "grounds" (`cream`, `terracotta`, `forest`, `charcoal`),
  pointing at six **reconstructed** SVGs in `/public/brand/`.
- The component's own comments stated the wordmark had been **re-cut by outlining
  Fraunces Medium** because the supplied artwork was unusable, and that the assets
  **required designer sign-off** (never granted).
- Favicon, `apple-touch-icon.png`, and the `og-default.png` social card were all
  derived from the reconstructed mark.
- **Three layouts typed the brand name as live text** and used it as the logo /
  home link: auth (`Tabasamu Sips`), account (`Tabasamu Sips`), admin
  (`Tabasamu Admin`) — a live-text logo recreation.

**Problems found**

1. Production shipped a **reconstructed wordmark** in an unapproved font instead
   of approved artwork.
2. The `lockup` asset's real aspect ratio (~1.96:1) did not match the component's
   `ASPECT.lockup` constant (0.843), a latent distortion risk.
3. Three surfaces used **live-text logos** (banned: a logo is never typed text).
4. Icons/OG were built from the reconstructed mark.
5. The brand CI lint did **not** guard logo usage at all.

---

## Approved asset mapping

| Approved source (verbatim, in `_reference/`) | Production file (in `approved/`) | Role |
|---|---|---|
| `Tabsamu logo.png` (1152×320, RGBA) | `tabasamu-full-logo.png` (1075×218, trimmed + lossless-optimised) | **Full logo** — cap mark + "Tabasamu" (forest) + "SIPS" (terracotta). Light/cream fields only. |
| `tabasamu logo monogram.svg` (#C05A2C) | `tabasamu-monogram.svg` (cleaned, colour + viewBox preserved) | **Coloured monogram** — light/cream fields. |
| `tabasamu logo monogram - white.svg` (#FFFFFF, fully reversed) | `tabasamu-monogram-white.svg` (cleaned) | **White monogram** — approved dark surfaces only. |
| `tabasamu logo monogram.jpg` (1039², RGB, no transparency) | *(reference only — not used in production)* | **Fallback** where SVG is impossible. SVG is preferred everywhere. |

**No approved reversed full lockup exists.** On dark surfaces the system uses the
**white monogram**, never a recoloured full logo. This is enforced in code and in
the brand lint.

Derived icon set (from the approved **monogram**, on the cream field, with the
monogram's built-in safe-zone padding): `favicon.ico` (16/32/48),
`apple-touch-icon.png` (180), `icon-16/32/48/180/192/512.png`,
`maskable-512.png`. The `og-default.png` social card was **rebuilt preserving its
composed design** (cream field + mantra in Fraunces forest) but sourcing the mark
from the approved full logo.

---

## Replacements completed

| Surface | Before | After |
|---|---|---|
| **Header (desktop/tablet)** | reconstructed `lockup`, 132px | approved **full logo**, 150px, on cream band |
| **Header (mobile)** | reconstructed `monogram`, 40px | approved **coloured monogram**, 40px, on cream band |
| **Mobile nav** | (drawer, text only — unchanged) | unchanged |
| **Footer** | reconstructed `lockup`, 140px | approved **full logo**, 170px |
| **Admin sidebar / mobile header** | typed "Tabasamu Admin" (live Fraunces) | approved **coloured monogram** (28px) + plain "Admin" label |
| **Auth layout** | typed "Tabasamu Sips" (live Fraunces) | approved **full logo**, 150px, on cream |
| **Account layout** | typed "Tabasamu Sips" (live Fraunces) | approved **full logo**, 140px, on cream |
| **Checkout / cart** | (uses storefront Header) | inherits approved header |
| **Catalogue style-guide** | all 3 reconstructed variants + 4 grounds | approved full + monogram (light) and white monogram (dark) |
| **Favicon** | reconstructed-derived `.ico` | monogram-derived `.ico` (16/32/48) |
| **Apple touch icon** | reconstructed-derived | monogram-derived, cream field |
| **Manifest icons** | reconstructed monogram SVG only | approved monogram SVG + PNG set + maskable-512 |
| **Structured-data logo** | `/brand/lockup-primary.svg` | `/brand/approved/tabasamu-full-logo.png` |
| **OG / Twitter image** | reconstructed-derived card | rebuilt card, approved full logo, design preserved |

---

## Spacing corrections

See `RESPONSIVE-SPACING.md` for the full table. Summary:

- **Header padding:** `24px` (mobile) → `32px` (`md`+) horizontal, unchanged.
- **Header full-logo width:** 150px (was 132px), clear-space wrapper 12%.
- **Header mobile monogram:** 40px, clear-space wrapper 10%, inside a ≥44px link.
- **Footer full-logo width:** 170px, clear-space wrapper 18%.
- **Interactive touch areas:** all logo home-links keep ≥44×44px; clear-space is a
  separate wrapper, never confused with the touch target or the artwork.
- Clear-space is applied on a **wrapper**, derived from the rendered logo's larger
  dimension (Brand Book ~20–25%), and is **not** baked into the artwork.

---

## Validation

| Check | Command | Result |
|---|---|---|
| Lint | `npx eslint` | **PASS** (only pre-existing `boundaries` plugin deprecation warnings) |
| Type-check | `npx tsc --noEmit` | **PASS** |
| Contrast | `node scripts/check-contrast.mjs` | **PASS** |
| Brand lint | `node scripts/check-brand.mjs` | **PASS** (incl. new logo rules) |
| Unit tests | `npx vitest run` | **PASS** — 449/449 across 15 files |
| Production build | `npx next build` | **PASS** — all routes compiled |
| Asset sweep | live server | all approved assets `200`; obsolete assets `404` |
| Visual QA | Playwright, 9 breakpoints | **PASS** — see `VISUAL-QA.md` |

One overflow the QA harness flagged at 320px is a **pre-existing** dev image-slot
placeholder (`border-dashed` / `spec-mono`), unrelated to the logo. The header and
logo fit at 320px (`headerRight === 320`). Logged in `REMAINING-ISSUES.md`.

---

## Files delivered

- Updated source project + production ZIP.
- Documentation set in `docs/logo-remediation/`.
- Screenshots in `docs/logo-remediation/screenshots/`.
- Updated `CHANGELOG.md` and `README.md`.
