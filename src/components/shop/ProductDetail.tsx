'use client';

/**
 * PRODUCT DETAIL
 *
 * The purchase surface. Every claim on this page is either true, or visibly
 * marked as awaiting confirmation. Nothing in between.
 */

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Button } from '../primitives/Button';
import { useCart } from '../commerce/CartProvider';
import { QuantityControl } from '../primitives/Form';
import { Accordion } from '../primitives/Overlay';
import { Breadcrumbs } from '../primitives/Surface';
import { SlotImage } from '../editorial/SlotImage';
import { ProductCard } from '../storefront/ProductCard';
import { PriceDisplay, FlavourSwatch, StockStatusDisplay, PendingValue } from '../commerce/Price';
import { PRODUCT_SLOTS } from '../../content/image-slots';
import {
  type Product,
  type Inventory,
  stockStatus,
  isPurchasable,
  isUnavailable,
  availableStock,
  SUBSCRIPTION_OPTIONS,
  SUBSCRIPTIONS_AVAILABLE,
} from '../../domain/catalogue';
import {
  pushRecentlyViewed,
  RECENTLY_VIEWED_KEY,
  RECENTLY_VIEWED_MAX,
} from '../../domain/catalogue/query';
import { cn } from '../../lib/utils/cn';

export interface ProductDetailProps {
  product: Product;
  inventory: Inventory | null;
  related: readonly Product[];
  relatedInventory: ReadonlyMap<string, Inventory>;
  allProducts: readonly Product[];
}

type PurchaseMode = 'one-time' | 'subscription';

