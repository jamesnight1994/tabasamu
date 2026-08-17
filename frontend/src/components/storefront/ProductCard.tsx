'use client';

/**
 * PRODUCT CARD
 *
 * ─────────────────────────────────────────────────────────────────────
 * ✅ R-12 IS NOW SOLVED — and it is worth recording HOW, because it was the
 *    hardest visual problem in this project.
 *
 *    The Brand Book's label system is UNIFORM BY DESIGN: every bottle is
 *    identical except the colour strip along the bottom. Excellent packaging,
 *    terrible product grid — at 160px, in greyscale, on a mid-range Android in
 *    daylight, all six bottles were the same photograph.
 *
 *    Three defences, layered, because no single one was ever sufficient:
 *
 *      1. The flavour NAME is the largest thing on the card, in Fraunces.
 *      2. A colour SWATCH sits beside it — always paired with the name, so
 *         colour is never the sole carrier of meaning (WCAG 1.4.1).
 *      3. ✅ The PHOTOGRAPHY now carries a distinct fruit cue per frame —
 *         grapes + ginger root, halved passionfruit, pineapple slices,
 *         pineapple + ginger in a bowl. This was the hard requirement in the
 *         Phase 3 shot list, and the supplied images meet it.
 *
 *    Defence 3 is what actually makes the grid scannable. The other two are
 *    what make it accessible.
 * ─────────────────────────────────────────────────────────────────────
 */

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from '../primitives/Button';
import { SlotImage } from '../editorial/SlotImage';
import { PriceDisplay, FlavourSwatch, StockStatusDisplay } from '../commerce/Price';
import { PRODUCT_SLOTS } from '../../content/image-slots';
import {
  type Product,
  type Inventory,
  type Variant,
  stockStatus,
  isPurchasable,
  isUnavailable,
} from '../../domain/catalogue';
import { quickAddVariant } from '../../domain/catalogue/query';
import { cn } from '../../lib/utils/cn';

export interface ProductCardProps {
  product: Product;
  inventory: Inventory | null;
  quickAdd?: boolean;
  onQuickAdd?: (product: Product, variant: Variant) => void;
  priority?: boolean;
}

