# Test Report

All commands run from the project root after `npm ci`.

| Stage | Command | Result |
|---|---|---|
| Dependency install | `npm ci` | OK |
| ESLint | `npx eslint` | **PASS** — 0 errors. Only pre-existing `eslint-plugin-boundaries` v5→v7 deprecation **warnings**, unrelated to this change. |
| Type-check | `npx tsc --noEmit` | **PASS** — 0 errors. |
| Contrast lint | `node scripts/check-contrast.mjs` | **PASS** — all permitted pairs meet WCAG 2.2 AA; guardrails correctly forbid gold/terracotta as text. |
| Brand lint | `node scripts/check-brand.mjs` | **PASS** — including the **new LOGO rules**. |
| Unit tests | `npx vitest run` | **PASS** — **449/449** across 15 files. |
| Production build | `npx next build` | **PASS** — all routes compiled (storefront, auth, account, admin, `manifest.webmanifest`, `sitemap.xml`, `robots.txt`). |
| Combined | `npm run verify` | **PASS** (lint + typecheck + contrast + brand + tests). |

## Regression checks (functional)

Verified via the passing suites and the live-server QA pass:

- Header navigation renders and links resolve. ✅
- Mobile menu drawer opens (text-only nav, unchanged). ✅
- Logo home links point to `/` (storefront/auth/account) and `/admin` (admin). ✅
- Cart control renders with zero-item and multi-item states. ✅
- Account navigation guarded correctly (redirects to auth when signed out). ✅
- Admin navigation renders permission-filtered with the new monogram masthead
  (`admin-render.test.tsx` passes). ✅
- No hydration errors in the build/serve logs. ✅
- No broken image requests / 404 logo assets (network sweep). ✅
- No layout shift from logos (fixed intrinsic width/height). ✅

## Notes

- No test snapshots referenced the old asset paths, so there was **no snapshot
  churn** to update. The brand lint additions are covered by running the script
  itself as part of `verify`.
- e2e (`playwright test`) uses the project's own Playwright browser revision,
  which could not be downloaded in this sandbox; the equivalent flows were
  exercised directly against the production server with a locally available
  Chromium (see `VISUAL-QA.md`). Run `npm run test:e2e` in CI where the browser
  is available.
