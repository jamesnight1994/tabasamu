import Link from 'next/link';
import { Button } from '../primitives/Button';
import { HERO_SLOT } from '../../content/image-slots';
import { HERO } from '../../content/homepage';
import { HeroPattern } from './HeroPattern';
import { HeroArchFrame } from './HeroArchFrame';
import { HeroSocialProof, HERO_ARCH_HALF } from './HeroSocialProof';
import { cn } from '../../lib/utils/cn';

/** Same horizontal rhythm as `Navbar.tsx` — copy aligns with logo edge. */
const SITE_CONTAINER = 'container mx-auto w-full max-w-[--container-max] px-4 md:px-8';

/** Pill CTAs — secondary / outline. */
const HERO_BTN = cn(
  'min-h-0 h-10 rounded-full px-5 py-6',
  'text-[0.875rem] font-medium'
);

/** Primary commerce CTA — filled teal (hero only). */
const HERO_PRIMARY_BTN = cn(
  'min-h-0 h-11 rounded-full border border-transparent px-7 py-6',
  'text-[0.875rem] font-medium text-white',
  'bg-[#1d6b4f] hover:bg-[#2a9170]',
  'focus-visible:outline-[--color-focus-inverse]'
);

/** Shared hero vertical scale — content area taller, arch slightly shorter. */
const HERO_MIN_H = 'min-h-[clamp(32rem,78vh,48rem)]';

/** Split seam — dark panel 47%. Arch centres on this line. */
const HERO_SEAM = '53%';

/** Centre of the right panel (seam 53% + half of 47%). */
const HERO_PANEL_CENTER = '76.5%';

/**
 * HERO
 *
 * Layer A — full-bleed split grounds (pattern left, dark panel right).
 * Layer B — container-aligned typography (matches navbar container).
 * Layer C — arch on the section (not the container), centred on the seam.
 *
 * MOBILE order: eyebrow → headline → image → standfirst → CTAs. [P-09]
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className={`relative ${HERO_MIN_H} overflow-hidden`}
    >
      {/* Layer A: full-bleed split — explicit absolute panels */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute inset-y-0 left-0 w-full lg:w-[53%]"
          style={{ backgroundColor: 'var(--color-hero-ground)' }}
        >
          <HeroPattern className="absolute inset-0 size-full" />
        </div>
        <div
          className="absolute inset-y-0 right-0 hidden w-[47%] lg:block"
          style={{ backgroundColor: 'var(--color-hero-panel)' }}
        />
      </div>

      {/* Mobile: dark panel band behind the arch (lower ~62%) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[38%] bottom-0 z-0 lg:hidden"
        style={{ backgroundColor: 'var(--color-hero-panel)' }}
      />

      {/* Layer B: left typography — container-aligned like the reference */}
      <div className={`${SITE_CONTAINER} relative z-[1]`}>
        <div className={`flex ${HERO_MIN_H} flex-col justify-center py-12 md:py-14 lg:py-20 xl:py-24`}>
          <div className="flex w-full max-w-[34rem] flex-col lg:pr-12 xl:pr-16 xl:pl-6">
            <p className="label-caps order-1 mb-4 text-[--color-accent] lg:mb-5">
              {HERO.eyebrow}
            </p>

            <h1
              id="hero-heading"
              className="order-2 max-w-[14ch] text-[length:--text-hero] leading-[--leading-tight] tracking-[--tracking-hero] text-[--color-ink]"
            >
              {HERO.headline}
            </h1>

            {/* Mobile: arch in document flow */}
            <div className="order-3 my-8 flex justify-center lg:hidden">
              <HeroArchFrame slot={HERO_SLOT} priority />
            </div>

            <p className="measure-narrow order-4 max-w-md text-[length:--text-body] leading-[--leading-body] text-[--color-ink-muted] lg:mt-12 lg:max-w-[28rem]">
              {HERO.standfirst}
            </p>

            <div className="order-5 mt-12 flex flex-col gap-3 sm:flex-row lg:mt-14">
              <Button asChild variant="primary" size="md" className={HERO_PRIMARY_BTN}>
                <Link href={HERO.primaryCta.href}>{HERO.primaryCta.label}</Link>
              </Button>
              <Button asChild variant="secondary" size="md" className={HERO_BTN}>
                <Link href={HERO.secondaryCta.href}>{HERO.secondaryCta.label}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Layer C: desktop arch — section-relative so % centre tracks the viewport */}
      <div
        className="pointer-events-none absolute inset-y-0 z-20 hidden lg:flex lg:items-center lg:justify-center"
        style={{ left: HERO_SEAM, transform: 'translateX(-50%)' }}
      >
        <div className="pointer-events-auto">
          <HeroArchFrame slot={HERO_SLOT} priority />
        </div>
      </div>

      {/* Social proof — bottom-centre of right panel, base aligned with arch */}
      <div
        className="absolute z-30 hidden lg:block"
        style={{
          left: HERO_PANEL_CENTER,
          top: `calc(50% + ${HERO_ARCH_HALF})`,
          transform: 'translate(-50%, -100%)',
        }}
      >
        <HeroSocialProof />
      </div>
    </section>
  );
}
