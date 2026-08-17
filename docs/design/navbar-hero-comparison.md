# Navbar + Hero — Current vs Desired

**Date:** 2026-08-13  
**Reference screenshots:** `screnshots/current-navbar-hero.png`, `screnshots/desired-navbar-hero.png`  
**Scope:** Layout, element placement, background treatment, and brand-safe colour direction for Tabasamu Sips.

---

## 1. Executive summary

The **current** homepage reads as a calm, editorial cream canvas: navbar and hero share one continuous tone, content sits in a centred container, and the product photograph is a rounded card on the right.

The **desired** reference (NexCart furniture storefront) is more **architectural and asymmetric**: the hero is a split composition with a patterned left field and a solid colour block on the right; the navbar sits **over** that split rather than in its own band; navigation clusters toward the centre-left while actions pin to the far right, often crossing the colour boundary.

For Tabasamu, adopt the desired **hero** layout language only — split composition, warm brown grounds, contour pattern, arch-framed product — while keeping the **current navbar unchanged**. Replace the reference’s cool teal with **warm brown-cream tones** from the existing palette. Pure white and flavour-strip fills remain out of scope per Brand Book rules.

> **Scope lock:** The navbar (`Header.tsx`, `Navbar.tsx`) is approved as-is. All work below applies to the hero section only.

---

## 2. Side-by-side comparison

| Aspect | Current (`current-navbar-hero`) | Desired (`desired-navbar-hero`) |
|--------|--------------------------------|----------------------------------|
| **Navbar position** | Document-flow band above hero (utility + main rows) | Overlays hero; no separate chrome band visible |
| **Navbar background** | Opaque utility grey + raised surface main bar | Appears transparent / integrated with hero grounds |
| **Logo placement** | Far left, full Tabasamu lockup | Far left, compact wordmark + icon |
| **Primary nav** | Inline after logo (Shop, Our Story, Ingredients, Contact) | Clustered centre-left (Home, Shop, Categories, Contact, Blog) |
| **Search** | Pill input with placeholder, grouped with icons on right | Icon-only search on far right (no pill in reference) |
| **Actions** | Bell, heart, user, cart — right cluster | Search, cart (badge), wishlist, primary CTA button |
| **Hero width** | Constrained to `--container-max`, padded | Full-bleed split — edge to edge |
| **Hero left ground** | Plain cream (`--color-canvas`) | Light ground + **subtle contour / topographic line pattern** |
| **Hero right ground** | Same cream as left; photo in rounded frame | **Solid colour block** (~40% width); photo in **arch / oval mask** |
| **Hero typography** | Terracotta eyebrow, Fraunces headline, muted standfirst | Sale eyebrow (accent colour), bold serif headline, short subcopy |
| **Primary CTA** | Charcoal “Shop the range” + terracotta-outline secondary | Solid dark pill “Shop Now” on left |
| **Secondary elements** | None in hero | Floating product card (bottom-left), circular “scroll” badge, social-proof strip on dark panel |
| **Overall mood** | Slow, editorial, brand-safe | Retail-forward, dynamic, high contrast |

---

## 3. Current implementation — what works

![Current navbar + hero](../screnshots/current-navbar-hero.png)

### Navbar

- **Two-tier utility bar** matches earlier sectioned-navbar intent: location, support, locale.
- **Logical grouping:** logo + links on the left; search + icons on the right.
- **Brand fidelity:** full logo, forest link colour, terracotta cart badge, cream/surface grounds — all within token rules.
- **Scroll behaviour:** hide on scroll down, reveal on scroll up (recent fix) suits long editorial pages.

### Hero

- **Clear hierarchy:** eyebrow → headline → standfirst → CTAs follows Brand Book voice (warm, specific, no urgency).
- **Mobile order** is deliberate (headline before image) — preserve this if the layout changes.
- **Label safety:** product photography stays in its own column; type never crosses the bottle label.
- **LCP:** hero image marked `priority` — keep for performance.

### Gaps relative to desired (hero only)

- Hero right side **does not anchor** the layout; the bottle floats on the same ground as the copy.
- No **background pattern** or **colour blocking** to create depth.
- Product image uses a **rounded rectangle**, not the reference **vertical arch** frame.

