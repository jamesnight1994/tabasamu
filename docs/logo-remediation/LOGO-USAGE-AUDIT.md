# Logo Usage Audit (pre-edit — Step 1)

Every place the logo appeared or was referenced, found via a full-tree grep for
`<Logo`, `Logo(`, `logo`, `lockup`, `wordmark`, `monogram`, `brand/`, favicons,
manifest icons, OG images, structured data, and typed "Tabasamu Sips" used as a
mark. Completed **before** any code was edited.

| # | File path | Component / page | Current asset / method | BG | Rendered size | Intended replacement | Spacing correction | Responsive | Mandatory | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `src/components/primitives/Logo.tsx` | Central `Logo` | 6 reconstructed SVGs, 3 variants × grounds | n/a | caller-set | Refactor to `full`+`monogram`, `light`/`dark`, approved assets | Add clear-space wrapper | drives all | **Yes** | Comments admit reconstruction + "requires sign-off" |
| 2 | `src/components/layout/Header.tsx` | Site header (desktop) | `<Logo variant="lockup" width={132}>` | cream band | 132px | approved full logo, 150px | wrapper 12% | full ≥ md | **Yes** | — |
| 3 | `src/components/layout/Header.tsx` | Site header (mobile) | `<Logo variant="monogram" width={40}>` | cream band | 40px | approved coloured monogram | wrapper 10%, ≥44px link | monogram < md | **Yes** | — |
| 4 | `src/components/layout/Footer.tsx` | Footer | `<Logo variant="lockup" width={140}>` | cream | 140px | approved full logo, 170px | wrapper 18% | stacks on mobile | **Yes** | — |
| 5 | `src/app/(auth)/layout.tsx` | Auth header | typed `Tabasamu Sips` (Fraunces, forest) | cream | text | approved full logo, 150px | wrapper 12% | one size | **Yes** | Live-text logo — banned |
| 6 | `src/app/(account)/layout.tsx` | Account header | typed `Tabasamu Sips` (Fraunces, forest) | cream | text | approved full logo, 140px | wrapper 10% | one size | **Yes** | Live-text logo — banned |
| 7 | `src/app/(admin)/layout.tsx` | Admin sidebar / mobile bar | typed `Tabasamu Admin` (Fraunces, forest) | light (charcoal/3%) | text | approved coloured monogram 28px + plain "Admin" | gap-2, ≥44px link | sidebar + mobile bar | **Yes** | Live-text logo — banned; "Admin" kept as functional label |
| 8 | `src/app/(admin)/layout.tsx` | Admin "sign-in required" screen | typed heading `Staff sign-in required` | light | text | *unchanged* | — | — | No | Functional heading, not a logo |
| 9 | `src/app/(storefront)/catalogue/page.tsx` | Component style-guide | all 3 reconstructed variants + 4 grounds | mixed | 48–180px | approved full+monogram (light), white monogram (dark) | per component | dev-only page | **Yes** | Not shipped to prod (`notFound()` in production) |
| 10 | `src/app/manifest.ts` | PWA manifest | `/brand/monogram-terracotta.svg` | — | icon | approved monogram SVG + PNG set + maskable | — | — | **Yes** | Add real PNG sizes + maskable |
| 11 | `src/lib/seo/index.ts` (icons) | Root metadata icons | `/brand/monogram-terracotta.svg`, `/favicon.ico`, apple-touch | — | icon | approved monogram + approved apple-touch | — | — | **Yes** | — |
| 12 | `src/lib/seo/index.ts` (OG default) | `pageMeta`/root OG | `/brand/og-default.png` | cream card | 1200×630 | rebuilt card, approved full logo | preserve design | — | **Yes** | Composed card — update mark only |
| 13 | `src/lib/seo/index.ts` (JSON-LD) | Organization structured data | `/brand/lockup-primary.svg` | — | — | `/brand/approved/tabasamu-full-logo.png` | — | — | **Yes** | — |
| 14 | `src/app/favicon.ico` | Browser favicon | reconstructed-derived 256px ico | — | 16–48 | monogram-derived ico | internal padding | — | **Yes** | Recognisable at 16px |
| 15 | `public/brand/apple-touch-icon.png` | Apple touch icon (file) | reconstructed-derived 180px | cream | 180 | monogram-derived | safe-zone padding | — | **Yes** | — |
| 16 | `public/brand/og-default.png` | OG card (file) | reconstructed-derived | cream | 1200×630 | rebuilt, approved mark | preserve design | — | **Yes** | — |
| 17 | `public/brand/lockup-primary.svg` + 6 others | Reconstructed assets | generated SVGs | — | — | **remove** after migration | — | — | **Yes** | 0 references after edit |
| 18 | `scripts/check-brand.mjs` | Brand CI lint | no logo rules | — | — | add logo validation | — | — | **Yes** | Step 11 |

**No logo usage found** in: loading/error/not-found pages, email/notification
templates (none exist), printable documents (none), or product photography.
No tests reference logo asset paths (no snapshot churn expected).
