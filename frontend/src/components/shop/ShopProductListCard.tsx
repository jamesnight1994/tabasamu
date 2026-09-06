'use client';

/**
 * SHOP PRODUCT LIST CARD
 *
 * Horizontal list-mode tile:
 *   [ image | details column ]
 * Details stack is fixed-order and reserved so paired row cards share height.
 * Wishlist + cart use the same circular CTA hover as the carousel card.
 */

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import { SlotImage } from '../editorial/SlotImage';
import { PendingValue, PriceDisplay } from '../commerce/Price';
import { useCart } from '../commerce/CartProvider';
import { PRODUCT_SLOTS } from '../../content/image-slots';
import {
  type Product,
  type Inventory,
  type StockStatus,
  isPurchasable,
  isUnavailable,
  stockStatus,
} from '../../domain/catalogue';
import { cn } from '../../lib/utils/cn';

export interface ShopProductListCardProps {
  product: Product;
  inventory: Inventory | null;
  priority?: boolean;
}

const ICON_BTN =
  'inline-flex size-[2.5rem] shrink-0 items-center justify-center rounded-full shadow-[--shadow-raised] ring-1 ring-inset transition-[background-color,color,transform] duration-[--duration-base] ease-[--ease-standard] focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2';

const ICON_BTN_GLYPH = 'size-[1.1rem]';

/** Compact stock fragment for the size · stock meta line (no leading bullet). */
function ListStockMeta({ status }: { status: StockStatus }) {
  switch (status.kind) {
    case 'in_stock':
      return <span className="text-[--color-success]">In stock</span>;
    case 'low_stock':
      return (
        <span>
          {status.remaining} {status.remaining === 1 ? 'bottle' : 'bottles'} remaining
        </span>
      );
    case 'next_batch':
      return (
        <span>
          Next batch{' '}
          <time dateTime={status.date} className="font-mono">
            {status.date}
          </time>
        </span>
      );
    case 'out_of_stock':
      return <span>Sold out</span>;
    case 'unknown':
      return (
        <PendingValue
          value={{
            _unavailable: true,
            blockedBy: status.blockedBy,
            note: 'Stock messaging is blocked.',
          }}
        />
      );
  }
}

export function ShopProductListCard({
  product,
  inventory,
  priority = false,
}: ShopProductListCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const slot = PRODUCT_SLOTS[product.slug];
  const medusaImage = product.images[0] ?? null;
  const variant = product.variants[0];
  const status = inventory ? stockStatus(inventory) : null;
  const purchasable = inventory ? isPurchasable(inventory) : false;
  const priceUnavailable = isUnavailable(variant.price);
  const showNote = !isUnavailable(product.forwardNote);
  const canAdd = purchasable && !priceUnavailable;

  const handleAdd = () => {
    if (!canAdd) return;
    addItem(variant.id, variant.price);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <article
      data-product={product.slug}
      className={cn(
        'shop-list-card group grid h-full grid-cols-1 gap-3',
        'rounded-[1rem] border border-[--color-border]',
        'bg-[color-mix(in_oklab,var(--color-cream-sunken)_88%,var(--color-ink)_4%)]',
        'p-3',
        'sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-stretch sm:gap-4 sm:p-3.5',
        'md:grid-cols-[9.5rem_minmax(0,1fr)] md:gap-5',
        'transition-colors duration-[--duration-base] ease-[--ease-standard]',
        'hover:border-[--color-border-strong]',
        'focus-within:border-[--color-border-strong]'
      )}
    >
      <Link
        href={`/shop/${product.slug}`}
        className={cn(
          'relative aspect-[4/5] w-full overflow-hidden rounded-[0.75rem]',
          'bg-[--color-charcoal-deep] sm:aspect-auto sm:h-full sm:min-h-[10.5rem]',
          'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2'
        )}
        aria-label={`View ${product.name}`}
      >
        <div className="absolute inset-0 motion-safe:transition-transform motion-safe:duration-[--duration-slow] motion-safe:ease-[--ease-standard] motion-safe:group-hover:scale-[1.02]">
          {medusaImage ? (
            <Image
              src={medusaImage.src}
              alt=""
              width={medusaImage.width}
              height={medusaImage.height}
              sizes="(max-width: 640px) 90vw, 10rem"
              priority={priority}
              className="size-full object-cover"
            />
          ) : (
            <SlotImage slot={slot} priority={priority} rounded={false} />
          )}
        </div>
      </Link>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex flex-col gap-1.5 pt-2 sm:pt-2.5">
          <h3 className="font-body text-[0.9375rem] font-semibold leading-snug tracking-[-0.01em]">
            <Link
              href={`/shop/${product.slug}`}
              className={cn(
                'inline-flex items-center gap-1.5 text-[--color-ink] no-underline',
                'hover:text-[--color-link]',
                'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2',
                'transition-colors duration-[--duration-fast]'
              )}
            >
              <span
                aria-hidden="true"
                data-flavour-swatch
                className="size-2 shrink-0 rounded-[--radius-pill] ring-1 ring-inset ring-black/10"
                style={{ backgroundColor: product.strip.hex }}
              />
              {product.name}
            </Link>
          </h3>

          <p
            className={cn(
              'line-clamp-2 min-h-[2.5rem] text-[length:--text-caption] leading-[1.35]',
              showNote ? 'text-[--color-ink-muted]' : 'text-transparent'
            )}
          >
            {showNote ? product.forwardNote : '\u00a0'}
          </p>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[length:--text-caption] text-[--color-ink-muted]">
            <span className="spec-mono">{variant.size.label}</span>
            {status ? (
              <>
                <span aria-hidden="true" className="text-[--color-ink-subtle]">
                  ·
                </span>
                <ListStockMeta status={status} />
              </>
            ) : null}
          </div>

          <PriceDisplay
            price={variant.price}
            compareAt={variant.compareAtPrice}
            size="sm"
            className="pt-0.5"
          />
        </div>

        <div className="mt-auto pt-3">
          <div
            className={cn(
              'shop-list-card__actions flex items-center justify-end gap-1.5',
              'rounded-[0.75rem] bg-[--color-surface] px-2.5 py-2',
              'ring-1 ring-inset ring-[--color-border]/70'
            )}
          >
          <Link
            href="/account"
            aria-label={`Save ${product.name} to wishlist`}
            className={cn(ICON_BTN, 'carousel-card-cta ring-black/10')}
          >
            <Heart className={ICON_BTN_GLYPH} strokeWidth={2} aria-hidden />
          </Link>

          {canAdd ? (
            <button
              type="button"
              onClick={handleAdd}
              disabled={added}
              aria-live="polite"
              aria-label={
                added ? `${product.name} added to box` : `Add ${product.name} to box`
              }
              className={cn(ICON_BTN, 'carousel-card-cta ring-black/10')}
            >
              <ShoppingCart className={ICON_BTN_GLYPH} strokeWidth={2} aria-hidden />
            </button>
          ) : (
            <span
              className={cn(
                ICON_BTN,
                'carousel-card-cta cursor-not-allowed ring-black/10 opacity-60'
              )}
              title="Sold out"
              aria-label={`${product.name} sold out`}
            >
              <ShoppingCart className={ICON_BTN_GLYPH} strokeWidth={2} aria-hidden />
            </span>
          )}
          </div>
        </div>
      </div>
    </article>
  );
}
