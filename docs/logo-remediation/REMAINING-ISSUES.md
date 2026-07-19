# Remaining Issues Register

Everything in the brief's scope (logo replacement, spacing, icons, metadata,
lint, docs, build, visual QA) is complete. The items below are either out of
scope or pre-existing, and are logged for transparency.

## 1. 320px page-body horizontal overflow (pre-existing, NOT logo-related)

- **What:** At a 320px viewport the homepage document is 328px wide (8px
  overflow). The overflowing elements are dev **image-slot placeholder** boxes
  (`border-dashed`, `spec-mono` label) in the page body.
- **Not the logo:** the header/logo fit exactly (`headerRight === 320`). The
  overflow reproduces independently of the logo change.
- **Recommendation:** constrain the image-slot placeholder to `max-width:100%` /
  reduce its intrinsic min-width. Owned by the content/placeholder system, not the
  brand layer.

## 2. e2e browser download blocked in the build sandbox

- **What:** `npm run test:e2e` needs the project's pinned Playwright browser
  revision, which could not be downloaded here. The same flows were verified
  against the production server with a locally available Chromium.
- **Recommendation:** run `npm run test:e2e` in CI where the browser is present.
  No code change required.

## 3. Favicon internal padding is generous

- **What:** the approved monogram SVG carries ~18% internal safe-zone padding, so
  at 16px the cap mark reads slightly small. This is a deliberate trade-off: it
  guarantees Android maskable / iOS masks never clip the mark.
- **If a punchier 16px favicon is wanted later:** export a **separately-cropped**
  16px monogram with tighter padding, keeping the maskable version padded. Do not
  crop the shared monogram SVG (it would affect the maskable safe-zone).

## 4. `tabasamu logo monogram.jpg` unused

- **By design.** The JPG has no transparency and is lower fidelity than the SVG.
  It is retained in `_reference/` only as a fallback per the brief. No production
  surface needs it.

## Not applicable (searched, none exist)

Email/notification templates, printable documents, documentation screenshots
embedded in the app, and any logo baked into product photography — none present,
so nothing to remediate there.
