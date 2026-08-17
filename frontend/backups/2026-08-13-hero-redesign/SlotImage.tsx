/**
 * SLOT IMAGE
 *
 * Renders an `ImageSlot`. Two paths, and the second one matters more right now.
 *
 * 1. SUPPLIED → a real `<picture>` with an ART-DIRECTED mobile source.
 *
 *    ⚠ Art direction, not a squeeze. The mobile crop is a DIFFERENT FILE at a
 *      DIFFERENT ASPECT (`slug-mobile.jpg`), because a 3:2 landscape hero
 *      letterboxed onto a 360px phone is a thin strip of worktop with a bottle
 *      somewhere in it. `<picture>` + `media` is the only correct mechanism —
 *      `object-fit: cover` on a single wide file WILL overcrop the product,
 *      which the brief explicitly forbids.
 *
 * 2. NOT SUPPLIED → a designed, on-brand "awaiting asset" panel.
 *
 *    ⚠ NOT a broken image. NOT a grey box. NOT a stock photo.
 *      It names the slot, states the spec, and shows the shot direction, so a
 *      missing asset is impossible to miss in a review — and so the panel is
 *      genuinely useful to the photographer rather than merely apologetic.
 *
 *      This is the R-03 state made visible. It disappears the moment a real
 *      file lands in `public/products/`.
 */

import Image from 'next/image';
import { cn } from '../../lib/utils/cn';
import type { ImageSlot, AspectRatio } from '../../content/image-slots';

const ASPECT_CLASS: Record<AspectRatio, string> = {
  '1/1': 'aspect-square',
  '4/5': 'aspect-[4/5]',
  '3/2': 'aspect-[3/2]',
  '16/9': 'aspect-video',
  '21/9': 'aspect-[21/9]',
};

/**
 * ⚠ These MUST be written out in full. Tailwind scans source text — it cannot
 *   see a class composed at runtime like `md:${aspect}`, so such a class is
 *   simply never generated and the breakpoint silently does nothing. A static
 *   map is the only thing that survives the compiler.
 */
const ASPECT_CLASS_MD: Record<AspectRatio, string> = {
  '1/1': 'md:aspect-square',
  '4/5': 'md:aspect-[4/5]',
  '3/2': 'md:aspect-[3/2]',
  '16/9': 'md:aspect-video',
  '21/9': 'md:aspect-[21/9]',
};

/** Resolves the responsive aspect pair for a slot. */
const aspectClasses = (slot: ImageSlot): string =>
  slot.mobileAspect
    ? cn(ASPECT_CLASS[slot.mobileAspect], ASPECT_CLASS_MD[slot.aspect])
    : ASPECT_CLASS[slot.aspect];

export interface SlotImageProps {
  slot: ImageSlot;
  priority?: boolean;
  className?: string;
  /** Rounded on cards; square on full-bleed editorial. */
  rounded?: boolean;
}

export function SlotImage({ slot, priority = false, className, rounded = true }: SlotImageProps) {
  const aspect = aspectClasses(slot);

  /* ---------------- awaiting asset ---------------- */
  if (!slot.supplied) {
    const isHardBlocked = slot.blockedBy?.includes('NO ASSET') || slot.blockedBy?.includes('RESHOOT');

    return (
      <div
        role="img"
        aria-label={`Photography pending. ${slot.alt}`}
        data-image-slot={slot.id}
        data-blocked-by={slot.blockedBy}
        className={cn(
          // Mobile gets its own aspect; md+ gets the desktop one.
          aspect,
          'relative flex flex-col justify-between overflow-hidden',
          'border border-dashed',
          isHardBlocked
            ? 'border-[--color-error] bg-[--color-error-bg]'
            : 'border-[--color-warning] bg-[--color-warning-bg]',
          rounded && 'rounded-[--radius-md]',
          className
        )}
      >
        {/* A quiet diagonal hatch — reads instantly as "not a photograph". */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, currentColor 0 1px, transparent 1px 9px)',
          }}
        />

        <div className="relative flex items-start justify-between gap-2 p-3">
          <span className="label-caps text-[--color-ink-muted]">
            {isHardBlocked ? 'Asset blocked' : 'Awaiting photography'}
          </span>
          <span className="spec-mono shrink-0 text-[length:--text-micro] text-[--color-ink-muted]">
            {slot.aspect}
          </span>
        </div>

        <div className="relative p-3">
          <p className="spec-mono mb-1 text-[length:--text-micro] text-[--color-ink]">
            {slot.id}
          </p>
          <p className="line-clamp-3 text-[length:--text-caption] leading-snug text-[--color-ink-muted]">
            {slot.blockedBy?.includes('—') ? slot.blockedBy.split('—')[1].trim() : slot.alt}
          </p>
        </div>
      </div>
    );
  }

  /* ---------------- supplied ---------------- */

  /**
   * ⚠ ART DIRECTION, NOT A SQUEEZE.
   *
   *   Where a slot declares a `portraitSrc`, mobile loads a DIFFERENT FILE at a
   *   DIFFERENT ASPECT — a real 4:5 crop taken around the bottle centre, with
   *   the label intact.
   *
   *   The alternative (one wide file + `object-fit: cover`) would OVERCROP the
   *   product, which the brief explicitly forbids: "do not stretch or overcrop
   *   products", "preserve labels, proportions and colour". `<picture>` +
   *   `media` is the only mechanism that actually swaps the source.
   */
  const hasArtDirectedMobile = Boolean(slot.portraitSrc && slot.mobileAspect);

  return (
    <div
      className={cn(aspect, 'relative overflow-hidden', rounded && 'rounded-[--radius-md]', className)}
    >
      {hasArtDirectedMobile ? (
        <picture>
          {/* Desktop: the 3:2 landscape frame. */}
          <source media="(min-width: 768px)" srcSet={slot.src} />
          {/* Mobile: the 4:5 portrait crop — a separate file. */}
          <source media="(max-width: 767px)" srcSet={slot.portraitSrc} />
          <Image
            src={slot.src}
            alt={slot.alt}
            width={slot.width}
            height={slot.height}
            sizes={slot.sizes}
            priority={priority}
            className="size-full object-cover"
          />
        </picture>
      ) : (
        <Image
          // A product card wants the PORTRAIT crop at every breakpoint — the
          // grid cell is 4:5 on desktop too.
          src={slot.portraitSrc ?? slot.src}
          alt={slot.alt}
          width={slot.width}
          height={slot.height}
          sizes={slot.sizes}
          priority={priority}
          className="size-full object-cover"
        />
      )}
    </div>
  );
}
