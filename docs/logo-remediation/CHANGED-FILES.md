# Changed Files Register

## Source modified

| File | Change |
|---|---|
| `src/components/primitives/Logo.tsx` | Rewritten. Variants `full`/`monogram`, tone `light`/`dark`, approved assets, corrected aspect ratios, clear-space wrapper, correct alt/aria. Obsolete comments removed. |
| `src/components/layout/Header.tsx` | Full logo 150px (`md`+) / monogram 40px (mobile), new API + `clearSpace`. Stale R-04 comment updated. |
| `src/components/layout/Footer.tsx` | Full logo 170px, new API + `clearSpace` 18%. |
| `src/app/(auth)/layout.tsx` | Replaced live-text wordmark with approved full logo + `aria-label` home link. |
| `src/app/(account)/layout.tsx` | Replaced live-text wordmark with approved full logo + `aria-label` home link. |
| `src/app/(admin)/layout.tsx` | Replaced live-text "Tabasamu Admin" with approved coloured monogram (28px) + plain "Admin" label. Added `Logo` import. |
| `src/app/(storefront)/catalogue/page.tsx` | Logo spec rewritten to approved system (full + monogram light; white monogram dark). Removed `wordmark`/`ground` usage and the "requires sign-off" note. |
| `src/app/manifest.ts` | Icons → approved monogram SVG + `icon-192/512` + `maskable-512`. Comment updated. |
| `src/lib/seo/index.ts` | Root icons → approved monogram + `favicon.ico` (16/32/48) + approved apple-touch; Organization JSON-LD logo → approved full logo. |
| `scripts/check-brand.mjs` | Added LOGO ruleset (obsolete-asset refs, unsupported variant/tone, filters/object-fit/rotation on logos, full-on-dark, required-assets-exist). Refined NN-01 to ignore `-white.svg` asset names + `note=` props. |
| `src/app/favicon.ico` | Replaced with monogram-derived multi-size ico. |

## Assets added (`public/brand/approved/`)

`tabasamu-full-logo.png`, `tabasamu-monogram.svg`, `tabasamu-monogram-white.svg`,
`favicon.ico`, `apple-touch-icon.png`, `icon-16.png`, `icon-32.png`,
`icon-48.png`, `icon-180.png`, `icon-192.png`, `icon-512.png`, `maskable-512.png`,
`og-default.png`

## Assets added (`public/brand/_reference/`)

Verbatim approved sources, retained for provenance and future re-export:
`Tabsamu logo.png`, `tabasamu logo monogram.svg`,
`tabasamu logo monogram - white.svg`, `tabasamu logo monogram.jpg`

## Assets replaced in place (referenced by existing code paths)

- `public/brand/apple-touch-icon.png` → monogram-derived
- `public/brand/og-default.png` → rebuilt card, approved full logo

## Assets removed (obsolete reconstructed; 0 code references)

`lockup-primary.svg`, `lockup-cream.svg`, `monogram-terracotta.svg`,
`monogram-cream.svg`, `monogram-forest.svg`, `wordmark-forest.svg`,
`wordmark-cream.svg`

## Docs added (`docs/logo-remediation/`)

`LOGO-REMEDIATION.md`, `LOGO-USAGE-AUDIT.md`, `ASSET-MAPPING.md`,
`CHANGED-FILES.md`, `RESPONSIVE-SPACING.md`, `VISUAL-QA.md`, `TEST-REPORT.md`,
`HANDOVER.md`, `REMAINING-ISSUES.md`, and `screenshots/`.

## Filename-change note

The approved sources use inconsistent casing (`Tabsamu logo.png`) and spaces.
Production copies are renamed to safe, hyphenated names
(`tabasamu-full-logo.png`, `tabasamu-monogram.svg`,
`tabasamu-monogram-white.svg`). Originals are preserved verbatim in `_reference/`.