> Navbar placement and styling are **out of scope** — no changes planned.

---

## 4. Desired reference — what to borrow (hero only)

![Desired navbar + hero](../screnshots/desired-navbar-hero.png)

### Hero layout

- **Full-bleed section** breaking out of `--container-max` for backgrounds; **content** (type, CTAs) remains container-aligned on the left.
- **~60 / 40 split** (adjust per breakpoint): copy + pattern left; colour panel + product right.
- **Left pattern:** very low-contrast contour / organic line art in `--color-cream-border` or `--color-charcoal-subtle` at 8–12% opacity — must not compete with headline (Brand Book: calm single-tone fields for mark and type).
- **Right panel:** solid fill, full height of hero, product image clipped to **arch or soft oval** (reference uses vertical arch — strong focal frame).
- **Optional accents** (evaluate for Tabasamu tone):
  - Small floating product/card chip — only if it carries real catalogue data, not decorative filler.
  - Circular scroll indicator — low priority; may conflict with “no urgency” voice unless static/decorative.
  - Social proof (“12M+ Happy Customer”) — **do not invent**; blocked until real metrics exist [NN-05].

### CTA pattern

- Reference uses one **solid dark primary** on the left. Tabasamu equivalent: **`--color-action` (charcoal) on cream** [D-04a], not the reference’s teal button.
- Keep secondary storytelling CTA if desired, but visually subordinate (outline/secondary variant).

---

## 5. Colour direction — warm brown grounds (hero)

The reference uses cool grey (left) and dark teal (right). Tabasamu should stay in the **warm brown-cream family** already present in the logo and canvas — terracotta, cream, cream-border — with a **lighter, slightly deeper brown** on the right panel so the split reads without introducing a new hue.

### Recommended tokens

Add semantic aliases in `globals.css` (derived from existing palette — no new brand colours):

| Token | Base | Hex (approx.) | Role |
|-------|------|---------------|------|
| `--color-hero-ground` | `--color-cream-sunken` | `#F6EDE4` | Full-bleed left ground + pattern base |
| `--color-hero-panel` | cream-border + sunken mix | `#E8DDD0` | Right solid panel (warm taupe-brown) |
| `--color-hero-pattern` | `--color-cream-border` | `#E8DACB` | Contour line stroke @ 10–14% opacity |

Optional subtle forest whisper on the right panel (if taupe alone feels flat):

| `--color-hero-panel` alt | Forest 8% on `#E8DDD0` | `#E2E8E0` | Slightly cooler brown-green wash |

**Avoid**

- Pure `#FFFFFF` or full-strength `#1D6B4F` as a hero panel [NN-01, P-01].
- Flavour-strip colours as section fills [R-15].
- Cool grey/teal from the NexCart reference — wrong temperature for Tabasamu.

**Logo / product**

- Copy column stays on patterned `--color-hero-ground` (warm brown-cream).
- Bottle photography sits inside the arch on `--color-hero-panel`; label must remain fully visible inside the mask.

---

