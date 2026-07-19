# Performance Baseline — Phase 3 Homepage

**Constraint (P-10):** the target is a **mid-range Android on an inconsistent Nairobi mobile connection**, not a MacBook on fibre. Every number below is judged against that.

---

## Measured — production build, 14 July 2026

| Metric | Value |
|---|---|
| **Homepage route JS** | **5.67 kB** |
| First Load JS (incl. shared framework) | 156 kB |
| Shared chunks (all routes) | 102 kB |
| CSS (gzipped) | **8.2 kB** |
| Fonts (WOFF2, Latin-subset, variable) | 115.9 kB total — **94 kB preloaded** |
| Homepage HTML (gzipped) | **15.8 kB** |
| Prerendering | **Static** — all routes |

---

## ⚠ The architectural decision that matters most

**Only four things on this page ship JavaScript:**

| Component | Why it must be client |
|---|---|
| `AnnouncementBar` | dismissal state + `localStorage` |
| `CollectionPreview` | quick-add feedback |
| `Process` | the Radix accordion (progressive disclosure) |
| `Newsletter` | form state |

**Everything else is a server component** — the hero, the proposition, the ingredients, the origin story, the subscription explainer, the social-proof frame, wholesale, the journal. They arrive as **plain HTML**.

**Result: the homepage route JS fell from 9.57 kB → 5.67 kB (−41%)** when the static sections were moved off the client.

Shipping eleven sections of static prose as React would be bytes the customer pays for and CPU they wait on, for zero interactivity.

---

## Font strategy

Three faces, self-hosted, Latin-subset, variable WOFF2:

| Font | Size | Preloaded? |
|---|---|---|
| Fraunces (display) | 58 kB | ✓ — above the fold |
| DM Sans (interface) | 36 kB | ✓ — above the fold |
| JetBrains Mono (spec register) | 20 kB | **✗ — never above the fold** (R-27) |

`font-display: swap` on all three. Text is readable before the fonts land.

---

## Images — the elephant

**Zero images ship today, because none exist (R-03).** The performance picture will change materially when they do, and the contract is already built to protect it:

- Every slot declares a responsive `sizes` attribute — a 360px phone never downloads a 2400px file.
- The hero declares a **separate mobile file** at a different aspect, not a crop.
- The hero is `priority` (it is the LCP element). Everything else lazy-loads.
- `next/image` will serve AVIF/WebP.
- Every slot has a fixed aspect ratio, so **CLS stays at zero** while images load.

**⚠ Budget for the photographer:** the hero should land under **150 kB** at 2400px wide after AVIF encoding; product cards under **60 kB** each at 1200×1500.

---

## ⚠ Not yet measured — and why

| Metric | Status |
|---|---|
| **Lighthouse / Core Web Vitals** | **Chromium cannot be installed in this sandbox** (`playwright install` exits 100). Not a decision — an environment limit. |
| **LCP / CLS / INP on real hardware** | Requires a real browser *and* the real images. Must run before launch. |
| **Throttled 3G timing** | Same. |

**Run before sign-off:** Lighthouse on a throttled Moto G-class profile, with the real photography in place.
