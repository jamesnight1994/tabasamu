# Flavours Section — Implementation Spec

**Date:** 2026-08-14  
**Reference screenshot:** `screnshots/flavours-section.png`  
**Assets:** `frontend/public/flavors/passion.jpg`, `pineapple.jpg`, `beetroot.jpg`  
**Placement:** Homepage section **immediately after** `<Hero />`, **before** `<CollectionPreview />`.

---

## 1. Executive summary

The reference shows a **3-card editorial grid**: one tall feature card on the left, two stacked cards on the right. Each card pairs **flavour-tinted ground + headline + supporting line + product photo + optional CTA**.

For Tabasamu:

| Reference | Tabasamu adaptation |
|-----------|---------------------|
| Green/cream feature card | **Passion** — large left card, passion-tint ground |
| Gray card + price | **Pineapple** — health-forward supporting copy (no invented price until D-14) |
| Gray card + discount | **Beetroot** — one card carries an **intro-offer** message (wording TBC with client; no fake %) |
| Mixed type weights | **Unified typography** — same font size + weight on every card title and subline |
| Full-saturation fills | **Tinted grounds only** — strip hue at 8–12% on cream, not raw strip hex [R-15] |

> **Brand constraint [R-15]:** Flavour-strip colours are a **packaging** system. Card backgrounds use **derived tints** (`--color-flavor-*-ground`), never the full strip hex as a section fill. The strip may appear as a small swatch beside the name if needed.

> **Copy constraint [R-02, NN-05]:** Health-adjacent claims only — caffeine-free, rooibos base, live culture, Kenyan fruit. **No** medical claims (“aids digestion”, “boosts immunity”). Discount copy must not invent a price or percentage until **D-14** is confirmed.

---

## 2. Reference layout (from `flavours-section.png`)

```
┌──────────────────────────────┬─────────────────────┐
│                              │  Card B (top-right) │
│   Card A — FEATURE           │  headline + subline │
│   large, row-span 2          │  product photo      │
│   headline + micro lines     ├─────────────────────┤
│   CTA pill                   │  Card C (bottom)    │
│   product photo (BR)         │  headline + CTA     │
│                              │  product photo      │
└──────────────────────────────┴─────────────────────┘
        ~58% width                  ~42% width
```

**Mobile:** stack A → B → C (feature first).

---

## 3. Tabasamu card mapping

| Slot | Flavour | Image | Ground tint | Message angle |
|------|---------|-------|-------------|---------------|
| **A — feature** | Passion | `/flavors/passion.jpg` | Passion blue wash | Health: caffeine-free rooibos, live culture |
| **B — top-right** | Pineapple | `/flavors/pineapple.jpg` | Pineapple gold wash | Health: bright fruit, nothing to recover from |
| **C — bottom-right** | Beetroot | `/flavors/beetroot.jpg` | Beetroot wash | **Intro offer** — save on first box (no % until approved) |

All three link to their PDP: `/shop/{slug}`.

---

## 4. Typography — unified across cards

Every card uses the **same classes** for equivalent elements:

| Element | Classes | Notes |
|---------|---------|-------|
| **Title** | `font-display text-[length:--text-h3] font-normal leading-[--leading-snug] text-[--color-ink]` | Fraunces, one weight — no bold on one card only |
| **Subline** | `font-body text-[length:--text-small] font-medium leading-[--leading-body] text-[--color-ink-muted]` | Same size/weight on all cards |
| **Micro label** (feature only, optional) | `label-caps text-[--color-ink-muted]` | Same `text-micro` scale as site eyebrows |
| **CTA** | Reuse hero pill pattern — forest fill, white label, `rounded-full` | Only on cards A + C in reference |

```tsx
// Shared — import in FlavourPromoCard.tsx
export const FLAVOUR_CARD_TITLE =
  'font-display text-[length:--text-h3] font-normal leading-[--leading-snug] text-[--color-ink]';

export const FLAVOUR_CARD_SUBLINE =
  'font-body text-[length:--text-small] font-medium leading-[--leading-body] text-[--color-ink-muted]';
```

---

## 5. Colour tokens — tinted grounds (R-15 safe)

Add to `frontend/src/app/globals.css` `@theme`:

