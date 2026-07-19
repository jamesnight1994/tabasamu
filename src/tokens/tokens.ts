/**
 * TABASAMU SIPS — DESIGN TOKENS
 * Single source of truth. Derived from Brand Book v1.1 (May 2026).
 *
 * BINDING RULES (Brand Book + Phase 1 principles):
 *  - Pure white (#FFFFFF) is NEVER a ground.                        [NN-01, NFR-04]
 *  - Cream is the canvas, >= 60% of every viewport.                 [P-01]
 *  - Forest and terracotta may NEVER share a border. Cream buffers. [P-12]
 *  - Gold is an accent, never text. Max twice per composition.      [AX-03]
 *  - Links are forest, never terracotta (terracotta = 4.14:1, fails AA). [AX-01]
 *  - Primary CTA = charcoal ground / cream label (12.87:1).          [D-04(a), client-authorised 2026-07-14]
 *  - Flavour strips are a PACKAGING system. On the web they appear
 *    ONLY as a small identifying swatch. Never a background, fill,
 *    section colour, or button.                                     [R-15]
 *
 * Raw values live here and NOWHERE else. Components consume semantic
 * aliases. Never write a hex code in a component.
 */

/* ------------------------------------------------------------------ *
 * 1. PALETTE — the five colours. Brand Book §03.
 * ------------------------------------------------------------------ */

export const palette = {
  terracotta: '#C05A2C', // PRIMARY    · PMS 7592 C
  forest: '#1D6B4F', // SECONDARY  · PMS 3435 C
  cream: '#FDF6F0', // BACKGROUND · PMS 9220 C — the canvas
  charcoal: '#2D2D2D', // TEXT       · PMS Black 6 C
  gold: '#B8943E', // ACCENT     · PMS 7555 C — never text
} as const;

/**
 * Tonal steps. Derived strictly from the five colours — no new hues.
 * Used for borders, hovers, and disabled states only.
 */
export const tonal = {
  creamRaised: '#FFFCFA', // cards lifted off the canvas — still not pure white
  creamSunken: '#F6EDE4', // wells, inset fields
  creamBorder: '#E8DACB', // hairlines on cream
  charcoalMuted: '#5C5C5C', // secondary text — 6.25:1 on cream (measured)
  charcoalSubtle: '#8A8A8A', // tertiary/placeholder — 3.22:1 (measured), LARGE TEXT ONLY
  terracottaDeep: '#A44A22', // terracotta hover/active
  forestDeep: '#155440', // forest hover/active
  charcoalDeep: '#1A1A1A', // primary button hover
} as const;

/** Status colours. Derived from the palette wherever possible. */
export const status = {
  success: palette.forest, // forest already reads as confirmation
  successBg: '#E6F0EA',
  error: '#8B2635', // shares the Beetroot family — deliberate, kept in-family
  errorBg: '#F7E9EB',
  warning: palette.gold,
  warningBg: '#F7EFDC',
  info: palette.charcoal,
  infoBg: tonal.creamSunken,
} as const;

/* ------------------------------------------------------------------ *
 * 2. FLAVOUR STRIPS — packaging system, quarantined.
 *    D-01/D-03 answered by client 2026-07-14: six flavours.
 * ------------------------------------------------------------------ */

export const flavourStrip = {
  'grape-ginger': '#4A2A55', // Brand Book §06
  pineapple: '#E9C25B', // Brand Book §06
  'pineapple-ginger': '#C05A2C', // Brand Book §06 (== terracotta)
  passion: '#0B8BFF', // client 2026-07-14 · OFF-PALETTE, swatch use only
  beetroot: '#8B2635', // client 2026-07-14 · OFF-PALETTE, swatch use only
  gooseberry: '#4A7C59', // client 2026-07-14 · OFF-PALETTE, swatch use only
} as const;

export type FlavourSlug = keyof typeof flavourStrip;

/* ------------------------------------------------------------------ *
 * 3. TYPOGRAPHY — Brand Book §04. Two faces, one voice (+ mono for spec).
 * ------------------------------------------------------------------ */

