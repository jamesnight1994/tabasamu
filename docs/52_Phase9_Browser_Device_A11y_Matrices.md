# 52 · Phase 9 Browser Matrix, Device Matrix & Accessibility Verification

**Date:** 2026-07-15

---

## PART A — Browser Matrix

**Support target:** modern evergreen browsers, last two major versions. Stack is Next.js 15 / React 19, which does not target legacy engines.

| Browser | Target | In-sandbox verification | Compatibility guards found in code |
|---|---|---|---|
| Chrome (desktop) | latest 2 | ⚠ not browser-tested (no browser in sandbox) | baseline APIs only |
| Safari (desktop) | latest 2 | ⚠ not browser-tested | `localStorage` wrapped + degrades (Safari private mode tested in unit suite) |
| Firefox | latest 2 | ⚠ not browser-tested | baseline APIs only |
| Edge | latest 2 | ⚠ not browser-tested | Chromium-equivalent |
| Mobile Safari (iOS) | latest 2 | ⚠ not browser-tested | `env(safe-area-inset-*)` respected on the consent banner; pinch-zoom preserved |
| Chrome for Android | latest 2 | ⚠ not browser-tested | 360-first layout |

**Guards actually present in the code** (reduce cross-browser risk):
- `crypto.randomUUID` is **feature-detected** with a fallback (`newIdempotencyKey`).
- `localStorage` reads/writes are wrapped in try/catch and **degrade to empty/deny** (proven by "survives localStorage throwing (Safari private mode)" test).
- No `maximumScale`/`userScalable=false` — zoom works everywhere.
- Self-hosted woff2 with `preload` — no third-party font CDN dependency.

**⚠ Honest status:** a real cross-browser pass (Playwright/BrowserStack) has **not** been run and is not claimed. It is a pre-launch task. The download of the Playwright browser is egress-blocked in this sandbox (carried from Phases 5–8).

## PART B — Device / Viewport Matrix

| Viewport | Class | Structural assessment (static + live HTML) |
|---|---|---|
| 320px | small Android | Authored 360-first; single column; full-width CTA; no storefront fixed width > viewport |
| 360px | Android (primary) | Design-system baseline |
| 390px | iPhone | Within mobile range |
| 430px | large mobile | Within mobile range |
| Tablet portrait | — | `md:` grid switch verified in source |
| Tablet landscape | — | `md:`/`lg:` layouts |
| 1024px | laptop | `--container-wide` caps width |
| 1280px | desktop | centred, capped |
| 1440px | desktop | centred, capped |
| 1920px | desktop | centred, capped |

**Overflow audit:** the only fixed widths exceeding a phone viewport are in **admin** (`min-w-[560px]`, `w-[1400px]`), each inside `overflow-x-auto`; admin is an internal desktop tool. No storefront route has a structural overflow cause.

**⚠ Honest status:** a rendered pixel pass at each width has **not** been run. Static analysis found no overflow cause; a real device/emulator pass is the pre-launch completion of this item.

## PART C — Accessibility Verification

Target: **WCAG 2.2 Level AA**. Extends the Phase 2 baseline (doc 16), Phase 3 report (doc 19) and Phase 8 audit (doc 47).

### Verified this phase (from served production HTML + source)

| Item | Result |
|---|---|
| One H1 per shipping page | ✅ verified live on 15+ routes (only the non-shipping `/catalogue` specimen has 2, and it 404s in production) |
| `noindex` on private routes | ✅ `/account` & `/admin` emit `robots: noindex, nofollow` |
| Pinch-zoom preserved | ✅ no `maximumScale` in viewport |
| Colour contrast | ✅ `lint:contrast` — every permitted pair ≥ AA; terracotta/gold correctly **forbidden** as body text |
| Focus-visible ring | ✅ present in primitives, never removed |
| Touch targets | ✅ `--touch-min` (44px) token across interactive primitives |
| Awaiting-confirmation panels | ✅ carry `role="img"`/labelled text, render honestly (verified on `/privacy`) |
| Consent banner | ✅ non-modal by design (lets a user read the policy first); reject as prominent as accept (dark-pattern-free) |
| Colour-only meaning | ✅ flavour strips are name-paired, not colour-only |
| Image alternatives | ✅ real `alt` on supplied images; awaiting panels are labelled |

### NOT verified — explicitly outstanding

| Item | Why | Status |
|---|---|---|
| Automated **axe** run on rendered pages | No browser in sandbox | ⚠ pre-launch task |
| Manual **NVDA / VoiceOver** pass | No AT in sandbox | ⚠ pre-launch task |
| Reduced-motion in rendered UI | No new motion introduced, but not rendered-verified | ⚠ pre-launch |

**Not claimed as passed.** Structure is verified; a live assistive-technology pass remains the honest final step before launch.