```css
@theme {
  /* Flavour promo card grounds — strip @ ~10% on cream, NOT full strip fills */
  --color-flavor-passion-ground: #eef6fc;   /* passion #0B8BFF @ ~8% */
  --color-flavor-pineapple-ground: #fdf8eb; /* pineapple #E9C25B @ ~10% */
  --color-flavor-beetroot-ground: #f9eff1;  /* beetroot #8B2635 @ ~8% */
}
```

Derive precisely later with `color-mix(in srgb, {strip} 10%, var(--color-cream) 90%)` once implemented.

**Contrast:** Titles stay `--color-ink` on tints (all pass AA on sampled values). CTAs use forest `#1d6b4f` / white — same as hero primary button.

---

## 6. Content module

Create `frontend/src/content/flavour-promo.ts`:

```tsx
/**
 * FLAVOUR PROMO — homepage 3-card section (post-hero).
 * Health copy only [R-02]. Offer wording pending commercial sign-off [D-14].
 */
export const FLAVOUR_PROMO = {
  sectionId: 'flavours-promo',
  cards: [
    {
      id: 'passion-feature',
      slug: 'passion',
      layout: 'feature',
      name: 'Passion Fruit',
      title: 'Passion Fruit',
      subline: 'Caffeine-free rooibos, finished with Kenyan passion fruit.',
      microLabel: 'Live culture · no coffee crash',
      image: '/flavors/passion.jpg',
      imageAlt:
        'Tabasamu Sips Passion bottle with fresh passion fruit on a warm ground.',
      ground: 'var(--color-flavor-passion-ground)',
      cta: { label: 'Shop Passion', href: '/shop/passion' },
    },
    {
      id: 'pineapple-compact',
      slug: 'pineapple',
      layout: 'compact',
      name: 'Pineapple',
      title: 'Pineapple',
      subline: 'Bright pineapple on a slow ferment — easy on the evening.',
      image: '/flavors/pineapple.jpg',
      imageAlt: 'Tabasamu Sips Pineapple with fresh pineapple.',
      ground: 'var(--color-flavor-pineapple-ground)',
      cta: { label: 'Shop Pineapple', href: '/shop/pineapple' },
    },
    {
      id: 'beetroot-offer',
      slug: 'beetroot',
      layout: 'compact-offer',
      name: 'Beetroot',
      title: 'Beetroot',
      subline: 'Intro offer — save on your first box.',
      image: '/flavors/beetroot.jpg',
      imageAlt: 'Tabasamu Sips Beetroot with fresh beetroot.',
      ground: 'var(--color-flavor-beetroot-ground)',
      cta: { label: 'Shop Beetroot', href: '/shop/beetroot' },
      badge: 'Intro offer', // optional pill; no % until D-14
    },
  ],
} as const;

export type FlavourPromoCard = (typeof FLAVOUR_PROMO.cards)[number];
```

---

## 7. Components

### 7.1 `FlavourPromoCard.tsx` (server component)

Single card primitive — `layout` prop controls feature vs compact.

