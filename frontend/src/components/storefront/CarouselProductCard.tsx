'use client';

/**
 * CAROUSEL PRODUCT CARD — reference: screnshots/product-card.png
 *
 * Full-bleed image (object-cover) with a frosted info panel across the full
 * card width at the bottom (name, forward note, price). Badges top-right;
 * wishlist + cart stacked top-left on hover (with tooltips).
 *
 * R-12: the photograph, flavour name and swatch still carry identification.
 */

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Heart, ShoppingCart } from 'lucide-react';
import { PendingValue } from '../commerce/Price';
import { useCart } from '../commerce/CartProvider';
import { SlotImage } from '../editorial/SlotImage';
import { PRODUCT_SLOTS } from '../../content/image-slots';
import {
  type Product,
  type Inventory,
  isPurchasable,
  isUnavailable,
  stockStatus,
  PLACEHOLDER_PRICES,
} from '../../domain/catalogue';
import { formatMoney } from '../../domain/shared';
import { cn } from '../../lib/utils/cn';

/** Shared card aspect — keeps carousel nav vertically aligned to card centres. */
export const CAROUSEL_CARD_IMAGE_ASPECT = 'aspect-[4/5]';

export interface CarouselProductCardProps {
  product: Product;
  inventory: Inventory | null;
  priority?: boolean;
}

/** size-9 + 20% */
const ICON_BTN =
  'inline-flex size-[2.7rem] shrink-0 items-center justify-center rounded-full shadow-[--shadow-raised] ring-1 ring-inset transition-[background-color] duration-[--duration-base] ease-[--ease-standard] focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2';

const ICON_BTN_GLYPH = 'size-[1.2rem]';

const CARD_MOTION_EASE = [0.2, 0, 0, 1] as const;

const ctaContainerVariants = {
  hidden: { opacity: 0, pointerEvents: 'none' as const },
  visible: {
    opacity: 1,
    pointerEvents: 'auto' as const,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
};

const ctaItemVariants = {
  hidden: { opacity: 0, x: -10, scale: 0.9 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.22, ease: [0, 0, 0, 1] as const },
  },
};

function useFinePointerHover() {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setEnabled(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return enabled;
}

/** Compact image-overlay pills — featured-collection PRE-ORDER scale. */
function CarouselCardBadge({
  variant,
  children,
  title,
}: {
  variant: 'indicative' | 'in-stock' | 'low-stock' | 'restocking' | 'sold-out';
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center rounded-[5px] px-1.5 py-[3px]',
        'font-body font-semibold leading-none text-white shadow-sm',
        variant === 'indicative' &&
          'bg-charcoal-muted text-[0.5625rem] font-medium tracking-normal normal-case',
        variant === 'in-stock' &&
          'bg-forest text-[0.625rem] uppercase tracking-[0.08em]',
        variant === 'low-stock' &&
          'bg-forest text-[0.625rem] uppercase tracking-[0.08em]',
        variant === 'restocking' &&
          'bg-charcoal/75 text-[0.625rem] uppercase tracking-[0.08em]',
        variant === 'sold-out' && 'bg-charcoal/75 text-[0.625rem] uppercase tracking-[0.08em]'
      )}
    >
      {children}
    </span>
  );
}

