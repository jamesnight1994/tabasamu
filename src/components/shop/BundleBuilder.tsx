'use client';

/**
 * BUNDLE BUILDER
 *
 * ═══════════════════════════════════════════════════════════════════
 * ⛔ THE CENTRAL FACT ABOUT THIS COMPONENT.
 *
 *   D-06 — the required bottle count — IS NOT ANSWERED. Neither is the bundle
 *   price (D-14) or the discount.
 *
 *   The client's instruction was explicit:
 *     "Do not assume bundle sizes or discounts. Keep them configuration-driven."
 *
 *   So this builder REFUSES TO VALIDATE. `validateBundle` returns
 *   `unknown-requirement`, and the UI says so plainly.
 *
 *   ⚠ WHY THAT IS THE RIGHT BEHAVIOUR, AND NOT A COP-OUT.
 *
 *     Assuming six would produce a builder that LOOKS finished: it would count
 *     to six, go green, and let a customer configure a box the business never
 *     agreed to sell — at a price nobody approved, with a discount that does not
 *     exist. That bug is invisible in a screenshot and expensive in production.
 *
 *     Everything else is built and working: the quantity controls, the inventory
 *     ceilings, the live progress, the running summary, the sticky mobile bar.
 *     The ONE thing it cannot do is tell the customer they are finished —
 *     because nobody has said what finished means.
 *
 *     Set `requiredBottles` to a number in the fixture and every one of those
 *     pieces starts working. That is the whole change.
 * ═══════════════════════════════════════════════════════════════════
 */

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '../primitives/Button';
import { QuantityControl } from '../primitives/Form';
import { FlavourSwatch, PriceDisplay } from '../commerce/Price';
import { PRODUCT_SLOTS } from '../../content/image-slots';
import {
  type Bundle,
  type BundleItem,
  type Product,
  type Inventory,
  validateBundle,
  bundleSelectionCount,
  setBundleQuantity,
  availableStock,
  isPurchasable,
  isUnavailable,
} from '../../domain/catalogue';
import { cn } from '../../lib/utils/cn';

export interface BundleBuilderProps {
  bundle: Bundle;
  products: readonly Product[];
  inventory: ReadonlyMap<string, Inventory>;
}