```tsx
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../primitives/Button';
import { cn } from '../../lib/utils/cn';
import type { FlavourPromoCard } from '../../content/flavour-promo';

const TITLE = 'font-display text-[length:--text-h3] font-normal leading-[--leading-snug] text-[--color-ink]';
const SUBLINE = 'font-body text-[length:--text-small] font-medium leading-[--leading-body] text-[--color-ink-muted]';
const CTA = cn(
  'min-h-0 h-10 rounded-full border border-transparent px-6 py-2',
  'text-[0.875rem] font-medium text-white',
  'bg-[#1d6b4f] hover:bg-[#2a9170]'
);

export function FlavourPromoCard({ card }: { card: FlavourPromoCard }) {
  const isFeature = card.layout === 'feature';

  return (
    <article
      className={cn(
        'relative flex overflow-hidden rounded-[--radius-lg]',
        isFeature ? 'min-h-[28rem] flex-col p-6 md:p-8 lg:min-h-[32rem]' : 'min-h-[14rem] flex-col p-5 md:p-6'
      )}
      style={{ backgroundColor: card.ground }}
    >
      <div className={cn('relative z-[1] flex flex-col gap-2', !isFeature && 'max-w-[55%]')}>
        {'microLabel' in card && card.microLabel && (
          <p className="label-caps text-[--color-ink-muted]">{card.microLabel}</p>
        )}
        <h3 className={TITLE}>{card.title}</h3>
        <p className={SUBLINE}>{card.subline}</p>
        {'badge' in card && card.badge && (
          <span className="mt-1 inline-flex w-fit rounded-full bg-[--color-forest]/10 px-3 py-1 font-body text-[0.75rem] font-medium text-[--color-forest]">
            {card.badge}
          </span>
        )}
        {card.cta && (
          <Button asChild variant="primary" size="md" className={cn(CTA, 'mt-4 w-fit')}>
            <Link href={card.cta.href}>{card.cta.label}</Link>
          </Button>
        )}
      </div>

      {/* Product photo — anchored bottom-right (reference) */}
      <div
        className={cn(
          'pointer-events-none absolute bottom-0 right-0',
          isFeature ? 'h-[72%] w-[58%]' : 'h-[85%] w-[48%]'
        )}
      >
        <Image
          src={card.image}
          alt={card.imageAlt}
          width={480}
          height={480}
          className="size-full object-contain object-bottom"
          sizes={isFeature ? '(max-width: 1024px) 50vw, 28vw' : '(max-width: 1024px) 40vw, 18vw'}
        />
      </div>
    </article>
  );
}
```

### 7.2 `FlavoursSection.tsx` (server component)

```tsx
import { FLAVOUR_PROMO } from '../../content/flavour-promo';
import { FlavourPromoCard } from './FlavourPromoCard';

const SITE_CONTAINER = 'container mx-auto w-full max-w-[--container-max] px-4 md:px-8';

export function FlavoursSection() {
  const [feature, ...compact] = FLAVOUR_PROMO.cards;

  return (
    <section
      id={FLAVOUR_PROMO.sectionId}
      aria-labelledby="flavours-promo-heading"
      className={`${SITE_CONTAINER} py-12 md:py-16 lg:py-20`}
    >
      <h2 id="flavours-promo-heading" className="sr-only">
        Featured flavours
      </h2>

      <div className="grid gap-4 md:gap-5 lg:grid-cols-[1.15fr_1fr] lg:grid-rows-2 lg:gap-6">
        {/* Feature — spans two rows on lg+ */}
        <div className="lg:row-span-2">
          <FlavourPromoCard card={feature} />
        </div>

        {/* Compact stack */}
        {compact.map((card) => (
          <FlavourPromoCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}
```

---

## 8. Homepage integration

`frontend/src/app/(storefront)/page.tsx`:

```tsx
import { Hero } from '../../components/storefront/Hero';
import { FlavoursSection } from '../../components/storefront/FlavoursSection';
import { CollectionPreview } from '../../components/storefront/CollectionPreview';

export default async function HomePage() {
  // … adapters …

  return (
    <>
      <AnnouncementBar />
      <Hero />
      <FlavoursSection />           {/* NEW — section 2 */}
      <CollectionPreview … />         {/* section 3 — full six-flavour grid */}
      <Proposition />
      {/* … */}
    </>
  );
}
```

Update the section-order comment block in `page.tsx` to reflect the new slot.

---

## 9. Responsive behaviour

| Breakpoint | Layout |
|------------|--------|
| `< lg` | Single column: Passion → Pineapple → Beetroot |
| `≥ lg` | 2-column bento: Passion `row-span-2` left; Pineapple + Beetroot stacked right |
| Images | `object-contain object-bottom` — never crop bottle labels |

**Touch:** Card CTAs meet `--touch-min` (44px) via `h-10` minimum; entire card is not a single link (CTA + readable headings preferred for a11y).

---

## 10. Implementation phases (chronological)

### Phase 1 — Tokens & content (no UI)

**Goal:** Data and colours exist before components.

- [ ] Add `--color-flavor-*-ground` tokens to `globals.css`
- [ ] Create `frontend/src/content/flavour-promo.ts` with three cards
- [ ] Confirm `/flavors/*.jpg` alt text with marketing
- [ ] Client sign-off on beetroot offer wording (D-14) — or ship “Intro offer” without %

**Verify:** `yarn tsc --noEmit`

---

