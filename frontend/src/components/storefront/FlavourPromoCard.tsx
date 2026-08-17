import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '../primitives/Button';
import { cn } from '../../lib/utils/cn';
import type { FlavourPromoCard } from '../../content/flavour-promo';

/** Unified card typography — same size and weight on every card. */
export const FLAVOUR_CARD_TITLE = cn(
  'font-display text-[length:--text-h3] font-normal leading-[--leading-snug] text-[--color-ink]'
);

export const FLAVOUR_CARD_SUBLINE = cn(
  'font-body text-[length:--text-small] font-medium leading-[--leading-body] text-[--color-ink-muted]'
);

function FlavourPriceFrom({ prefix, amount }: { prefix: string; amount: string }) {
  return (
    <p className="mt-0.5 flex items-baseline gap-1.5 font-body leading-none">
      <span className="text-[0.8125rem] font-normal text-[--color-ink-muted]">{prefix}</span>
      <span className="text-[1.125rem] font-semibold tracking-tight text-[#1d6b4f]">{amount}</span>
    </p>
  );
}

/** Shared card chrome */
const CARD_ROUNDING = 'rounded-xl';
const CARD_PAD_X = 'px-7 md:px-12';
const CARD_PAD_X_COMPACT = 'px-8 md:px-12';

/** Forest pill — matches hero primary CTA. Shared with editorial media CTAs. */
export const FLAVOUR_CARD_CTA = cn(
  'forest-pill-cta inline-flex min-h-0 h-10 items-center rounded-full border border-transparent px-6 py-2',
  'text-[0.875rem] font-medium no-underline',
  'focus-visible:outline-[--color-focus-inverse]'
);

function CardSurface({
  card,
  className,
  children,
}: {
  card: FlavourPromoCard;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={cn('relative overflow-hidden', CARD_ROUNDING, className)}
      style={{
        background: card.surface.background,
        boxShadow: card.surface.boxShadow,
      }}
    >
      {children}
    </article>
  );
}

function FeatureCard({ card }: { card: Extract<FlavourPromoCard, { layout: 'feature' }> }) {
  return (
    <CardSurface
      card={card}
      className={cn('flex min-h-[28rem] flex-col py-6 md:py-8 lg:min-h-[32rem]', CARD_PAD_X)}
    >
      <div className="relative z-[1] flex flex-col gap-2">
        <p className="label-caps text-[--color-ink-muted]">{card.microLabel}</p>
        <h3 className={FLAVOUR_CARD_TITLE}>{card.title}</h3>
        <p className={FLAVOUR_CARD_SUBLINE}>{card.subline}</p>

        <Button asChild variant="ghost" size="md" className={cn(FLAVOUR_CARD_CTA, 'mt-4 w-fit gap-2')}>
          <Link href={card.cta.href}>
            {card.cta.label}
            <ArrowRight className="size-4 shrink-0" aria-hidden strokeWidth={2} />
          </Link>
        </Button>
      </div>

      <div className="pointer-events-none absolute bottom-0 right-0 h-[72%] w-[58%]">
        <Image
          src={card.image}
          alt={card.imageAlt}
          width={480}
          height={480}
          className="size-full object-contain object-bottom"
          sizes="(max-width: 1024px) 50vw, 28vw"
        />
      </div>
    </CardSurface>
  );
}

function CompactCard({ card }: { card: Extract<FlavourPromoCard, { layout: 'compact' | 'compact-offer' }> }) {
  return (
    <Link href={card.href} className={cn('group block h-full focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2', CARD_ROUNDING)}>
      <CardSurface card={card} className="flex h-full min-h-[14rem] flex-row items-stretch">
        <div className={cn('relative z-[1] flex flex-1 flex-col justify-center gap-2 py-5 md:py-6', CARD_PAD_X_COMPACT)}>
          <h3 className={FLAVOUR_CARD_TITLE}>{card.title}</h3>
          <p className={FLAVOUR_CARD_SUBLINE}>{card.subline}</p>

          {card.layout === 'compact' && card.priceFrom && (
            <FlavourPriceFrom prefix={card.priceFrom.prefix} amount={card.priceFrom.amount} />
          )}

          {card.layout === 'compact-offer' && (
            <span className="mt-1 inline-flex w-fit rounded-full bg-[#1d6b4f]/10 px-3 py-1 font-body text-[0.75rem] font-medium text-[#1d6b4f]">
              {card.badge}
            </span>
          )}
        </div>

        <div className="relative w-[44%] shrink-0 sm:w-[42%]">
          <Image
            src={card.image}
            alt={card.imageAlt}
            width={360}
            height={360}
            className="size-full object-contain object-center p-2 transition-transform duration-[--duration-fast] group-hover:scale-[1.02]"
            sizes="(max-width: 1024px) 40vw, 18vw"
          />
        </div>
      </CardSurface>
    </Link>
  );
}

export function FlavourPromoCard({ card }: { card: FlavourPromoCard }) {
  if (card.layout === 'feature') {
    return <FeatureCard card={card} />;
  }

  return <CompactCard card={card} />;
}