export function ProductCard({
  product,
  inventory,
  quickAdd = false,
  onQuickAdd,
  priority = false,
}: ProductCardProps) {
  const slot = PRODUCT_SLOTS[product.slug];
  const medusaImage = product.images[0] ?? null;

  /**
   * ⚠ VARIANT SELECTOR — shown only when there is a real choice.
   *
   *   `quickAddVariant` returns null for a multi-variant product, because then
   *   there is NO correct default and silently adding the first one is how a
   *   customer receives the wrong size. Today every product is 1 Litre only, so
   *   the selector never renders — but the code path exists, and the day a
   *   500ml line ships, the card is already correct.
   */
  const singleVariant = quickAddVariant(product) !== null;
  const [selectedId, setSelectedId] = useState(product.variants[0].id);
  const variant =
    product.variants.find((v) => v.id === selectedId) ?? product.variants[0];

  const [added, setAdded] = useState(false);

  const status = inventory ? stockStatus(inventory) : null;
  const purchasable = inventory ? isPurchasable(inventory) : false;

  const handleAdd = () => {
    onQuickAdd?.(product, variant);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <article
      data-product={product.slug}
      className={cn(
        'group flex flex-col gap-4',
        'rounded-[--radius-lg] border border-[--color-border] bg-[--color-surface] p-4',
        // ⚠ P-11: the only hover motion is a hairline colour shift. No lift, no
        //   scale on the CARD, no shadow bloom. A card that jumps under the
        //   cursor is a technology-startup mannerism, and this is a print brand.
        'transition-colors duration-[--duration-base] ease-[--ease-standard]',
        'hover:border-[--color-border-strong]',
        // The whole card is a focus target via its link — make that visible.
        'focus-within:border-[--color-border-strong]'
      )}
    >
      <Link
        href={`/shop/${product.slug}`}
        className={cn(
          'block overflow-hidden rounded-[--radius-md]',
          'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2'
        )}
      >
        {/* The IMAGE scales 2% on hover; the card does not. Clipped by the
            parent, so it reads as a gentle push-in rather than a bounce. */}
        <div className="motion-safe:transition-transform motion-safe:duration-[--duration-slow] motion-safe:ease-[--ease-standard] motion-safe:group-hover:scale-[1.02]">
          {medusaImage ? (
            <Image
              src={medusaImage.src}
              alt={medusaImage.alt}
              width={medusaImage.width}
              height={medusaImage.height}
              sizes="(max-width: 768px) 50vw, 25vw"
              priority={priority}
              className="aspect-[4/5] w-full object-cover"
            />
          ) : (
            <SlotImage slot={slot} priority={priority} rounded={false} />
          )}
        </div>
      </Link>

      <div className="flex flex-col gap-2">
        {/* Defence 2 — the swatch, always beside the name. */}
        <FlavourSwatch strip={product.strip} size="sm" />

        {/* Defence 1 — the name, in Fraunces, the largest thing on the card. */}
        <h3 className="text-[length:--text-h4]">
          <Link
            href={`/shop/${product.slug}`}
            className={cn(
              'text-[--color-ink] no-underline hover:text-[--color-link]',
              'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2',
              'transition-colors duration-[--duration-fast]'
            )}
          >
            {product.name}
          </Link>
        </h3>

        {/*
          SHORT DESCRIPTOR — the forward note ("Black grape, fresh ginger").
          ⛔ D-51 for Passion, Beetroot and Gooseberry: no note has been written.
             Nothing is invented — the line is simply absent, rather than filled
             with a plausible-sounding tasting note nobody approved. [NN-05]
        */}
        {!isUnavailable(product.forwardNote) && (
          <p className="text-[length:--text-caption] text-[--color-ink-muted]">
            {product.forwardNote}
          </p>
        )}

        {/* Size — and the VARIANT SELECTOR when there is a genuine choice. */}
        {singleVariant ? (
          <p className="spec-mono text-[--color-ink-muted]">{variant.size.label}</p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {product.variants.map((v) => (
              <button
                key={v.id as string}
                type="button"
                onClick={() => setSelectedId(v.id)}
                aria-pressed={v.id === selectedId}
                className={cn(
                  'min-h-[--touch-min] rounded-[--radius-sm] border px-3 py-1',
                  'spec-mono text-[length:--text-caption]',
                  'transition-colors duration-[--duration-fast]',
                  'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-1',
                  v.id === selectedId
                    ? 'border-[--color-action] bg-[--color-action] text-[--color-action-fg]'
                    : 'border-[--color-border] text-[--color-ink] hover:border-[--color-border-strong]'
                )}
              >
                {v.size.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {status && <StockStatusDisplay status={status} />}

          {/*
            ⛔ D-09 — SUBSCRIPTION INDICATOR.
               This states an ELIGIBILITY, which is a catalogue fact. It does NOT
               say "Subscribe & save" — because no saving has been approved and
               nothing can actually be subscribed to yet (M-PESA has no
               card-on-file equivalent; the billing model is undecided).
               The wording is deliberately flat. [NN-04, NN-05]
          */}
          {product.subscriptionEligible && (
            <span
              className="spec-mono text-[length:--text-micro] text-[--color-ink-subtle]"
              title="This product will be available on a recurring schedule once subscriptions launch."
            >
              · subscription eligible
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-2">
        {/*
          ⛔ D-14 — the price carries a visible "indicative" marker.
          COMPARE-AT is rendered only when one is genuinely supplied. It is
          `null` on every variant today, so no fake "was KES 700" strikethrough
          appears. Inventing a compare-at price is inventing a discount. [NN-05]
        */}
        <PriceDisplay price={variant.price} compareAt={variant.compareAtPrice} size="md" />

        {quickAdd && (
          <Button
            variant={added ? 'secondary' : 'primary'}
            fullWidth
            disabled={!purchasable}
            onClick={handleAdd}
            aria-live="polite"
          >
            {!purchasable ? 'Sold out' : added ? 'Added to your box' : 'Add to box'}
          </Button>
        )}
      </div>
    </article>
  );
}