export function ProductDetail({
  product,
  inventory,
  related,
  relatedInventory,
  allProducts,
}: ProductDetailProps) {
  const [variantId, setVariantId] = useState(product.variants[0].id);
  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];

  const [quantity, setQuantity] = useState(1);
  const [mode, setMode] = useState<PurchaseMode>('one-time');
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  const status = inventory ? stockStatus(inventory) : null;
  const purchasable = inventory ? isPurchasable(inventory) : false;

  /**
   * ⚠ THE QUANTITY CEILING IS THE ACTUAL STOCK.
   *
   *   A customer must not be able to select 12 when 6 exist. Letting them do so
   *   moves the failure from the product page (where it is a nudge) to the
   *   checkout (where it is a rejected payment, and a lost customer).
   */
  const maxQuantity = inventory ? Math.max(1, availableStock(inventory)) : 1;

  /* ---- recently viewed ---------------------------------------------
   * ⚠ IDs ONLY, capped, client-side. This is a convenience, not a
   *   behavioural profile, and it must not quietly become one.
   * ------------------------------------------------------------------ */
  const [recent, setRecent] = useState<readonly string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENTLY_VIEWED_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      const existing = Array.isArray(parsed)
        ? parsed.filter((v): v is string => typeof v === 'string')
        : [];

      // Show what was viewed BEFORE this page, then record this one.
      setRecent(existing.filter((s) => s !== product.slug).slice(0, RECENTLY_VIEWED_MAX));

      const next = pushRecentlyViewed(existing, product.slug);
      window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
    } catch {
      // Private mode / storage disabled. A missing convenience is not an error.
      setRecent([]);
    }
  }, [product.slug]);

  const recentProducts = recent
    .map((s) => allProducts.find((p) => p.slug === s))
    .filter((p): p is Product => p !== undefined);

  /**
   * ⚠ PHASE 5 — THIS IS NOW REAL.
   *
   *   The price is SNAPSHOTTED into the cart line at the moment of adding, and
   *   it is REVALIDATED against the server before payment. A cart is a draft of
   *   an intention, never a binding quote. [F-53]
   *
   *   ⛔ D-14 — the price itself is still a PLACEHOLDER. The cart maths is
   *      correct; the numbers it operates on are not yet approved.
   */
  const handleAdd = () => {
    if (isUnavailable(variant.price)) {
      // ⛔ No approved price exists (D-14). We refuse to add a line whose price
      //    we would have to invent. The button is already disabled; this is the
      //    belt to that braces.
      return;
    }
    addItem(variant.id, variant.price, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2400);
  };

  return (
    <main id="main" className="mx-auto max-w-[--container-max] px-4 py-8 md:px-8 md:py-12">
      <Breadcrumbs
        items={[
          { label: 'Shop', href: '/shop' },
          { label: product.name, href: `/shop/${product.slug}` },
        ]}
      />

      {/* ══════════ THE PURCHASE BLOCK ══════════ */}
      <div className="mt-8 grid gap-8 md:grid-cols-2 md:gap-16">
        <Gallery product={product} />

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <FlavourSwatch strip={product.strip} size="md" />

            <h1 className="text-[length:--text-h1]">{product.name}</h1>

            {/* ✅ D-13 answered — "Caffeine Free". */}
            {!isUnavailable(product.descriptor) && (
              <p className="label-caps text-[--color-accent]">
                {product.descriptor} rooibos kombucha
              </p>
            )}

            {/*
              FLAVOUR DESCRIPTOR — the forward note.
              ⛔ D-51 for Passion, Beetroot, Gooseberry. Absent rather than
                 invented: a tasting note nobody approved is still a claim.
            */}
            {isUnavailable(product.forwardNote) ? (
              <PendingValue value={product.forwardNote} />
            ) : (
              <p className="text-[length:--text-body-lg] text-[--color-ink-muted]">
                {product.forwardNote}
              </p>
            )}
          </div>

          {/* ⛔ D-14 — placeholder, marked "indicative". */}
          <PriceDisplay price={variant.price} compareAt={variant.compareAtPrice} size="lg" />

          {status && <StockStatusDisplay status={status} />}

          {/* ---- SIZE / VARIANT ---- */}
          <fieldset className="flex flex-col gap-3">
            <legend className="label-caps mb-1 text-[--color-ink-muted]">Size</legend>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id as string}
                  type="button"
                  onClick={() => setVariantId(v.id)}
                  aria-pressed={v.id === variantId}
                  className={cn(
                    'min-h-[--touch-min] rounded-[--radius-sm] border px-4 py-2',
                    'spec-mono text-[length:--text-small]',
                    'transition-colors duration-[--duration-fast]',
                    'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-1',
                    v.id === variantId
                      ? 'border-[--color-action] bg-[--color-action] text-[--color-action-fg]'
                      : 'border-[--color-border] text-[--color-ink] hover:border-[--color-border-strong]'
                  )}
                >
                  {v.size.label}
                </button>
              ))}
            </div>
            <p className="spec-mono text-[length:--text-micro] text-[--color-ink-subtle]">
              {variant.sku}
            </p>
          </fieldset>

          {/* ---- PURCHASE MODE ---- */}
          <PurchaseMode mode={mode} setMode={setMode} eligible={product.subscriptionEligible} />

          {/* ---- QUANTITY ---- */}
          <div className="flex flex-col gap-3">
            <span className="label-caps text-[--color-ink-muted]">Quantity</span>
            <QuantityControl
              value={quantity}
              onChange={setQuantity}
              min={1}
              max={maxQuantity}
              disabled={!purchasable}
              itemName={product.name}
            />
            {inventory && availableStock(inventory) < 10 && availableStock(inventory) > 0 && (
              // A FACT, not urgency. No "Only 6 left — hurry". [P-07]
              <p className="spec-mono text-[length:--text-micro] text-[--color-ink-subtle]">
                {availableStock(inventory)} in stock
              </p>
            )}
          </div>

          {/* ---- ADD TO CART / BUY NOW ---- */}
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              fullWidth
              disabled={!purchasable}
              onClick={handleAdd}
              aria-live="polite"
            >
              {!purchasable ? 'Sold out' : added ? 'Added to your box' : 'Add to box'}
            </Button>

            {/*
              ⛔ BUY NOW — a PLACEHOLDER, and it says so.
                 It cannot work: there is no cart (Phase 5), no checkout
                 (Phase 6), no M-PESA credentials (D-31/32), and no confirmed
                 answer on whether Stripe can even settle KES (D-35).

                 A "Buy now" button that silently does nothing is worse than one
                 that is honestly disabled — the customer taps it, nothing
                 happens, and they conclude the site is broken. [NN-04]
            */}
            <Button variant="secondary" size="lg" fullWidth disabled>
              Buy now — checkout not yet available
            </Button>

            <p className="spec-mono text-[length:--text-micro] text-[--color-ink-subtle]">
              ⛔ Phase 5/6 · cart and checkout are not built. Nothing is charged.
            </p>
          </div>

          <DeliverySummary />
        </div>
      </div>

      {/* ══════════ DETAIL ══════════ */}
      <section aria-labelledby="detail-heading" className="mt-16 md:mt-24">
        <h2 id="detail-heading" className="sr-only">
          Product detail
        </h2>
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <ProductFacts product={product} />
          <ProductFaq product={product} />
        </div>
      </section>

      {/* ══════════ RELATED ══════════ */}
      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-16 md:mt-24">
          <h2 id="related-heading" className="mb-8 text-[length:--text-h2]">
            The rest of the range.
          </h2>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {related.map((p) => (
              <li key={p.id} className="contents">
                <ProductCard
                  product={p}
                  inventory={relatedInventory.get(p.variants[0].id as string) ?? null}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ══════════ RECENTLY VIEWED ══════════ */}
      {recentProducts.length > 0 && (
        <section aria-labelledby="recent-heading" className="mt-16 md:mt-24">
          <h2 id="recent-heading" className="mb-8 text-[length:--text-h3]">
            Recently viewed
          </h2>
          <ul className="flex flex-wrap gap-3">
            {recentProducts.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/shop/${p.slug}`}
                  className={cn(
                    'flex items-center gap-3 rounded-[--radius-md] border border-[--color-border]',
                    'bg-[--color-surface] p-2 pr-4 no-underline',
                    'hover:border-[--color-border-strong]',
                    'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2',
                    'transition-colors duration-[--duration-fast]'
                  )}
                >
                  <span className="size-12 overflow-hidden rounded-[--radius-sm]">
                    {PRODUCT_SLOTS[p.slug].supplied ? (
                      <Image
                        src={PRODUCT_SLOTS[p.slug].portraitSrc ?? PRODUCT_SLOTS[p.slug].src}
                        alt=""
                        width={96}
                        height={120}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="block size-full bg-[--color-surface-sunken]"
                      />
                    )}
                  </span>
                  <span className="text-[length:--text-small] text-[--color-ink]">{p.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ══════════ MOBILE STICKY BAR ══════════
        ⚠ The brief: "keep critical purchase controls visible on mobile without
          covering content unnecessarily."

          So this is a SINGLE ROW, not a panel — the price and one button. It
          appears only below `md`, and it respects the iOS home indicator and the
          Android gesture bar via `safe-area-inset-bottom`. Without that padding
          the primary CTA sits UNDER the system chrome and a real fraction of
          customers cannot tap it at all.
      */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-[--z-header] md:hidden',
          'border-t border-[--color-border] bg-[--color-surface]',
          'px-4 py-3',
          'pb-[calc(0.75rem+env(safe-area-inset-bottom))]'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <PriceDisplay price={variant.price} size="sm" />
          </div>
          <Button
            disabled={!purchasable}
            onClick={handleAdd}
            aria-live="polite"
            className="shrink-0"
          >
            {!purchasable ? 'Sold out' : added ? 'Added' : 'Add to box'}
          </Button>
        </div>
      </div>

      {/* Clears the sticky bar so it never covers the footer. */}
      <div aria-hidden="true" className="h-24 md:hidden" />
    </main>
  );
}

/* ================================================================== *
 * GALLERY
 * ================================================================== */

function Gallery({ product }: { product: Product }) {
  const slot = PRODUCT_SLOTS[product.slug];
  const [active, setActive] = useState(0);

  // ⛔ No photograph → the honest awaiting-asset panel, not a broken image.
  if (!slot.supplied) {
    return (
      <div className="flex flex-col gap-3">
        <SlotImage slot={slot} priority />
        <p className="spec-mono text-[length:--text-micro] text-[--color-ink-subtle]">
          {slot.blockedBy}
        </p>
      </div>
    );
  }

  const images = product.images;
  const current = images[active] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-[--radius-md]">
        <Image
          src={current.src}
          alt={current.alt}
          width={current.width}
          height={current.height}
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          className="w-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <ul className="flex gap-2">
          {images.map((img, i) => (
            <li key={img.src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1} of ${images.length}`}
                aria-current={i === active ? 'true' : undefined}
                className={cn(
                  'block size-20 overflow-hidden rounded-[--radius-sm] border-2',
                  'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2',
                  'transition-colors duration-[--duration-fast]',
                  i === active ? 'border-[--color-action]' : 'border-transparent'
                )}
              >
                <Image
                  src={img.src}
                  alt=""
                  width={160}
                  height={160}
                  className="size-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/*
        ⚠ A RECORDED DEFECT ON A SUPPLIED IMAGE.
          Today this fires for Pineapple, whose label reads "Gluten Free" while
          the site (and every other bottle) says "Caffeine Free". The image is
          used per client decision — but the discrepancy is stated, not buried.
      */}
      {slot.blockedBy && (
        <p className="spec-mono text-[length:--text-micro] text-[--color-ink-subtle]">
          ⚠ {slot.blockedBy}
        </p>
      )}
    </div>
  );
}

/* ================================================================== *
 * PURCHASE MODE — one-time vs subscription
 * ================================================================== */

function PurchaseMode({
  mode,
  setMode,
  eligible,
}: {
  mode: PurchaseMode;
  setMode: (m: PurchaseMode) => void;
  eligible: boolean;
}) {
  if (!eligible) return null;

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="label-caps mb-1 text-[--color-ink-muted]">How often</legend>

      <div className="flex flex-col gap-2">
        <label
          className={cn(
            'flex min-h-[--touch-min] cursor-pointer items-center gap-3 rounded-[--radius-md]',
            'border p-3 transition-colors duration-[--duration-fast]',
            mode === 'one-time'
              ? 'border-[--color-action] bg-[--color-surface-sunken]'
              : 'border-[--color-border]'
          )}
        >
          <input
            type="radio"
            name="purchase-mode"
            checked={mode === 'one-time'}
            onChange={() => setMode('one-time')}
            className="size-4 accent-[--color-action]"
          />
          <span className="text-[length:--text-small] text-[--color-ink]">Once</span>
        </label>

        {/*
          ⛔ D-09 — SUBSCRIPTION IS DISABLED, AND THE REASON IS STATED.
             M-PESA has no card-on-file equivalent, so a recurring charge cannot
             be taken silently. Four candidate billing models (STK re-prompt /
             Ratiba standing order / card-on-file — but see D-35 / pre-paid
             block) produce four different data models.

             The option is SHOWN so the customer knows it is coming, and
             DISABLED so nobody believes it works. No savings percentage appears,
             because none has been approved — and "Save 0%" is a worse lie than
             saying nothing. [NN-04, NN-05]
        */}
        <div
          className={cn(
            'flex flex-col gap-2 rounded-[--radius-md] border border-dashed',
            'border-[--color-warning] bg-[--color-warning-bg] p-3'
          )}
        >
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="purchase-mode"
              disabled
              checked={false}
              readOnly
              className="size-4"
            />
            <span className="text-[length:--text-small] text-[--color-ink-muted]">
              On a schedule
            </span>
          </div>

          <p className="text-[length:--text-caption] leading-snug text-[--color-ink-muted]">
            Subscriptions are not available yet. M-PESA has no card-on-file equivalent, so the
            billing model has to be settled before we can take a recurring payment.
          </p>

          <ul className="flex flex-wrap gap-2">
            {SUBSCRIPTION_OPTIONS.map((o) => (
              <li
                key={o.id}
                className="spec-mono rounded-[--radius-sm] border border-[--color-border] px-2 py-1 text-[length:--text-micro] text-[--color-ink-subtle]"
              >
                {o.label}
              </li>
            ))}
          </ul>

          <p className="spec-mono text-[length:--text-micro] text-[--color-ink-subtle]">
            ⛔ D-09 · billing model not chosen · no discount approved
          </p>
        </div>
      </div>

      {/* A single honest flag, rather than `disabled` scattered everywhere. */}
      {!SUBSCRIPTIONS_AVAILABLE && <span className="sr-only">Subscriptions are unavailable.</span>}
    </fieldset>
  );
}