export const font = {
  display: "'Fraunces', 'Iowan Old Style', Georgia, serif",
  body: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
} as const;

/** Approved weights ONLY. Brand Book: "Avoid Bold (700+)". */
export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600, // DM Sans only, and only for labels/CTAs
} as const;

/**
 * Type scale. Fluid via clamp() — authored at 360px, capped at 1440px.
 * Brand Book §04 hierarchy is the source.
 */
export const fontSize = {
  micro: 'clamp(0.6875rem, 0.66rem + 0.12vw, 0.75rem)', //  11 → 12  LABEL·MICRO CAPS
  caption: 'clamp(0.75rem, 0.72rem + 0.15vw, 0.8125rem)', //  12 → 13
  small: 'clamp(0.8125rem, 0.79rem + 0.15vw, 0.875rem)', //  13 → 14
  body: 'clamp(0.9375rem, 0.91rem + 0.17vw, 1rem)', //  15 → 16  BODY
  bodyLg: 'clamp(1rem, 0.96rem + 0.2vw, 1.125rem)', //  16 → 18
  h4: 'clamp(1.125rem, 1.07rem + 0.28vw, 1.3125rem)', //  18 → 21
  h3: 'clamp(1.3125rem, 1.2rem + 0.55vw, 1.625rem)', //  21 → 26  H3·SUB
  h2: 'clamp(1.75rem, 1.45rem + 1.35vw, 2.5rem)', //  28 → 40  H2·SECTION
  h1: 'clamp(2.25rem, 1.55rem + 3.1vw, 4rem)', //  36 → 64  H1·DISPLAY
  hero: 'clamp(2.5rem, 1.4rem + 4.9vw, 5.5rem)', //  40 → 88  hero only
} as const;

export const lineHeight = {
  tight: '0.95', // H1 display — Brand Book
  snug: '1.0', // H2 section — Brand Book
  heading: '1.15',
  normal: '1.45', // mantra — Brand Book
  body: '1.55', // body — Brand Book
  relaxed: '1.7',
} as const;

export const letterSpacing = {
  hero: '-0.02em', // H1 display: -2%   — Brand Book
  heading: '-0.015em', // H2 section: -1.5% — Brand Book
  normal: '0',
  wide: '0.06em',
  caps: '0.22em', // LABEL·MICRO CAPS  — Brand Book
} as const;

/** Max readable measure. Brand Book/editorial: ~65ch. */
export const measure = {
  narrow: '48ch',
  body: '65ch',
  wide: '78ch',
} as const;

/* ------------------------------------------------------------------ *
 * 4. SPACING — 4px base, geometric-ish. Generous by default (P-01).
 * ------------------------------------------------------------------ */

export const space = {
  0: '0',
  1: '0.25rem', //  4
  2: '0.5rem', //  8
  3: '0.75rem', // 12
  4: '1rem', // 16
  5: '1.25rem', // 20
  6: '1.5rem', // 24
  8: '2rem', // 32
  10: '2.5rem', // 40
  12: '3rem', // 48
  16: '4rem', // 64
  20: '5rem', // 80
  24: '6rem', // 96
  32: '8rem', // 128
  40: '10rem', // 160
  48: '12rem', // 192
} as const;

/* ------------------------------------------------------------------ *
 * 5. LAYOUT
 * ------------------------------------------------------------------ */

export const container = {
  prose: '42rem', // 672 — editorial column
  content: '64rem', // 1024
  wide: '80rem', // 1280
  max: '90rem', // 1440 — the design ceiling
} as const;

/** Breakpoints. Authoring baseline is 360px (P-09), not 1440. */
export const breakpoint = {
  xs: '360px', // small Android — THE AUTHORING BASELINE
  sm: '430px', // large phone
  md: '768px', // tablet
  lg: '1024px', // laptop
  xl: '1280px',
  '2xl': '1440px',
} as const;

/** Minimum touch target. WCAG 2.2 AA (2.5.8) requires 24px; we use 44px. */
export const touchTarget = {
  min: '44px',
  comfortable: '48px',
} as const;

