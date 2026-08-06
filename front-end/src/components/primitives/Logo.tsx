/**
 * LOGO
 *
 * Renders the APPROVED Tabasamu Sips brand artwork supplied in the official
 * logo package (2026-07-15). Nothing here is typed, traced, reconstructed or
 * recoloured — the component only points at the approved files and controls
 * scale, clear-space and accessibility.
 *
 * APPROVED ASSETS (in /public/brand/approved):
 *   full          → tabasamu-full-logo.png       (cap mark + "Tabasamu" + "SIPS")
 *   monogram      → tabasamu-monogram.svg         (terracotta #C05A2C cap mark)
 *   monogram/dark → tabasamu-monogram-white.svg   (fully-reversed white mark)
 *
 * TONE MAPPING (Brand Book §02 — the mark always sits on a calm single-tone field):
 *   light ground (cream)  → full logo  OR  coloured monogram
 *   dark  ground (forest/terracotta/charcoal) → white monogram
 *
 * ⚠ There is NO approved reversed FULL lockup. On a dark surface the component
 *   therefore renders the approved WHITE MONOGRAM, never a recoloured full
 *   logo. Do not fabricate a reversed lockup.
 *
 * MINIMUM SIZES (Brand Book §02, enforced below):
 *   full logo   120px wide
 *   monogram     40px wide
 *
 * No CSS filters, shadows, gradients, strokes, rotation, skew or stretch are
 * ever applied. Aspect ratio is intrinsic; scaling is width-based with
 * automatic height.
 */

import Image from 'next/image';
import { cn } from '../../lib/utils/cn';

/** Brand Book §02 digital minimums, in px. */
export const LOGO_MIN_WIDTH = {
  full: 120,
  monogram: 40,
} as const;

/**
 * Intrinsic aspect ratios (width / height) of the APPROVED assets.
 *   full     — tabasamu-full-logo.png is 1075 × 218  → 4.9312
 *   monogram — square SVG canvas 285.75 × 285.75     → 1
 */
const ASPECT = {
  full: 1075 / 218,
  monogram: 1,
} as const;

export type LogoVariant = 'full' | 'monogram';

/**
 * The tone of the GROUND the logo sits on.
 *   'light' — cream / warm-cream fields (the default brand surface)
 *   'dark'  — approved dark brand surfaces (forest, terracotta, charcoal)
 */
export type LogoTone = 'light' | 'dark';

export interface LogoProps {
  variant?: LogoVariant;
  /** Tone of the underlying surface. Decides which approved asset is used. */
  tone?: LogoTone;
  /** Rendered width in px. Clamped UP to the Brand Book minimum. */
  width?: number;
  className?: string;
  /**
   * `true` when a surrounding element already provides the accessible name
   * (e.g. a home link with `aria-label`). Renders empty alt + aria-hidden so
   * the brand name is not announced twice.
   */
  decorative?: boolean;
  priority?: boolean;
  /**
   * Minimum external clear-space as a fraction of the rendered logo's larger
   * dimension. Brand Book §02 asks for ~20–25%. Applied as padding on a
   * wrapper element, NOT baked into the artwork. Set to 0 to opt out where a
   * parent already guarantees separation.
   */
  clearSpace?: number;
}

/** Resolve the approved production asset for a variant + tone. */
const assetFor = (variant: LogoVariant, tone: LogoTone): string => {
  if (variant === 'monogram') {
    // Coloured mark on light; fully-reversed white mark on dark.
    return tone === 'dark'
      ? '/brand/approved/tabasamu-monogram-white.svg'
      : '/brand/approved/tabasamu-monogram.svg';
  }
  // full — approved only on a light (cream) field. Callers must use the
  // monogram on dark surfaces; see the component doc-block.
  return '/brand/approved/tabasamu-full-logo.png';
};

export function Logo({
  variant = 'full',
  tone = 'light',
  width,
  className,
  decorative = false,
  priority = false,
  clearSpace = 0.22,
}: LogoProps) {
  // Clamp UP to the Brand Book minimum — a logo below its minimum size is a
  // brand violation, so the component refuses to render one.
  const min = LOGO_MIN_WIDTH[variant];
  const w = Math.max(width ?? min, min);
  const h = Math.round(w / ASPECT[variant]);

  // Deliberate external clear-space, derived from the rendered artwork's
  // larger dimension. This protects the mark from neighbouring elements
  // without inflating the artwork itself.
  const pad = Math.round(Math.max(w, h) * Math.max(clearSpace, 0));

  const img = (
    <Image
      src={assetFor(variant, tone)}
      alt={decorative ? '' : 'Tabasamu Sips'}
      width={w}
      height={h}
      priority={priority}
      aria-hidden={decorative || undefined}
      // Intrinsic aspect ratio preserved: width fixed, height auto-derived.
      className={cn('block h-auto w-auto select-none', className)}
      style={{ width: w, height: h }}
      // SVG monograms: Next's optimiser is a no-op and only adds a request hop.
      // The full logo is a PNG and is left to Next's optimiser by default.
      unoptimized={variant === 'monogram'}
    />
  );

  if (!pad) return img;

  // Clear-space wrapper. The artwork stays correctly scaled and centred; the
  // padding is the protected zone, separate from any interactive touch area a
  // parent link may add.
  return (
    <span
      className="inline-flex items-center justify-center"
      style={{ padding: pad }}
    >
      {img}
    </span>
  );
}
