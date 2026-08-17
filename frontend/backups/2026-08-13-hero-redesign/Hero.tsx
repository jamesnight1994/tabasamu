import Link from 'next/link';
import { Button } from '../primitives/Button';
import { SlotImage } from '../editorial/SlotImage';
import { HERO_SLOT } from '../../content/image-slots';
import { HERO } from '../../content/homepage';

/**
 * HERO
 *
 * ⚠ NO CAROUSEL. The brief says "avoid a carousel unless research demonstrates
 *   a clear benefit". The research does not. Carousel slides past the first are
 *   seen by a low single-digit percentage of visitors; the component costs
 *   layout shift, autoplay-motion conflicts with `prefers-reduced-motion`, and
 *   it hands the brand's most valuable surface to a control nobody operates.
 *   One composition, chosen deliberately.
 *
 * ⚠ THE MOBILE CONTENT ORDER IS DESIGNED, NOT INHERITED.
 *
 *   DESKTOP  — two columns. Type left, bottle right. The eye lands on the
 *              headline, then travels to the product.
 *
 *   MOBILE   — eyebrow → headline → IMAGE → standfirst → CTAs.
 *
 *   Note the image is NOT last, and it is NOT first. Putting it first pushes
 *   the headline below the fold on a 360px phone. Putting it last means the
 *   customer reads three paragraphs about a drink they have not yet seen. It
 *   goes after the headline: the promise, then the proof, then the ask.
 *
 *   This is implemented with explicit `order-*` utilities rather than by
 *   accepting whatever DOM order the desktop layout happened to need. [P-09]
 *
 * ⚠ TEXT NEVER CROSSES THE LABEL. The type sits in its own column on desktop
 *   and above/below the image on mobile — never over it. The brief forbids
 *   text over critical label areas, and the label IS the product.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="mx-auto max-w-[--container-max] px-4 pb-16 pt-8 md:px-8 md:pb-24 md:pt-16"
    >
      <div className="flex flex-col gap-8 md:grid md:grid-cols-12 md:items-center md:gap-12">
        {/* ---- type column ---- */}
        <div className="contents md:col-span-5 md:flex md:flex-col md:gap-6">
          <p className="label-caps order-1 text-[--color-accent] md:order-none">
            {HERO.eyebrow}
          </p>

          <h1
            id="hero-heading"
            className="order-2 text-[length:--text-h1] md:order-none"
          >
            {HERO.headline}
          </h1>

          {/*
            ⚠ Order 4 on mobile — AFTER the image (which is order 3).
              The headline earns the look; the standfirst explains it.
          */}
          <p className="measure order-4 text-[length:--text-body-lg] text-[--color-ink-muted] md:order-none">
            {HERO.standfirst}
          </p>

          <div className="order-5 flex flex-col gap-3 sm:flex-row md:order-none">
            {/*
              PRIMARY = charcoal/cream, 12.87:1. [D-04a]
              ONE commerce CTA. One.
            */}
            <Button asChild size="lg">
              <Link href={HERO.primaryCta.href}>{HERO.primaryCta.label}</Link>
            </Button>

            {/* SECONDARY = the storytelling route. Terracotta outline. */}
            <Button asChild variant="secondary" size="lg">
              <Link href={HERO.secondaryCta.href}>{HERO.secondaryCta.label}</Link>
            </Button>
          </div>
        </div>

        {/* ---- image column ---- */}
        <div className="order-3 md:col-span-7 md:order-none">
          {/*
            `priority` — this is the LCP element. Without it the hero image is
            lazy-loaded and the Largest Contentful Paint waits for the
            scroll-position calculation. On a Nairobi 3G connection that is a
            visible, measurable delay. [P-10]
          */}
          <SlotImage slot={HERO_SLOT} priority rounded />
        </div>
      </div>
    </section>
  );
}
