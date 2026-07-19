# Accessibility Report — Phase 3 Homepage

**Target:** WCAG 2.2 Level AA.
Where a rule can be enforced mechanically, it is — and the build fails on a violation.

---

## Automated gates (all passing)

| Gate | Result |
|---|---|
| `lint:contrast` — every permitted pair, audited | ✓ PASS |
| `lint:brand` — no white ground, gold never text, motion ≤200ms | ✓ PASS |
| ESLint `jsx-a11y` (via `next/core-web-vitals`) | ✓ 0 errors |
| `tests/unit/content.test.ts` — voice, no fabrication | ✓ 153/153 |

---

## 1. Contrast — every combination used on this page

| Foreground | Ground | Ratio | Where | Result |
|---|---|---|---|---|
| charcoal | cream | **12.87:1** | body copy, headings | AAA |
| charcoal-muted | cream | **6.25:1** | standfirst, section intros | AA |
| forest | cream | **6.00:1** | links, the mantra, "in stock" | AA |
| cream | **charcoal** | **12.87:1** | **primary CTA**, quick-add | AAA |
| cream | **forest** | **6.00:1** | the Proposition band, announcement | AA |
| cream/85% | forest | ~5.1:1 | Proposition body copy | AA |
| terracotta | cream | 4.14:1 | **eyebrows only** — ≥19px, large-text AA | AA-large |
| gold | cream | 2.67:1 | **decorative rules only — NEVER text** | correctly forbidden |

**Terracotta is never used for body text.** It appears as an eyebrow (large text) and as a *border* on the secondary CTA — where the label is charcoal. The audit script asserts that terracotta and gold still *correctly fail* as body text, so the guardrail cannot go stale.

---

## 2. Colour is never the sole carrier of meaning (1.4.1)

⚠ **This is the homepage's highest-risk area (R-12).** The six labels are identical by design — colour is the only thing that distinguishes a Grape Ginger bottle from a Passion one.

| Signal | Not colour-only because… |
|---|---|
| Flavour identity | The **swatch is always paired with the flavour name** in text |
| Stock state | *"In stock"* / *"Sold out"* — **words**, not a green/red dot |
| Blocked asset | The panel carries **text** (`RESHOOT REQUIRED`), not just a red border |
| Price placeholder | The word ***"indicative"***, not just an amber pill |
| Form errors | A text cue accompanies the red |

---

## 3. Structure & landmarks

- One `<h1>` (the hero). Every section is `<section aria-labelledby>` pointing at its own `<h2>`.
- `<main id="main">`, `<header>`, `<footer>`, `<nav aria-label>`.
- The skip link is the first focusable element (2.4.1).
- `lang="en-KE"`.
- Product cards are `<article>` inside a `<ul>` — a **list** of products, announced as such.

---

## 4. Images (1.1.1)

**Every slot has real, final alt text written now** — see `18_Image_Usage_Register.md`. None says "product image".

The awaiting-asset panels are `role="img"` with `aria-label="Photography pending. {the real alt text}"` — so a screen-reader user is told what *will* be there, and that it is missing. They are not silently invisible.

---

## 5. Motion (2.3.3, P-11)

| Effect | Duration | Reduced-motion |
|---|---|---|
| Product image hover push-in (scale 1.02) | 200ms | removed (`motion-safe:` only) |
| Card border hover | 180ms | colour only — no motion |
| Accordion open/close | 180ms | removed |
| Announcement dismissal | instant | — |

**No parallax. No scroll-hijacking. No animated cursor. No entrance animations. No autoplay carousel** — there is no carousel at all.

Everything is stripped under `prefers-reduced-motion: reduce`.

---

## 6. Touch & pointer (2.5.8)

**44px minimum** on every interactive element — WCAG 2.2 AA requires only 24px. This is a phone-first store on mid-range Android.

The two-column product grid at 360px yields ~160px cards; the quick-add button is full-width within the card and comfortably exceeds 44px.

---

## 7. Forms (3.3.1, 3.3.2, 4.1.3)

The newsletter has a **real `<label>`** (not a placeholder), `aria-describedby` for the consent line, `aria-invalid` + `role="alert"` on error, and **moves focus to the confirmation** on success so the result is announced.

Quick-add uses `aria-live="polite"` — *"Added to your box"* is spoken, not merely coloured.

---

## 8. Zoom & reflow (1.4.4, 1.4.10)

`maximumScale` / `user-scalable=no` are **never set**. Layout is authored at 360px and reflows to 1440px with no horizontal scroll.

---

## ⚠ 9. Known gaps — must close before launch

| Gap | Why it is open | Owner |
|---|---|---|
| **No axe-core / Lighthouse run** | Chromium **cannot be installed in the build sandbox** (`playwright install` exits 100). This is an environment limit, not a decision. **Run axe + Lighthouse in CI on a real browser before sign-off.** | Eng |
| **No screen-reader pass** | NVDA / VoiceOver on the real page. | Eng |
| **Alt text unverified against real images** | The alt text is written; the photographs do not exist yet. It must be re-checked once they do. | Client |
| **Colour-blind simulation not run** | Directly relevant to R-12 — the six flavours must remain distinguishable in deuteranopia and in greyscale. | Design |