export function BundleBuilder({ bundle, products, inventory }: BundleBuilderProps) {
  /** The preset seeds its own contents; build-your-own starts empty. */
  const [selection, setSelection] = useState<readonly BundleItem[]>(bundle.items);

  const validity = validateBundle(bundle, selection, inventory);
  const selected = bundleSelectionCount(selection);

  // ⛔ D-06. `null` when the requirement is unknown — NOT a default of 6.
  const required = isUnavailable(bundle.requiredBottles) ? null : bundle.requiredBottles;

  const quantityFor = (p: Product): number =>
    selection.find((i) => i.variantId === p.variants[0].id)?.quantity ?? 0;

  const setQuantity = (p: Product, q: number) => {
    setSelection((prev) => setBundleQuantity(prev, p.id, p.variants[0].id, q));
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:gap-12">
      {/* ══════════ FLAVOUR PICKER ══════════ */}
      <div className="flex flex-col gap-6">
        <ul className="flex flex-col gap-4">
          {products.map((p) => {
            const inv = inventory.get(p.variants[0].id as string) ?? null;
            const free = inv ? availableStock(inv) : 0;
            const buyable = inv ? isPurchasable(inv) : false;
            const slot = PRODUCT_SLOTS[p.slug];
            const qty = quantityFor(p);

            return (
              <li
                key={p.id}
                className={cn(
                  'flex items-center gap-4 rounded-[--radius-lg] border p-3',
                  'transition-colors duration-[--duration-fast]',
                  qty > 0
                    ? 'border-[--color-action] bg-[--color-surface-sunken]'
                    : 'border-[--color-border] bg-[--color-surface]'
                )}
              >
                <span className="size-16 shrink-0 overflow-hidden rounded-[--radius-sm]">
                  {slot.supplied ? (
                    <Image
                      src={slot.portraitSrc ?? slot.src}
                      alt=""
                      width={128}
                      height={160}
                      className="size-full object-cover"
                    />
                  ) : (
                    // ⛔ Beetroot / Gooseberry — no usable photograph. An honest
                    //    placeholder, not a broken image. The product is still
                    //    fully selectable.
                    <span
                      aria-hidden="true"
                      className="grid size-full place-items-center border border-dashed border-[--color-warning] bg-[--color-warning-bg]"
                    >
                      <span className="spec-mono text-[length:--text-micro] text-[--color-ink-subtle]">
                        n/a
                      </span>
                    </span>
                  )}
                </span>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <FlavourSwatch strip={p.strip} size="sm" />
                  <p className="text-[length:--text-body] text-[--color-ink]">{p.name}</p>
                  <p className="spec-mono text-[length:--text-micro] text-[--color-ink-subtle]">
                    {buyable ? `${free} in stock` : 'Sold out'}
                  </p>
                </div>

                {/*
                  ⚠ THE CEILING IS THE REAL STOCK. A customer cannot select 12
                    when 6 exist — that failure belongs here, as a nudge, not at
                    checkout as a rejected payment.
                */}
                <QuantityControl
                  value={qty}
                  onChange={(q) => setQuantity(p, q)}
                  min={0}
                  max={Math.max(0, free)}
                  disabled={!buyable}
                  itemName={p.name}
                />
              </li>
            );
          })}
        </ul>
      </div>

      {/* ══════════ SUMMARY ══════════ */}
      <aside
        aria-label="Your box"
        className="lg:sticky lg:top-24 lg:self-start"
      >
        <div className="flex flex-col gap-5 rounded-[--radius-lg] border border-[--color-border] bg-[--color-surface] p-5">
          <h2 className="text-[length:--text-h4]">Your box</h2>

          <BundleProgress selected={selected} required={required} />

          {selection.length === 0 ? (
            <p className="text-[length:--text-small] text-[--color-ink-muted]">
              Nothing chosen yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-2 border-y border-[--color-border] py-3">
              {selection.map((item) => {
                const p = products.find((x) => x.id === item.productId);
                if (!p) return null;
                return (
                  <li
                    key={item.variantId as string}
                    className="flex items-center justify-between gap-2 text-[length:--text-small]"
                  >
                    <span className="min-w-0 truncate text-[--color-ink-muted]">{p.name}</span>
                    <span className="spec-mono shrink-0 text-[--color-ink]">×{item.quantity}</span>
                  </li>
                );
              })}
            </ul>
          )}

          {/*
            ⛔ D-14 / D-06 — NO BUNDLE PRICE.
               And note what is NOT done here: the price is not computed as the
               sum of the parts. A bundle that costs exactly the sum of its parts
               is not a bundle — presenting one would imply a saving that does
               not exist. [NN-05]
          */}
          <div className="flex flex-col gap-2">
            <span className="label-caps text-[--color-ink-muted]">Price</span>
            <PriceDisplay price={bundle.price} size="md" />
          </div>

          <BundleValidityMessage validity={validity} products={products} />

          <Button fullWidth disabled>
            {/*
              ⚠ PERMANENTLY DISABLED UNTIL D-06 LANDS. It cannot be otherwise:
                without a bottle count there is no such thing as a complete box,
                and without a price there is nothing to charge.
            */}
            Add box to cart
          </Button>

          <p className="spec-mono text-[length:--text-micro] text-[--color-ink-subtle]">
            ⛔ D-06 · box size not confirmed · ⛔ D-14 · no approved price
          </p>
        </div>
      </aside>

      {/* ══════════ MOBILE STICKY SUMMARY ══════════
        A single row — count and CTA. Respects the iOS home indicator and the
        Android gesture bar, or the button sits under the system chrome and
        cannot be tapped at all.
      */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-[--z-header] lg:hidden',
          'border-t border-[--color-border] bg-[--color-surface]',
          'px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]'
        )}
      >
        <div className="flex items-center gap-3">
          <p aria-live="polite" className="min-w-0 flex-1 text-[length:--text-small]">
            <span className="spec-mono text-[--color-ink]">{selected}</span>{' '}
            <span className="text-[--color-ink-muted]">
              {required === null ? 'selected' : `of ${required}`}
            </span>
          </p>
          <Button disabled className="shrink-0">
            Add box
          </Button>
        </div>
      </div>

      <div aria-hidden="true" className="h-24 lg:hidden" />
    </div>
  );
}

