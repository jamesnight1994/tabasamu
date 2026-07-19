# Design Token Reference

**Source of truth:** `src/tokens/tokens.ts`. Its CSS projection is `src/app/globals.css` (`@theme`).
**Never write a hex code in a component.** Use the semantic alias.

---

## 1. Palette — the five colours (Brand Book §03)

| Token | Hex | Pantone | Role |
|---|---|---|---|
| `terracotta` | `#C05A2C` | 7592 C | Primary — **but see §3** |
| `forest` | `#1D6B4F` | 3435 C | Secondary, links, focus ring |
| `cream` | `#FDF6F0` | 9220 C | **The canvas.** ≥60% of every viewport |
| `charcoal` | `#2D2D2D` | Black 6 C | Text, **primary CTA ground** |
| `gold` | `#B8943E` | 7555 C | Accent — **never text** |

> ⚠ **NN-01 — pure white `#FFFFFF` is forbidden as a ground.** The canvas is cream.

### Derived tonal steps
No new hues. Borders, hovers, disabled states only.

| Token | Hex | Use |
|---|---|---|
| `creamRaised` | `#FFFCFA` | A card lifted off the canvas — *still not white* |
| `creamSunken` | `#F6EDE4` | Wells, input fields |
| `creamBorder` | `#E8DACB` | Hairlines |
| `charcoalMuted` | `#5C5C5C` | Secondary text — 6.25:1 |
| `charcoalSubtle` | `#8A8A8A` | Placeholder — 3.22:1, **large text only** |

---

## 2. Semantic aliases — USE THESE

| Alias | Maps to | Meaning |
|---|---|---|
| `--color-canvas` | cream | The ground |
| `--color-surface` | cream-raised | A card |
| `--color-ink` | charcoal | Primary text |
| `--color-ink-muted` | charcoal-muted | Secondary text |
| `--color-action` | **charcoal** | **Primary CTA ground** |
| `--color-action-fg` | cream | Primary CTA label |
| `--color-accent` | terracotta | Secondary/outline CTA |
| `--color-link` | forest | Links — **never terracotta** |
| `--color-focus` | forest | Focus ring |
| `--color-decor` | gold | Decorative rules **only** |

---

## 3. ⚠ The contrast ledger — audited, not assumed

Recomputed by `npm run lint:contrast`, which **fails CI** on a violation.

| Foreground | Background | Ratio | Use | Result |
|---|---|---|---|---|
| charcoal | cream | **12.87:1** | Body text | AAA |
| charcoal-muted | cream | **6.25:1** | Secondary text | AA |
| forest | cream | **6.00:1** | Links, focus | AA |
| **cream** | **charcoal** | **12.87:1** | **PRIMARY CTA** [D-04a] | **AAA** |
| cream | forest | 6.00:1 | Forest CTA | AA |
| cream | terracotta | **4.14:1** | **LARGE TEXT ONLY** (≥19px semibold) | AA-large |
| gold | cream | **2.67:1** | **NEVER TEXT** — decorative only | **FAIL** |

**Why the primary button is charcoal, not terracotta.**
Terracotta on cream is **4.14:1**. WCAG AA needs **4.5:1** for normal text. The brand's primary colour *could not legally be the primary button.* Client authorised option (a) on 14 July 2026.

Terracotta survives as an **outline** CTA — a border needs only 3:1, and the label is charcoal.
The solid `accent` variant is **force-upgraded to `lg` at runtime**, because 4.14:1 *does* clear the 3:1 large-text threshold. Enforced in code, not memory.

---

## 4. ⚠ Flavour strips — QUARANTINED (R-15)

| Flavour | Hex | In palette? |
|---|---|---|
| Pineapple Ginger | `#C05A2C` | ✓ (= terracotta) |
| Grape Ginger | `#4A2A55` | ✗ off-palette |
| Pineapple | `#E9C25B` | ✗ off-palette |
| Beetroot | `#8B2635` | ✗ off-palette |
| Passion | `#0B8BFF` | ✗ off-palette |
| Gooseberry | `#4A7C59` | ✗ off-palette |

A flavour strip is a **packaging** system, not a **web** system.

**`FlavourSwatch` is the ONLY component permitted to consume a strip hex.** A strip may never be a card background, a section fill, or a button. `scripts/check-brand.mjs` **fails the build** otherwise.

The swatch is always accompanied by the flavour **name** — colour is never the sole carrier of meaning (WCAG 1.4.1).

> **Note:** `#8B2635` is *both* Beetroot *and* `--color-error`. Deliberate — the error colour was drawn from the Beetroot family for palette coherence. It is legal **only** as `--color-error`.

---

## 5. Typography (Brand Book §04)

| Register | Face | Weight | Use |
|---|---|---|---|
| Display | **Fraunces** | 400–500 | H1–H4, the mantra (italic) |
| Interface | **DM Sans** | 400–600 | Body, buttons, labels |
| Spec | **JetBrains Mono** | 400 | **Only** SKUs, order numbers, batch codes, M-PESA refs |

> Bold (700+) is avoided. Semibold (600) is the ceiling, DM Sans only.

**Self-hosted, Latin-subset, variable WOFF2:**
`fraunces-latin.woff2` 58 KB · `dm-sans-latin.woff2` 36 KB · `jetbrains-mono-latin.woff2` 20 KB

Only the first two are **preloaded**. JetBrains Mono never appears above the fold (R-27).

### Fluid scale — authored at 360px, capped at 1440px

| Token | 360px → 1440px |
|---|---|
| `--text-hero` | 40 → 88 |
| `--text-h1` | 36 → 64 |
| `--text-h2` | 28 → 40 |
| `--text-h3` | 21 → 26 |
| `--text-body` | 15 → 16 |
| `--text-micro` | 11 → 12 |

**Utilities:** `.label-caps` (0.22em tracking) · `.spec-mono` · `.mantra` (Fraunces italic, forest — **never gold**) · `.measure` (65ch)

---

## 6. Space, layout, motion

**Space:** 4px base — `space.1` = 4px … `space.48` = 192px.

**Breakpoints:** `xs` **360px (the authoring baseline)** · `sm` 430 · `md` 768 · `lg` 1024 · `xl` 1280 · `2xl` 1440.

**Touch:** `--touch-min` **44px** on every interactive element. (WCAG 2.2 requires 24px; we exceed it — this is a phone-first store.)

**Motion (P-11):** `fast` 120ms · `base` 180ms · `slow` **200ms — the ceiling**.
Opacity and small translate (2/4/8px) only. **No parallax, no scroll-jack, no entrance animations.** Everything is removed under `prefers-reduced-motion`.

**Shadow:** almost absent by design. A drop shadow is a *glass* metaphor; this brand's metaphor is **matte print on uncoated stock**. `overlay` exists for dialogs only.

**Z-index:** named layers, never a magic number — `header` 200 · `drawer` 400 · `dialog` 600 · `toast` 700 · `skipLink` 800.