function CarouselProductBadges({
  showIndicative,
  status,
  purchasable,
}: {
  showIndicative: boolean;
  status: ReturnType<typeof stockStatus> | null;
  purchasable: boolean;
}) {
  const showInStock = status?.kind === 'in_stock';
  const showLowStock = status?.kind === 'low_stock';
  const showSoldOut = !purchasable && status?.kind !== 'next_batch';
  const showRestocking = status?.kind === 'next_batch';

  if (!showIndicative && !showInStock && !showLowStock && !showSoldOut && !showRestocking) {
    return null;
  }

  return (
    <div className="absolute right-2 top-2 z-[2] flex max-w-[calc(100%-1rem)] flex-wrap justify-end gap-1 mt-1 mr-1">
      {showIndicative && (
        <CarouselCardBadge
          variant="indicative"
          title="This price is a placeholder. No price has been approved by the client (D-14)."
        >
          <span className="sr-only">Warning: </span>
          INDICATIVE
        </CarouselCardBadge>
      )}

      {showInStock && <CarouselCardBadge variant="in-stock">In stock</CarouselCardBadge>}

      {showLowStock && (
        <CarouselCardBadge variant="low-stock">{status.remaining} left</CarouselCardBadge>
      )}

      {showRestocking && <CarouselCardBadge variant="restocking">Restocking</CarouselCardBadge>}

      {showSoldOut && <CarouselCardBadge variant="sold-out">Sold out</CarouselCardBadge>}
    </div>
  );
}

const CTA_TOOLTIP =
  'pointer-events-none absolute left-[calc(100%+0.5rem)] top-1/2 z-[4] -translate-y-1/2 whitespace-nowrap rounded-md bg-charcoal px-2 py-1 text-[0.6875rem] font-medium leading-none text-white opacity-0 shadow-sm transition-opacity duration-[--duration-fast] ease-[--ease-standard] group-hover/cta:opacity-100 group-focus-within/cta:opacity-100';

function CarouselCardCtaTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className="group/cta relative inline-flex">
      {children}
      <span role="tooltip" className={CTA_TOOLTIP}>
        {label}
      </span>
    </span>
  );
}

function CarouselCardActions({
  product,
  purchasable,
  priceUnavailable,
  added,
  onAdd,
  visible,
  reducedMotion,
}: {
  product: Product;
  purchasable: boolean;
  priceUnavailable: boolean;
  added: boolean;
  onAdd: () => void;
  visible: boolean;
  reducedMotion: boolean | null;
}) {
  const motionState = visible ? 'visible' : 'hidden';
  const containerVariants = reducedMotion
    ? { hidden: { opacity: visible ? 1 : 0 }, visible: { opacity: 1 } }
    : ctaContainerVariants;
  const itemVariants = reducedMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : ctaItemVariants;

  return (
    <motion.div
      className="absolute left-2 top-2 z-[3] flex flex-col gap-1.5"
      initial={false}
      animate={motionState}
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} whileHover={reducedMotion ? undefined : { scale: 1.03 }}>
        <CarouselCardCtaTooltip label="Wishlist">
          <Link
            href="/account"
            aria-label={`Save ${product.name} to wishlist`}
            className={cn(ICON_BTN, 'carousel-card-cta ring-white/60')}
          >
            <Heart className={ICON_BTN_GLYPH} strokeWidth={2} aria-hidden />
          </Link>
        </CarouselCardCtaTooltip>
      </motion.div>

      {purchasable && !priceUnavailable && (
        <motion.div variants={itemVariants} whileHover={reducedMotion ? undefined : { scale: 1.03 }}>
          <CarouselCardCtaTooltip label="Add to Cart">
            <button
              type="button"
              onClick={onAdd}
              disabled={added}
              aria-live="polite"
              aria-label={added ? `${product.name} added to box` : `Add ${product.name} to box`}
              className={cn(ICON_BTN, 'carousel-card-cta ring-white/20')}
            >
              <ShoppingCart className={ICON_BTN_GLYPH} strokeWidth={2} aria-hidden />
            </button>
          </CarouselCardCtaTooltip>
        </motion.div>
      )}
    </motion.div>
  );
}

