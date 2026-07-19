# Accessibility Baseline — Phase 2

**Target:** WCAG 2.2 Level AA.
Where a rule can be enforced mechanically, it is — see `scripts/check-contrast.mjs` and `scripts/check-brand.mjs`, both of which **fail the build**.

---

## 1. Colour & contrast (1.4.3, 1.4.11)

Every permitted pair is **audited in CI**, not assumed. See `docs/14_Design_Token_Reference.md` §3.

| Pair | Ratio | Result |
|---|---|---|
| Body text (charcoal/cream) | 12.87:1 | AAA |
| Secondary text | 6.25:1 | AA |
| Links, focus ring (forest) | 6.00:1 | AA |
| **Primary CTA** (cream/charcoal) | **12.87:1** | **AAA** |
| Terracotta CTA | 4.14:1 | **large text only** |
| Gold as text | 2.67:1 | **FAIL — forbidden** |

**The audit also asserts that gold and terracotta still *correctly fail* as body text.** A guardrail that silently goes stale is worse than none.

**Colour is never the sole carrier of meaning (1.4.1):**
- Form errors carry a **text cue**, not just red.
- Tab selection carries an **underline**, not just colour.
- Flavour swatches are **always paired with the flavour name.**

---

## 2. Keyboard (2.1.1, 2.4.3, 2.4.7)

- **Focus is always visible.** `:focus-visible` is never removed without replacement. On dark/terracotta grounds the ring switches to cream, where forest would lack contrast.
- **Skip link** is the first focusable element on every page (2.4.1).
- **Dialogs and drawers** trap focus, restore it on close, lock scroll, and close on `Escape` — via Radix, which supplies the parts that are easy to get wrong.
- **Tabs and accordions** implement roving tabindex and arrow-key navigation.

---

## 3. Target size (2.5.8)

**44px minimum** on every interactive element — WCAG 2.2 AA requires only 24px. This is a phone-first store on mid-range Android; the difference is a sale versus a rage-tap.

The mobile action bar respects `env(safe-area-inset-bottom)`. Without it the primary CTA sits under the iOS home indicator and the Android gesture bar, and a real fraction of customers **cannot tap it at all**.

---

## 4. Forms (1.3.1, 3.3.1, 3.3.2, 4.1.3)

- Every field has a **real `<label>`**. A placeholder is **not** a label — it vanishes on focus and is invisible to many screen readers.
- Errors: `aria-describedby` + `aria-invalid` + `role="alert"`.
- Radio groups use `<fieldset>`/`<legend>`.
- Quantity buttons carry real accessible names (*"Decrease quantity of Pineapple Ginger"*) — an unlabelled `+` is invisible to a screen reader.
- The phone field uses `inputMode="tel"`, so a mobile keypad appears rather than a text keyboard.

---

## 5. Motion (2.3.3)

Motion is capped at **200ms**, opacity and small translate only — **enforced by lint**. No parallax, no scroll-jack, no entrance animations.

Everything is removed under `prefers-reduced-motion`.

---

## 6. Zoom & reflow (1.4.4, 1.4.10)

`maximumScale` and `userScalable=no` are **never** set. Blocking pinch-zoom fails 1.4.4 and is hostile to anyone with low vision.

Layout is authored at **360px** and reflows to 1440px without horizontal scroll.

---

## 7. Structure (1.3.1, 2.4.2, 2.4.6)

`lang="en-KE"` · one `<h1>` per page · landmark elements (`<header>`, `<nav aria-label>`, `<main id="main">`, `<footer>`) · `<time datetime>` for dates.

---

## 8. ⚠ Known gaps — to close in Phase 3+

| Gap | Why it is open |
|---|---|
| **No automated axe/Lighthouse run** | Chromium could not install in the build sandbox. **Playwright + axe-core must run before launch.** |
| **No screen-reader pass** | NVDA/VoiceOver testing is a Phase 3 task once real pages exist. |
| **Image alt text is scaffolded** | Real alt text depends on the photography sprint (R-03). |
| **Colour-blind simulation not run** | Relevant to R-12 — all six labels are identical by design at thumbnail size. |