/* ================================================================== *
 * PROGRESS
 * ================================================================== */

function BundleProgress({
  selected,
  required,
}: {
  selected: number;
  required: number | null;
}) {
  /**
   * ⛔ D-06 — WITHOUT A TARGET THERE IS NO PROGRESS BAR.
   *
   *   A bar with no denominator is meaningless. Rendering one anyway — filling
   *   toward an invented "6" — would be the exact failure this whole codebase
   *   is built to avoid: a UI that looks complete and is quietly lying.
   *
   *   So the count is shown as a bare fact, and the missing target is stated.
   */
  if (required === null) {
    return (
      <div className="flex flex-col gap-2 rounded-[--radius-md] border border-dashed border-[--color-warning] bg-[--color-warning-bg] p-3">
        <p className="text-[length:--text-small] text-[--color-ink]">
          <span className="spec-mono">{selected}</span>{' '}
          {selected === 1 ? 'bottle' : 'bottles'} chosen
        </p>
        <p className="text-[length:--text-caption] leading-snug text-[--color-ink-muted]">
          We cannot tell you when the box is full — how many bottles a box holds has not been
          confirmed. No number is assumed.
        </p>
      </div>
    );
  }

  const pct = Math.min(100, (selected / required) * 100);

  return (
    <div className="flex flex-col gap-2">
      <p aria-live="polite" className="text-[length:--text-small] text-[--color-ink-muted]">
        <span className="spec-mono text-[--color-ink]">{selected}</span> of{' '}
        <span className="spec-mono text-[--color-ink]">{required}</span> bottles
      </p>
      <div
        role="progressbar"
        aria-valuenow={selected}
        aria-valuemin={0}
        aria-valuemax={required}
        aria-label="Bottles chosen"
        className="h-1 overflow-hidden rounded-full bg-[--color-surface-sunken]"
      >
        <div
          className="h-full bg-[--color-action] transition-[width] duration-[--duration-base]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ================================================================== *
 * VALIDITY
 * ================================================================== */

function BundleValidityMessage({
  validity,
  products,
}: {
  validity: ReturnType<typeof validateBundle>;
  products: readonly Product[];
}) {
  switch (validity.kind) {
    case 'unknown-requirement':
      // ⛔ D-06 — already stated by BundleProgress. Not repeated.
      return null;

    case 'exceeds-stock': {
      const p = products.find((x) => x.id === validity.productId);
      /*
       * ⚠ PHRASING MATTERS HERE, and the brand lint was right to catch the
       *   first draft.
       *
       *   "Only 6 left" is TRUE — and it is still the vocabulary of a countdown
       *   timer. P-07 forbids urgency architecture, and the Brand Book's voice
       *   is "someone already at ease". A scarcity construction borrows pressure
       *   it has not earned, even when the number behind it is honest.
       *
       *   So: state the stock as a flat fact. Same information, no push.
       */
      return (
        <p role="alert" className="text-[length:--text-caption] text-[--color-error]">
          {p?.name ?? 'That flavour'} — {validity.available} in stock.
        </p>
      );
    }

    case 'incomplete':
      return (
        <p className="text-[length:--text-caption] text-[--color-ink-muted]">
          {validity.required - validity.selected} more to go.
        </p>
      );

    case 'over':
      return (
        <p role="alert" className="text-[length:--text-caption] text-[--color-error]">
          {validity.selected - validity.required} too many.
        </p>
      );

    case 'valid':
      return (
        <p className="text-[length:--text-caption] text-[--color-link]">Your box is complete.</p>
      );
  }
}
