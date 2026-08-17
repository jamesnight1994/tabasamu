'use client';

/**
 * COMMERCE PRIMITIVES
 *
 * The three components here carry most of the brand and honesty risk in the
 * whole system. Read the notes before changing them.
 */

import { cn } from '../../lib/utils/cn';
import { type Money, formatMoney } from '../../domain/shared';
import {
  type Pending,
  type Unavailable,
  type FlavourStrip,
  type StockStatus,
  isUnavailable,
  PLACEHOLDER_PRICES,
} from '../../domain/catalogue';

/* ================================================================== *
 * PendingValue
 *
 * The single component that renders an `Unavailable`.
 *
 * ⚠ This is the mechanical guarantee behind NN-05. A blocked field cannot be
 *   accidentally rendered as an empty string, a dash, or a plausible guess —
 *   it renders as an explicit, visible, traceable "awaiting client
 *   confirmation" marker carrying its decision ID.
 *
 *   If this component ever appears on a production page, that is the SYSTEM
 *   WORKING: it means a real question is still unanswered, and it is now
 *   impossible to miss.
 * ================================================================== */

export function PendingValue({
  value,
  className,
  inline = true,
}: {
  value: Unavailable;
  className?: string;
  inline?: boolean;
}) {
  const Tag = inline ? 'span' : 'div';
  return (
    <Tag
      data-pending={value.blockedBy}
      title={value.note}
      className={cn(
        'inline-flex items-center gap-1.5',
        'rounded-[--radius-sm] border border-dashed border-[--color-warning]',
        'bg-[--color-warning-bg] px-2 py-0.5',
        'font-mono text-[length:--text-caption] text-[--color-ink]',
        className
      )}
    >
      <span className="sr-only">Awaiting client confirmation, blocked by decision </span>
      <span aria-hidden="true">⛔</span>
      <span>{value.blockedBy}</span>
    </Tag>
  );
}

/* ================================================================== *
 * PriceDisplay
 *
 * ⛔ D-14 — NO APPROVED PRICE EXISTS.
 *
 * While `PLACEHOLDER_PRICES` is true, every price on the site renders with a
 * VISIBLE indicative marker. This is deliberate and it is not decoration: a
 * placeholder price that looks like a real price WILL end up in a screenshot,
 * a stakeholder deck, or a launch, and someone will believe it.
 *
 * Set `PLACEHOLDER_PRICES = false` in `domain/catalogue` only when D-14 is answered.
 * ================================================================== */

export interface PriceDisplayProps {
  price: Pending<Money>;
  compareAt?: Money | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Hide the D-14 indicative marker inline — use when shown elsewhere on the card. */
  hideIndicative?: boolean;
}

const PRICE_SIZE = {
  sm: 'text-[length:--text-small]',
  md: 'text-[length:--text-body-lg]',
  lg: 'text-[length:--text-h3]',
} as const;

export function PriceDisplay({
  price,
  compareAt,
  size = 'md',
  className,
  hideIndicative = false,
}: PriceDisplayProps) {
  if (isUnavailable(price)) {
    return <PendingValue value={price} className={className} />;
  }

  return (
    <span className={cn('inline-flex items-baseline gap-2', className)}>
      <span
        className={cn(
          'font-display font-medium tabular-nums text-[--color-ink]',
          PRICE_SIZE[size]
        )}
      >
        {formatMoney(price)}
      </span>

      {/*
        ⚠ P-07. A compare-at price is shown WITHOUT urgency framing: no
        "was", no red, no "SAVE 20%", no timer, no badge. It is a struck
        figure and nothing more. If it cannot be shown calmly, it is not shown.
      */}
      {compareAt && compareAt.amount > price.amount && (
        <span className="font-body text-[length:--text-caption] text-[--color-ink-muted] line-through tabular-nums">
          {formatMoney(compareAt)}
        </span>
      )}

      {PLACEHOLDER_PRICES && !hideIndicative && (
        <span
          data-placeholder-price="D-14"
          title="This price is a placeholder. No price has been approved by the client (D-14)."
          className="rounded-[--radius-sm] border border-dashed border-[--color-warning] bg-[--color-warning-bg] px-1.5 py-px font-mono text-[length:--text-micro] text-[--color-ink]"
        >
          <span className="sr-only">Warning: </span>indicative
        </span>
      )}
    </span>
  );
}

