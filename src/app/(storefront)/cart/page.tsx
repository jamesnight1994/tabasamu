'use client';

/**
 * CART PAGE
 *
 * The full-page counterpart to the drawer. Both render the SAME `CartContents`,
 * so the totals, the zone selector and the discount field cannot drift apart —
 * which is exactly how a cart drawer and a cart page normally end up disagreeing
 * about the price.
 */

import Link from 'next/link';
import { useCart } from '../../../components/commerce/CartProvider';
import { CartContents } from '../../../components/commerce/Cart';
import { Button } from '../../../components/primitives/Button';
import { hasZones } from '../../../domain/delivery';
import { useVariantResolver } from '../../../components/commerce/useVariantResolver';
import { NoIndex } from '../../../components/seo/NoIndex';

export default function CartPage() {
  const { isEmpty, hydrating, deliveryConfig } = useCart();
  const resolve = useVariantResolver();

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:px-6 sm:py-16">
      <NoIndex />
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-charcoal sm:text-4xl">
        Your box
      </h1>

      <div className="mt-8">
        <CartContents resolve={resolve} />
      </div>

      {!isEmpty && !hydrating && (
        <div className="mt-10 space-y-3">
          <Button
            size="lg"
            fullWidth
            asChild
            /**
             * ⛔ D-21/22/23 — checkout is BLOCKED while no delivery zone exists.
             *
             *   This is not a bug, and it must not be "fixed" by inventing a zone.
             *   A checkout that cannot quote a delivery fee cannot take a payment
             *   honestly, so it does not take one. [NN-05]
             */
            disabled={!hasZones(deliveryConfig)}
          >
            <Link href="/checkout">Checkout</Link>
          </Button>

          {!hasZones(deliveryConfig) && (
            <p className="text-center text-xs leading-relaxed text-charcoal/60">
              Checkout opens once delivery areas are confirmed.
            </p>
          )}

          <Button variant="ghost" fullWidth asChild>
            <Link href="/shop">Keep looking</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
