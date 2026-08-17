/**
 * SUBSCRIBE SECTION — ingredients hero + newsletter signup
 *
 * Layout reference: screnshots/subscribe-section.png
 *
 * Top: full-bleed editorial image with overlay headline, white primary CTA,
 * and top-right cutout secondary CTA.
 * Bottom: centred newsletter heading + inline pill email form.
 */

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SlotImage } from '../editorial/SlotImage';
import { INGREDIENTS_SLOT } from '../../content/image-slots';
import { SUBSCRIBE_SECTION, NEWSLETTER } from '../../content/homepage';
import { SubscribeNewsletterForm } from './SubscribeNewsletterForm';
import { cn } from '../../lib/utils/cn';

const SITE_CONTAINER =
  'container mx-auto w-full max-w-[--container-max] px-6 py-16 md:px-12 md:py-20 lg:px-16';

function SubscribeHeroCutoutCta({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <div className="absolute right-0 top-0 z-20 hidden sm:block">
      <div className="rounded-bl-[28px] bg-collection-ground pl-5 pb-5 pt-1">
        <Link
          href={href}
          className={cn(
            'subscribe-section-cutout-cta inline-flex h-11 items-center gap-2.5 rounded-full pl-5 pr-2',
            'font-body text-[0.875rem] font-medium no-underline shadow-[--shadow-raised]',
            'transition-[background-color,transform] duration-[--duration-fast] hover:scale-[1.02]',
            'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2'
          )}
        >
          {label}
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-white text-charcoal">
            <ArrowUpRight className="size-4" strokeWidth={2} aria-hidden />
          </span>
        </Link>
      </div>
    </div>
  );
}

function SubscribeHero() {
  return (
    <div className="relative mx-auto mb-14 w-[80%] md:mb-20">
      <SubscribeHeroCutoutCta
        href={SUBSCRIBE_SECTION.heroSecondaryCta.href}
        label={SUBSCRIBE_SECTION.heroSecondaryCta.label}
      />

      <div
        className={cn(
          'relative overflow-hidden rounded-[28px] rounded-tr-none sm:rounded-tr-none',
          'min-h-[24rem] md:min-h-[28.8rem] lg:min-h-[33.6rem]'
        )}
      >
        <SlotImage
          slot={INGREDIENTS_SLOT}
          rounded={false}
          fill
          className="absolute inset-0 size-full"
        />

        <div
          aria-hidden
          className="subscribe-section-hero-overlay pointer-events-none absolute inset-0 z-[1]"
        />

        <div className="relative z-[2] flex h-full min-h-[inherit] flex-col justify-end p-6 md:p-10 lg:p-12">
          <div className="flex max-w-xl flex-col gap-5 md:gap-6">
            <h2
              id="subscribe-hero-heading"
              className="font-display text-[length:--text-h2] font-normal leading-[--leading-snug] text-white md:text-[clamp(1.75rem,3vw,2.5rem)]"
            >
              {SUBSCRIBE_SECTION.heroHeadline}
            </h2>

            <Link
              href={SUBSCRIBE_SECTION.heroPrimaryCta.href}
              className={cn(
                'inline-flex h-11 w-fit items-center justify-center rounded-full bg-white px-7',
                'font-body text-[0.9375rem] font-medium text-[--color-ink] no-underline shadow-[--shadow-raised]',
                'transition-[transform,background-color] duration-[--duration-fast] hover:scale-[1.02] hover:bg-white/95',
                'focus-visible:outline-2 focus-visible:outline-[--color-focus-inverse] focus-visible:outline-offset-2'
              )}
            >
              {SUBSCRIBE_SECTION.heroPrimaryCta.label}
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-4 sm:hidden">
        <Link
          href={SUBSCRIBE_SECTION.heroSecondaryCta.href}
          className={cn(
            'subscribe-section-cutout-cta inline-flex h-11 w-full items-center justify-center gap-2 rounded-full',
            'font-body text-[0.875rem] font-medium no-underline shadow-[--shadow-raised]',
            'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2'
          )}
        >
          {SUBSCRIBE_SECTION.heroSecondaryCta.label}
          <ArrowUpRight className="size-4" strokeWidth={2} aria-hidden />
        </Link>
      </div>
    </div>
  );
}

export function SubscribeSection() {
  return (
    <section aria-labelledby="subscribe-hero-heading" className="bg-collection-ground">
      <div className={SITE_CONTAINER}>
        <SubscribeHero />

        <div className="flex flex-col items-center gap-8 text-center md:gap-10">
          <header className="max-w-2xl">
            <h3
              id="newsletter-heading"
              className="font-display text-[length:--text-h3] font-normal leading-[--leading-snug] text-[--color-ink] md:text-[clamp(1.5rem,2.5vw,2rem)]"
            >
              {SUBSCRIBE_SECTION.newsletterLine1}
              <br />
              <span className="font-semibold">{SUBSCRIBE_SECTION.newsletterLine2Accent}</span>
            </h3>
            <p className="mt-3 text-[length:--text-small] text-[--color-ink-muted]">{NEWSLETTER.body}</p>
          </header>

          <SubscribeNewsletterForm />
        </div>
      </div>
    </section>
  );
}