/* ================================================================== *
 * FlavourSwatch
 *
 * ⚠ THE OFF-PALETTE QUARANTINE. [R-15]
 *
 * This is the ONLY component in the entire codebase permitted to consume a
 * flavour-strip hex. Four of the six strips (Grape Ginger, Pineapple, Passion,
 * Beetroot, Gooseberry) are OUTSIDE the five-colour Brand Book palette.
 *
 * A flavour strip is a PACKAGING system, not a WEB system. Promoting one into
 * site chrome — a card background, a section fill, a button — would break the
 * palette that the Brand Book exists to protect.
 *
 * The swatch is therefore small, bounded, and always accompanied by the flavour
 * NAME in text. Colour is never the only carrier of meaning (WCAG 1.4.1), which
 * also happens to be the answer to R-12: at a 160px thumbnail, in greyscale,
 * the six bottles are otherwise identical by design.
 *
 * `scripts/check-brand.mjs` fails the build if a strip hex appears anywhere else.
 * ================================================================== */

export interface FlavourSwatchProps {
  strip: FlavourStrip;
  /** Show the flavour name beside the swatch. Default TRUE — and it should
   *  stay that way. The colour alone is not an accessible label. */
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function FlavourSwatch({
  strip,
  showLabel = true,
  size = 'md',
  className,
}: FlavourSwatchProps) {
  const dot = size === 'sm' ? 'size-2.5' : 'size-3';

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        aria-hidden="true"
        data-flavour-swatch
        className={cn(
          dot,
          'shrink-0 rounded-[--radius-pill]',
          // A hairline keeps the pale strips (Pineapple #E9C25B) visible on cream.
          'ring-1 ring-inset ring-black/10'
        )}
        // ⚠ The ONLY legal use of a strip hex in the codebase.
        style={{ backgroundColor: strip.hex }}
      />
      {showLabel && (
        <span className="label-caps text-[--color-ink-muted]">{strip.label}</span>
      )}
      {/* The name is always available to assistive tech, even when hidden. */}
      {!showLabel && <span className="sr-only">{strip.label}</span>}
    </span>
  );
}

/* ================================================================== *
 * StockStatusDisplay
 *
 * ⚠ Stock messaging is FACTUAL. "Two bottles remaining."
 *   NEVER "Almost gone", never a countdown, never a badge. [P-07]
 *
 * ⚠ A stock-out is NORMAL for small-batch fermentation. Where a batch date
 *   exists, we say when the next batch bottles — which is both more on-brand
 *   and more TRUE than a dead end. [R-24]
 * ================================================================== */

export function StockStatusDisplay({
  status,
  className,
}: {
  status: StockStatus;
  className?: string;
}) {
  const base = cn('font-body text-[length:--text-caption]', className);

  switch (status.kind) {
    case 'in_stock':
      return (
        <p className={cn(base, 'text-[--color-success]')}>
          <span aria-hidden="true">·</span> In stock
        </p>
      );

    case 'low_stock':
      // Factual. A number, not an adjective.
      return (
        <p className={cn(base, 'text-[--color-ink-muted]')}>
          {status.remaining} {status.remaining === 1 ? 'bottle' : 'bottles'} remaining
        </p>
      );

    case 'next_batch':
      return (
        <p className={cn(base, 'text-[--color-ink-muted]')}>
          Next batch bottles on{' '}
          <time dateTime={status.date} className="font-mono">
            {status.date}
          </time>
        </p>
      );

    case 'out_of_stock':
      return (
        <p className={cn(base, 'text-[--color-ink-muted]')}>
          Sold out. The next batch is still fermenting.
        </p>
      );

    case 'unknown':
      return (
        <p className={cn(base, 'text-[--color-ink-muted]')}>
          <PendingValue
            value={{
              _unavailable: true,
              blockedBy: status.blockedBy,
              note: 'Stock messaging is blocked.',
            }}
          />
        </p>
      );
  }
}
