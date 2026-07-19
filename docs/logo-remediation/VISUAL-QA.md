# Visual QA Report

Captured with Playwright (Chromium) against the **production** build
(`next start`, `NEXT_PUBLIC_APP_ENV=production`), except the catalogue
style-guide which is `notFound()` in production and was captured in development.
Screenshots in `./screenshots/`.

## Coverage

| Screenshot | Surface | Asset | Verdict |
|---|---|---|---|
| `home-desktop.png` | Homepage header (1440) | full logo, cream band | ✅ correct scale, aspect, clear-space, separated from nav |
| `home-mobile-360.png` | Homepage header (360) | coloured monogram | ✅ fits with Account/Cart/Menu, no collision |
| `home-mobile-320.png` | Homepage header (320) | coloured monogram | ✅ header fits (`headerRight === 320`); page-body overflow is a pre-existing placeholder, not the logo |
| `footer-desktop.png` | Footer (1440) | full logo | ✅ balanced, clear-space, not crowded by copyright |
| `footer-mobile.png` | Footer (360) | full logo | ✅ stacked with deliberate vertical gap |
| `shop.png` | Shop listing | header full logo | ✅ |
| `pdp.png` | Product detail | header full logo | ✅ |
| `checkout.png` | Checkout | header full logo | ✅ calm, does not dominate |
| `signin.png` | Auth sign-in | full logo, cream | ✅ replaces old typed wordmark |
| `account.png` | Account (guarded → auth) | full logo | ✅ |
| `admin-dashboard.png` | Admin sidebar (1440) | coloured monogram + "Admin" | ✅ replaces typed "Tabasamu Admin" |
| `admin-mobile.png` | Admin bar (390) | coloured monogram + "Admin" | ✅ no collision with nav |
| `catalogue-logo.png` | Style-guide (dev) | full + monogram (light), white monogram (dark) | ✅ white monogram on all 3 dark grounds; no reversed-full fabricated |

## Per-screenshot checklist (applied to all)

Correct asset ✅ · correct background ✅ · correct scale ✅ · aspect ratio ✅ ·
clear space ✅ · alignment ✅ · padding ✅ · margins ✅ · contrast ✅ ·
mobile fit ✅ · no visual collision ✅ · no clipping ✅ · no blurry scaling ✅ ·
no transparent-canvas imbalance ✅ (full-logo PNG re-padded to a uniform 12px
margin, so its **apparent** size matches its CSS width).

## Network / runtime checks

- **Brand-asset requests:** every `/brand/approved/*`, `/favicon.ico`,
  `/brand/apple-touch-icon.png`, `/brand/og-default.png`, `/manifest.webmanifest`
  returned **200** across all captured routes.
- **Obsolete assets:** `/brand/lockup-primary.svg`, `/brand/monogram-terracotta.svg`
  return **404** (removed) — confirming nothing still references them.
- **No `requestfailed`** events for images on any route.
- **Manifest** icons resolve to the approved monogram SVG + PNG set + maskable.
- **Horizontal overflow:** none attributable to the logo; the 320px page-body
  placeholder overflow is pre-existing (see `REMAINING-ISSUES.md`).
- **Layout shift:** logos use fixed `width`/`height` on `next/image`, so no CLS
  on load.