### Phase 2 — Card primitive

**Goal:** One card renders correctly in isolation.

- [ ] Create `FlavourPromoCard.tsx` with unified `TITLE` / `SUBLINE` constants
- [ ] Feature + compact layouts share typography — visual diff only on padding + image scale
- [ ] CTA matches hero forest pill

**Verify:** Temporary Storybook-style route or hard-code one card on a throwaway page (remove before merge) — or unit snapshot of rendered HTML strings in `content.test.ts` for banned health words.

---

### Phase 3 — Section grid

**Goal:** Three cards in bento layout matching reference proportions.

- [ ] Create `FlavoursSection.tsx` with `lg:grid-cols-[1.15fr_1fr] lg:grid-rows-2`
- [ ] Match container padding to hero (`container mx-auto max-w-[--container-max] px-4 md:px-8`)
- [ ] Gap `gap-4 md:gap-5 lg:gap-6`

**Verify:** Compare side-by-side with `screnshots/flavours-section.png`

---

### Phase 4 — Homepage wiring

**Goal:** Section live after hero.

- [ ] Import `<FlavoursSection />` in `page.tsx` immediately after `<Hero />`
- [ ] Update homepage section-order documentation comment
- [ ] Decide: keep `CollectionPreview` below (recommended) or trim duplicate flavours later

**Verify:** Full homepage scroll — hero → flavours bento → six-card grid

---

### Phase 5 — QA & brand lint

- [ ] Run `yarn check-brand` — no banned health/urgency words in new copy
- [ ] Contrast check on each tint ground + ink text
- [ ] Keyboard: tab order follows DOM; visible focus on CTAs
- [ ] LCP: no `priority` on promo images (below fold on most viewports)
- [ ] Mobile: photos do not obscure titles at 360px width

---

### Phase 6 — Optional enhancements (post-MVP)

- [ ] Wire compact card B CTA (reference top card has no button — optional)
- [ ] Replace static copy with `Product` port data when adapter returns marketing fields
- [ ] Add `prefers-reduced-motion` fade-in (static OK for MVP [P-11])
- [ ] Analytics slot when consent allows

---

## 11. Relationship to `CollectionPreview`

| | **FlavoursSection** (new) | **CollectionPreview** (existing) |
|--|---------------------------|----------------------------------|
| Purpose | Editorial promo — 3 hero flavours | Commerce grid — all active SKUs |
| Interactivity | Links only (server HTML) | Quick-add client island |
| Position | §2 on homepage | §3 on homepage |

Both can coexist: bento **teases** three flavours; collection **sells** the full range.

---

## 12. Open questions

1. **Beetroot offer:** Exact discount % and price — blocked on D-14. Ship generic “Intro offer” first?
2. **Pineapple card CTA:** Reference top-right card has no button — include link or subline only?
3. **R-15 tint vs reference saturation:** Are 8–10% tints enough colour identity, or push to 15% with design sign-off?
4. **Six flavours:** Show only the three with `/flavors/` assets, or add Grape Ginger / Pineapple Ginger when photography lands?

---

## 13. Related files

| Asset / code | Path |
|--------------|------|
| Reference screenshot | `screnshots/flavours-section.png` |
| Product photos | `frontend/public/flavors/*.jpg` |
| Content (new) | `frontend/src/content/flavour-promo.ts` |
| Section (new) | `frontend/src/components/storefront/FlavoursSection.tsx` |
| Card (new) | `frontend/src/components/storefront/FlavourPromoCard.tsx` |
| Homepage | `frontend/src/app/(storefront)/page.tsx` |
| Strip tokens | `frontend/src/tokens/tokens.ts` → `flavourStrip` |
| Design tokens | `frontend/src/app/globals.css` |
| Brand rules | R-15 (strip quarantine), R-02 (health claims), D-14 (pricing) |

---

## 14. Checklist (copy-paste for PR)

```
[ ] Phase 1 — tokens + flavour-promo.ts
[ ] Phase 2 — FlavourPromoCard.tsx
[ ] Phase 3 — FlavoursSection.tsx grid
[ ] Phase 4 — page.tsx after Hero
[ ] Phase 5 — brand lint + visual QA vs flavours-section.png
[ ] Section order comment updated in page.tsx
```