function CarouselInfoPanel({
  product,
  variant,
}: {
  product: Product;
  variant: Product['variants'][number];
}) {
  const showNote = !isUnavailable(product.forwardNote);
  const priceUnavailable = isUnavailable(variant.price);

  return (
    <div
      className={cn(
        'absolute inset-x-2 bottom-2 z-[2] w-[calc(100%-1rem)]',
        'rounded-[14px] px-3 py-2.5',
        'bg-white/82 shadow-[--shadow-overlay] backdrop-blur-md',
        'ring-1 ring-inset ring-white/50'
      )}
    >
      <div className="min-h-[2.5rem]">
        <h3 className="font-body text-[1.125rem] font-semibold leading-[--leading-snug] text-[--color-ink]">
          <Link
            href={`/shop/${product.slug}`}
            className={cn(
              'inline-flex items-center gap-1.5 no-underline',
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
            'mt-0.5 line-clamp-2 min-h-[1.75rem] text-[0.6875rem] leading-[--leading-normal]',
            showNote ? 'text-[--color-ink-muted]' : 'text-transparent'
          )}
        >
          {showNote ? product.forwardNote : '\u00a0'}
        </p>
      </div>

      <div className="mt-1">
        {priceUnavailable ? (
          <PendingValue value={variant.price} className="text-[0.6875rem]" />
        ) : (
          <p className="font-display text-[1.0625rem] font-semibold leading-none tabular-nums text-hero-panel">
            {formatMoney(variant.price)}
          </p>
        )}
      </div>
    </div>
  );
}

export function CarouselProductCard({
  product,
  inventory,
  priority = false,
}: CarouselProductCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [cardActive, setCardActive] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const finePointerHover = useFinePointerHover();
  const showCtas = finePointerHover === false || cardActive;

  const handleCardBlur = (event: React.FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setCardActive(false);
    }
  };

  const slot = PRODUCT_SLOTS[product.slug];
  const medusaImage = product.images[0] ?? null;
  const variant = product.variants[0];
  const status = inventory ? stockStatus(inventory) : null;
  const purchasable = inventory ? isPurchasable(inventory) : false;
  const showIndicative = PLACEHOLDER_PRICES && !isUnavailable(variant.price);
  const priceUnavailable = isUnavailable(variant.price);

  const handleAdd = () => {
    if (!purchasable || isUnavailable(variant.price)) return;
    addItem(variant.id, variant.price);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <article
      data-product={product.slug}
      className="group/card flex flex-col"
      onMouseEnter={() => setCardActive(true)}
      onMouseLeave={() => setCardActive(false)}
      onFocus={() => setCardActive(true)}
      onBlur={handleCardBlur}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-[20px]',
          'bg-[--color-charcoal-deep]',
          'shadow-[--shadow-overlay]',
          'ring-1 ring-inset ring-black/10',
          CAROUSEL_CARD_IMAGE_ASPECT,
          'motion-safe:transition-[box-shadow,ring-color] motion-safe:duration-[--duration-base]',
          'group-hover/card:ring-black/20'
        )}
      >
        <Link
          href={`/shop/${product.slug}`}
          className={cn(
            'absolute inset-0 z-0',
            'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2'
          )}
          aria-label={`View ${product.name}`}
        >
          <motion.div
            className="size-full origin-center"
            animate={{ scale: cardActive ? 1.03 : 1 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { duration: 0.45, ease: CARD_MOTION_EASE }
            }
          >
            {medusaImage ? (
              <Image
                src={medusaImage.src}
                alt=""
                width={medusaImage.width}
                height={medusaImage.height}
                sizes="(max-width: 768px) 45vw, 22vw"
                priority={priority}
                className="size-full object-cover"
              />
            ) : (
              <SlotImage slot={slot} priority={priority} rounded={false} />
            )}
          </motion.div>
        </Link>

        <CarouselProductBadges
          showIndicative={showIndicative}
          status={status}
          purchasable={purchasable}
        />

        <CarouselCardActions
          product={product}
          purchasable={purchasable}
          priceUnavailable={priceUnavailable}
          added={added}
          onAdd={handleAdd}
          visible={showCtas}
          reducedMotion={prefersReducedMotion}
        />

        <CarouselInfoPanel product={product} variant={variant} />
      </div>
    </article>
  );
}