/* ================================================================== *
 * DELIVERY SUMMARY
 * ================================================================== */

function DeliverySummary() {
  return (
    <div className="rounded-[--radius-md] border border-dashed border-[--color-warning] bg-[--color-warning-bg] p-4">
      <p className="spec-mono mb-2 text-[length:--text-caption] text-[--color-ink]">
        ⛔ D-21/22/23 · delivery not configured
      </p>
      {/*
        ⚠ NO DELIVERY PROMISE IS INVENTED.
          Not "Free delivery in Nairobi", not "2–3 working days", not a fee.
          None has been supplied. Inventing one invents a commercial promise the
          business has not made — and a delivery promise is the single easiest
          way to turn a happy customer into an angry one. [NN-05]
      */}
      <p className="text-[length:--text-caption] leading-snug text-[--color-ink-muted]">
        Delivery zones, fees and lead times have not been confirmed, so none are shown. We would
        rather tell you nothing than tell you something that turns out to be wrong.
      </p>
    </div>
  );
}

/* ================================================================== *
 * FACTS — ingredients, nutrition, storage, serving
 * ================================================================== */

function ProductFacts({ product }: { product: Product }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h3 className="text-[length:--text-h3]">What is in it</h3>

        {/*
          ⛔ D-05 — INGREDIENTS AND NUTRITION ARE REGULATED FOOD INFORMATION.
             They are not estimated, not approximated, and not copied from a
             comparable product. Getting these wrong is a legal exposure, not a
             content gap. [NN-05, R-02]
        */}
        {isUnavailable(product.ingredients) ? (
          <PendingValue value={product.ingredients} inline={false} />
        ) : (
          <ul className="flex flex-col gap-1">
            {product.ingredients.map((ing) => (
              <li key={ing.name} className="text-[--color-ink-muted]">
                {ing.name}
                {ing.allergen && (
                  <span className="ml-2 spec-mono text-[--color-error]">allergen</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-[length:--text-h3]">Nutrition</h3>
        {isUnavailable(product.nutrition) ? (
          <PendingValue value={product.nutrition} inline={false} />
        ) : (
          <table className="w-full text-left">
            <tbody>
              {product.nutrition.per100ml.map((row) => (
                <tr key={row.nutrient} className="border-b border-[--color-border]">
                  <th scope="row" className="py-2 font-normal text-[--color-ink-muted]">
                    {row.nutrient}
                  </th>
                  <td className="spec-mono py-2 text-right text-[--color-ink]">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-[length:--text-h3]">Keeping it</h3>

        {/*
          ⚠ HANDLING GUIDANCE, NOT A HEALTH CLAIM.
            "Keep refrigerated" is a factual instruction for a live product and
            is safe to state. "Aids digestion" would be a regulated medical
            claim, and appears nowhere in this codebase. [R-02]
        */}
        {isUnavailable(product.storage.refrigeration) ? (
          <PendingValue value={product.storage.refrigeration} inline={false} />
        ) : (
          <p className="measure text-[--color-ink-muted]">{product.storage.refrigeration}</p>
        )}

        <dl className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <dt className="label-caps text-[--color-ink-muted]">Shelf life</dt>
            <dd>
              {isUnavailable(product.storage.shelfLife) ? (
                <PendingValue value={product.storage.shelfLife} />
              ) : (
                <span className="text-[--color-ink-muted]">{product.storage.shelfLife}</span>
              )}
            </dd>
          </div>

          <div className="flex flex-col gap-1">
            <dt className="label-caps text-[--color-ink-muted]">Serving</dt>
            <dd>
              {isUnavailable(product.storage.servingSuggestion) ? (
                <PendingValue value={product.storage.servingSuggestion} />
              ) : (
                <span className="text-[--color-ink-muted]">
                  {product.storage.servingSuggestion}
                </span>
              )}
            </dd>
          </div>

          <div className="flex flex-col gap-1">
            <dt className="label-caps text-[--color-ink-muted]">Fermentation</dt>
            <dd>
              {/*
                ⛔ D-52 — the Brand Book says six days; the Marketing Strategy
                   says fourteen. THE TWO SOURCE DOCUMENTS DISAGREE, so no figure
                   is published. A specific number that is wrong is worse than no
                   number at all.
              */}
              {isUnavailable(product.fermentationDays) ? (
                <PendingValue value={product.fermentationDays} />
              ) : (
                <span className="text-[--color-ink-muted]">
                  {product.fermentationDays} days
                </span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

/* ================================================================== *
 * FAQ
 * ================================================================== */

function ProductFaq({ product }: { product: Product }) {
  // ✅ D-50 answered — the base is Rooibos, and it is named as such.
  const base = isUnavailable(product.base) ? 'Rooibos' : product.base;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-[length:--text-h3]">Questions</h3>

      <Accordion
        items={[
          {
            value: 'caffeine',
            trigger: 'Does it have caffeine?',
            content: (
              <p>
                No. {base} has none to begin with, so none has to be taken out.
                You can drink this in the afternoon and still sleep.
              </p>
            ),
          },
          {
            value: 'live',
            trigger: 'Why does it need refrigerating?',
            content: (
              <p>
                It is a live product — the culture stays active in the bottle. Cold is what keeps
                it in balance. Left warm, it keeps fermenting and the flavour drifts.
              </p>
            ),
          },
          {
            value: 'sediment',
            trigger: 'There is sediment at the bottom.',
            content: (
              <p>
                That is the culture, and it is meant to be there. Turn the bottle over gently
                once before you pour. It is not a fault.
              </p>
            ),
          },
          {
            value: 'ferment',
            trigger: 'How long is it fermented for?',
            content: (
              // ⛔ D-52 — the sources disagree. The FAQ says so, rather than
              //    picking one and hoping.
              <p>
                We are not publishing a figure yet. Our own documents disagree on it, and we
                would rather say nothing than give you a number that turns out to be wrong.
              </p>
            ),
          },
          {
            value: 'delivery',
            trigger: 'How is it delivered?',
            content: (
              // ⛔ D-21/22/23
              <p>
                Delivery zones, fees and lead times are not confirmed yet, so we are not
                promising any. When they are settled, they will be here.
              </p>
            ),
          },
          {
            value: 'damaged',
            trigger: 'What if a bottle arrives damaged?',
            content: (
              /*
               * ⛔ NO RETURNS POLICY HAS BEEN SUPPLIED.
               *
               *   ⚠ This is the one place where inventing text would be actively
               *     dangerous. A returns policy is a LEGAL COMMITMENT — in Kenya
               *     it engages the Consumer Protection Act, and for a perishable
               *     live product the rules on food safety are not the same as for
               *     a t-shirt.
               *
               *   Writing a plausible "30-day returns" line would be drafting a
               *   contract on the client's behalf, and binding them to it. So it
               *   says the truth: the policy does not exist yet. [NN-05, R-02]
               */
              <p>
                A returns and damaged-goods policy has not been written yet, and we are not going
                to invent one — it is a legal commitment, not a piece of copy. Contact us and we
                will put it right.
              </p>
            ),
          },
        ]}
      />

      <p className="spec-mono text-[length:--text-micro] text-[--color-ink-subtle]">
        ⛔ D-52 · ferment duration · ⛔ D-21 · delivery · ⛔ returns policy not written
      </p>
    </div>
  );
}