## 6. Hero wire (desktop)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [EXISTING NAVBAR — unchanged, document flow above hero]                      │
├──────────────────────────────┬──────────────────────────────────────────────┤
│ ░░ warm brown + contour ░░ │████████████████████████████████████████████│
│                              │██  warm taupe-brown panel (#E8DDD0)      ██│
│  EYEBROW                     │██                                        ██│
│  Headline (Fraunces)         │██         ╭──── arch ────╮                ██│
│  Standfirst                  │██         │   bottle     │  ← 5:7 frame  ██│
│  [Shop] [How it is made]     │██         ╰──────────────╯                ██│
│                              │██                                        ██│
└──────────────────────────────┴──────────────────────────────────────────────┘
     ~58–62% width                    ~38–42% width
     --color-hero-ground             --color-hero-panel
     + HeroPattern SVG               + HeroArchFrame
```

**Mobile (preserve existing order rules):**

- Stack: eyebrow → headline → **arch image** → standfirst → CTAs.
- Pattern may simplify or drop below `md` to reduce noise.
- Right panel becomes a **band behind the image** rather than a side-by-side split.

---

## 7. Hero implementation

**Navbar:** no changes.  
**Files to touch:** `Hero.tsx`, new `HeroPattern.tsx`, new `HeroArchFrame.tsx`, `globals.css`, optionally `SlotImage.tsx` (arch variant prop).

### 7.1 Approach

1. **Full-bleed hero shell** — break out of the centred container for backgrounds only; keep copy in `max-w-[--container-max]`.
2. **Two-column grid** — `58fr / 42fr` on `lg+`, matching the reference split.
3. **Left ground** — `--color-hero-ground` + absolutely positioned `HeroPattern` SVG (contour lines, `aria-hidden`, `pointer-events-none`).
4. **Right ground** — `--color-hero-panel` full-height column; no pattern (solid warm brown block like reference).
5. **Arch frame** — fixed proportions matching reference (~**width 340px × height 476px** → ratio **5:7** on desktop); use `clip-path` or inline SVG mask; `object-cover` on the bottle image inside.
6. **Preserve** mobile content order, LCP `priority`, copy from `homepage.ts`, label-safe cropping.

### 7.2 Arch proportions (from `desired-navbar-hero`)

Measure against the reference arch containing the armchair:

| Property | Reference (approx.) | Tabasamu target |
|----------|---------------------|-----------------|
| Shape | Vertical arch — semicircle top, straight vertical sides, flat bottom | Same geometry via `clip-path` |
| Width | ~38% of arch column | `w-[min(100%,21.25rem)]` (340px) |
| Height | ~1.4× width | `aspect-[5/7]` → 340×476px |
| Image fit | `object-cover`, centred | Preserve label in upper-centre of frame |
| Mobile | Full width, max 280px wide | `w-[min(100%,17.5rem)]` centred |

### 7.3 Step 1 — Register hero tokens

Add to `@theme` in `frontend/src/app/globals.css`:

```css
@theme {
  /* Hero split grounds — warm brown family, derived from cream scale */
  --color-hero-ground: #f6ede4; /* cream-sunken */
  --color-hero-panel: #e8ddd0;  /* warm taupe-brown */
  --color-hero-pattern: #e8dacb; /* cream-border — pattern strokes */
}
```

### 7.4 Step 2 — Contour pattern component

Create `frontend/src/components/storefront/HeroPattern.tsx`:

```tsx
/**
 * Decorative topographic lines for the hero left ground.
 * aria-hidden — never carries meaning. Low contrast only.
 */
export function HeroPattern({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 800 800"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Organic contour loops — mimic desired-navbar-hero line density */}
      <g
        fill="none"
        stroke="var(--color-hero-pattern)"
        strokeWidth="1"
        opacity="0.14"
      >
        <path d="M0 520 C180 480, 260 560, 400 520 S620 440, 800 500" />
        <path d="M0 420 C200 380, 320 460, 480 420 S680 360, 800 400" />
        <path d="M0 320 C160 280, 300 360, 440 320 S660 260, 800 300" />
        <path d="M0 220 C220 180, 340 260, 500 220 S700 160, 800 200" />
        <path d="M0 620 C140 580, 280 660, 420 620 S640 560, 800 600" />
        <path d="M0 720 C190 680, 310 760, 450 720 S670 660, 800 700" />
        {/* Closing ellipses for depth */}
        <ellipse cx="620" cy="380" rx="140" ry="90" />
        <ellipse cx="180" cy="580" rx="120" ry="75" />
        <ellipse cx="480" cy="640" rx="160" ry="95" />
      </g>
    </svg>
  );
}
```

### 7.5 Step 3 — Arch frame component

Create `frontend/src/components/storefront/HeroArchFrame.tsx`:

```tsx
import { cn } from '../../lib/utils/cn';
import { SlotImage } from '../editorial/SlotImage';
import type { ImageSlot } from '../../content/image-slots';

/**
 * Vertical arch mask — proportions matched to desired-navbar-hero (~5:7).
 * Uses clip-path so Next/Image keeps priority/LCP behaviour.
 */
const ARCH_CLIP =
  'path("M 50 0 Q 100 0 100 12 L 100 100 L 0 100 L 0 12 Q 0 0 50 0")';

export function HeroArchFrame({
  slot,
  priority,
  className,
}: {
  slot: ImageSlot;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative mx-auto w-[min(100%,17.5rem)] lg:w-[min(100%,21.25rem)]',
        'aspect-[5/7]',
        className
      )}
    >
      <div
        className="size-full overflow-hidden"
        style={{ clipPath: ARCH_CLIP }}
      >
        {/* Fill arch — object-cover preserves bottle; verify label in QA */}
        <SlotImage slot={slot} priority={priority} rounded={false} className="size-full !aspect-auto min-h-full" />
      </div>
    </div>
  );
}
```

> **Note:** If `clip-path: path()` support is a concern, ship an equivalent inline SVG `<clipPath id="hero-arch">` and reference `clip-path: url(#hero-arch)`. Geometry stays identical.

Alternative SVG clip (drop into `Hero.tsx` once):

```tsx
<svg width="0" height="0" aria-hidden className="absolute">
  <defs>
    <clipPath id="hero-arch" clipPathUnits="objectBoundingBox">
      {/* Normalised arch: rounded top, flat base */}
      <path d="M0.5,0 C0.78,0 1,0.08 1,0.14 L1,1 L0,1 L0,0.14 C0,0.08 0.22,0 0.5,0 Z" />
    </clipPath>
  </defs>
</svg>
```

Apply: `style={{ clipPath: 'url(#hero-arch)' }}`.

### 7.6 Step 4 — Refactor `Hero.tsx`

Replace the centred single-ground layout with a split shell. Copy and CTAs unchanged; only structure and grounds differ:

```tsx
import Link from 'next/link';
import { Button } from '../primitives/Button';
import { HERO_SLOT } from '../../content/image-slots';
import { HERO } from '../../content/homepage';
import { HeroPattern } from './HeroPattern';
import { HeroArchFrame } from './HeroArchFrame';
import { cn } from '../../lib/utils/cn';

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden">
      {/* Full-bleed split grounds */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid lg:grid-cols-[58fr_42fr]"
      >
        <div className="relative bg-[--color-hero-ground]">
          <HeroPattern className="absolute inset-0 size-full" />
        </div>
        <div className="hidden bg-[--color-hero-panel] lg:block" />
      </div>

      {/* Mobile: panel band behind image only */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[38%] bottom-0 bg-[--color-hero-panel] lg:hidden"
      />

      {/* Content — container-aligned */}
      <div className="relative mx-auto max-w-[--container-max] px-4 pb-16 pt-8 md:px-8 md:pb-24 md:pt-16">
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[58fr_42fr] lg:items-center lg:gap-10">
          {/* ---- type column (unchanged order rules) ---- */}
          <div className="contents lg:flex lg:flex-col lg:gap-6">
            <p className="label-caps order-1 text-[--color-accent] lg:order-none">
              {HERO.eyebrow}
            </p>
            <h1 id="hero-heading" className="order-2 text-[length:--text-h1] lg:order-none">
              {HERO.headline}
            </h1>
            <p className="measure order-4 text-[length:--text-body-lg] text-[--color-ink-muted] lg:order-none">
              {HERO.standfirst}
            </p>
            <div className="order-5 flex flex-col gap-3 sm:flex-row lg:order-none">
              <Button asChild size="lg">
                <Link href={HERO.primaryCta.href}>{HERO.primaryCta.label}</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href={HERO.secondaryCta.href}>{HERO.secondaryCta.label}</Link>
              </Button>
            </div>
          </div>

          {/* ---- arch image column ---- */}
          <div className="order-3 flex items-center justify-center lg:order-none">
            <HeroArchFrame slot={HERO_SLOT} priority />
          </div>
        </div>
      </div>
    </section>
  );
}
```

### 7.7 Step 5 — `SlotImage` tweak (optional)

For arch use, the wrapper should fill the clip without enforcing slot aspect ratio:

```tsx
// SlotImage.tsx — allow caller to override aspect when clipped
export function SlotImage({ slot, priority, className, rounded = true, fill }: SlotImageProps & { fill?: boolean }) {
  // ...
  return (
    <div className={cn(!fill && aspect, 'relative overflow-hidden', rounded && 'rounded-[--radius-md]', className)}>
      <Image /* … */ className="size-full object-cover object-[center_35%]" />
    </div>
  );
}
```

`object-[center_35%]` nudges crop to keep the bottle label inside the arch — tune per asset in QA.

### 7.8 Responsive behaviour

| Breakpoint | Left ground | Right ground | Arch |
|------------|-------------|--------------|------|
| `< lg` | Full-width pattern | Band behind image (lower 62%) | Centred, max 280px |
| `≥ lg` | 58% split + pattern | 42% solid panel | max 340px, centred in panel |

### 7.9 Accessibility & brand checks

- Pattern is decorative only (`aria-hidden`); headline contrast unchanged on `--color-hero-ground`.
- Arch clip must not crop the product label — verify against `HERO_SLOT` photography.
- Cream/brown grounds keep ≥60% warm canvas viewport [P-01].
- No urgency copy, sale badges, or invented social proof [P-07, NN-05].
- LCP: keep `priority` on hero image inside arch.

### 7.10 Implementation checklist

- [ ] Add `--color-hero-*` tokens to `globals.css`
- [ ] Create `HeroPattern.tsx`
- [ ] Create `HeroArchFrame.tsx` (with SVG clipPath fallback)
- [ ] Refactor `Hero.tsx` to split shell
- [ ] Optional: `fill` prop on `SlotImage`
- [ ] Visual QA against `screnshots/desired-navbar-hero.png` (shape + proportions)
- [ ] Visual QA against `screnshots/current-navbar-hero.png` (copy, navbar unchanged)
- [ ] Mobile order smoke test (eyebrow → headline → image → standfirst → CTAs)
- [ ] Lighthouse LCP unchanged or improved

---

## 8. Recommendation (hero only)

| Priority | Change | Rationale |
|----------|--------|-----------|
| **P0** | Full-bleed split hero — warm brown ground + taupe panel | Core visual gap |
| **P0** | `HeroPattern` contour SVG on left | Matches reference texture |
| **P0** | `HeroArchFrame` at 5:7 proportions | Matches reference product frame |
| **P1** | `--color-hero-*` semantic tokens | Keeps hex out of components |
| **P1** | Mobile panel band + centred arch | Responsive split without navbar changes |
| **—** | Navbar overlay / search / utility changes | **Explicitly out of scope** |
| **—** | Floating product chip, social proof | Only with real data [NN-05] |

**Do not adopt from reference:** cool teal panel, sale urgency, fake metrics, NexCart branding, pure white, flavour-strip fills.

---

## 9. Open questions (hero)

1. **Panel depth:** Is `#E8DDD0` warm enough, or should the right panel use the forest-whisper alt (`#E2E8E0`)?
2. **Arch crop:** Does `object-[center_35%]` keep the bottle label clear across all hero assets?
3. **Pattern density:** Are six contour paths enough, or should we add a second layered SVG at 6% opacity?
4. **Hero CTA count:** Keep primary + secondary (current) or collapse to single primary (reference)?

~~Navbar questions removed — navbar is frozen.~~

---

## 10. Related files

| Asset / code | Path |
|--------------|------|
| Current screenshot | `screnshots/current-navbar-hero.png` |
| Desired screenshot | `screnshots/desired-navbar-hero.png` |
| Hero (to refactor) | `frontend/src/components/storefront/Hero.tsx` |
| Hero pattern (new) | `frontend/src/components/storefront/HeroPattern.tsx` |
| Arch frame (new) | `frontend/src/components/storefront/HeroArchFrame.tsx` |
| Image slot | `frontend/src/content/image-slots.ts` |
| Homepage copy | `frontend/src/content/homepage.ts` |
| Slot image | `frontend/src/components/editorial/SlotImage.tsx` |
| Navbar (**frozen**) | `frontend/src/components/layout/Navbar.tsx` |
| Header (**frozen**) | `frontend/src/components/layout/Header.tsx` |
| Design tokens | `frontend/src/tokens/tokens.ts`, `frontend/src/app/globals.css` |
| Brand constraints | Brand Book §02, §03, P-01, P-07, R-15 |