/* ------------------------------------------------------------------ *
 * 6. BORDER, RADIUS, SHADOW
 *    Restrained. This brand is paper and clay, not glass and chrome.
 * ------------------------------------------------------------------ */

export const radius = {
  none: '0',
  sm: '2px',
  md: '4px',
  lg: '8px',
  pill: '999px', // flavour strip swatch + badges only
} as const;

export const borderWidth = {
  hairline: '1px',
  thick: '2px',
  focus: '2px',
} as const;

/**
 * Shadows are almost absent by design. A drop shadow is a glass metaphor;
 * this brand's metaphor is a matte print on uncoated stock.
 */
export const shadow = {
  none: 'none',
  subtle: '0 1px 2px rgba(45,45,45,0.04)',
  raised: '0 2px 8px rgba(45,45,45,0.06)',
  overlay: '0 8px 32px rgba(45,45,45,0.12)', // dialogs/drawers only
} as const;

/* ------------------------------------------------------------------ *
 * 7. FOCUS — visible, always. Never `outline: none` without replacement.
 * ------------------------------------------------------------------ */

export const focus = {
  ring: `${borderWidth.focus} solid ${palette.forest}`,
  offset: '2px',
  // On dark/terracotta grounds the forest ring lacks contrast — use cream.
  ringInverse: `${borderWidth.focus} solid ${palette.cream}`,
} as const;

/* ------------------------------------------------------------------ *
 * 8. MOTION — Brand Book P-11: <=200ms, opacity + small translate only.
 *    No parallax. No scroll-jack. No entrance animations.
 * ------------------------------------------------------------------ */

export const duration = {
  instant: '0ms',
  fast: '120ms',
  base: '180ms',
  slow: '200ms', // the ceiling. Nothing is slower than this.
} as const;

export const easing = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  entrance: 'cubic-bezier(0, 0, 0, 1)',
  exit: 'cubic-bezier(0.3, 0, 1, 1)',
} as const;

/** The only translate distances permitted. Anything larger is "animation". */
export const motionDistance = {
  nudge: '2px',
  small: '4px',
  medium: '8px',
} as const;

/* ------------------------------------------------------------------ *
 * 9. Z-INDEX — named layers. Never write a magic number.
 * ------------------------------------------------------------------ */

export const zIndex = {
  base: 0,
  raised: 10,
  sticky: 100, // sticky section headers
  header: 200, // site header
  mobileBar: 300, // mobile bottom action bar
  drawer: 400, // cart drawer, nav drawer
  overlay: 500, // scrim
  dialog: 600,
  toast: 700,
  skipLink: 800, // must beat everything
} as const;

/* ------------------------------------------------------------------ *
 * 10. CONTRAST LEDGER — audited, not assumed.
 *     Recomputed by `npm run lint:contrast`. See scripts/check-contrast.ts
 * ------------------------------------------------------------------ */

export const CONTRAST_LEDGER = [
  { fg: palette.charcoal, bg: palette.cream, ratio: 12.87, use: 'body text', pass: 'AAA' },
  { fg: tonal.charcoalMuted, bg: palette.cream, ratio: 6.25, use: 'secondary text', pass: 'AA' },
  { fg: palette.forest, bg: palette.cream, ratio: 6.0, use: 'links, focus ring', pass: 'AA' },
  { fg: palette.cream, bg: palette.charcoal, ratio: 12.87, use: 'PRIMARY CTA', pass: 'AAA' },
  { fg: palette.cream, bg: palette.forest, ratio: 6.0, use: 'forest CTA', pass: 'AA' },
  {
    fg: palette.cream,
    bg: palette.terracotta,
    ratio: 4.14,
    use: 'LARGE TEXT ONLY (>=19px semibold)',
    pass: 'AA-large',
  },
  {
    fg: palette.gold,
    bg: palette.cream,
    ratio: 2.67,
    use: 'NEVER TEXT — decorative rule/swatch only',
    pass: 'FAIL',
  },
] as const;
