'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Header } from '../../components/layout/Header';
import { Footer, SkipLink } from '../../components/layout/Footer';
import { Drawer, ToastProvider } from '../../components/primitives/Overlay';
import { Button } from '../../components/primitives/Button';
import { AdapterProvider } from '../../components/commerce/AdapterProvider';
import { ConsentProvider } from '../../components/analytics/ConsentProvider';
import { CartProvider, useCart } from '../../components/commerce/CartProvider';
import { CartContents } from '../../components/commerce/Cart';
import { useVariantResolver } from '../../components/commerce/useVariantResolver';
import { hasZones } from '../../domain/delivery';
import { getAdapters } from '../../adapters';

/**
 * PUBLIC STOREFRONT LAYOUT
 *
 * ⚠ THE COMPOSITION ROOT. This is the ONE file permitted to call `getAdapters()`.
 *
 *   Everything below it receives the `Adapters` PORT through context and has
 *   never heard of `createMockAdapters`. That is what makes the Gate G2 handover
 *   a one-line environment change (`NEXT_PUBLIC_ADAPTERS=mock → http`) rather
 *   than a rewrite of the component tree. The boundary lint fails the build if
 *   any component tries to shortcut it. [R-13, NN-06]
 *
 * ⚠ THE CART DRAWER IS NO LONGER A SHELL. It is now the real cart, and it shares
 *   `CartContents` with `/cart` — so the drawer and the page cannot drift apart
 *   and start disagreeing about the total, which is the classic way that bug
 *   arrives.
 */
export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  // ⚠ Memoised. `getAdapters()` is cached internally, but re-invoking it every
  //   render would still churn the context value and re-render the whole tree.
  const adapters = useMemo(() => getAdapters(), []);

  return (
    <ToastProvider>
      <ConsentProvider>
        <AdapterProvider adapters={adapters}>
          <CartProvider adapters={adapters}>
            <StorefrontChrome>{children}</StorefrontChrome>
          </CartProvider>
        </AdapterProvider>
      </ConsentProvider>
    </ToastProvider>
  );
}

/**
 * ⚠ SPLIT OUT DELIBERATELY. The chrome needs `useCart()` for the header badge and
 *   the drawer, and a hook cannot be called in the same component that renders
 *   the provider supplying it.
 */
function StorefrontChrome({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const pathname = usePathname();
  const { itemCount, isEmpty, deliveryConfig } = useCart();
  const resolve = useVariantResolver();

  /**
   * ⚠ Brand Book: the mantra appears "once per page, maximum".
   *   The homepage's Origin section renders it, so the Footer suppresses its own
   *   copy on `/`. Everywhere else the Footer carries it.
   */
  const homepageOwnsTheMantra = pathname === '/';

  return (
    <>
      <SkipLink />

      {/* ⚠ The badge is LIVE and survives a reload — the cart is restored from
          storage before this first paints. */}
      <Header cartCount={itemCount} onCartClick={() => setCartOpen(true)} />

      <main id="main" className="min-h-[60vh]">
        {children}
      </main>

      <Footer showMantra={!homepageOwnsTheMantra} />

      <Drawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        title="Your box"
        side="right"
        footer={
          isEmpty ? undefined : (
            <div className="space-y-2">
              <Button
                fullWidth
                asChild
                /**
                 * ⛔ D-21/22/23 — checkout stays CLOSED until a delivery zone
                 *    exists. A checkout that cannot quote a delivery fee cannot
                 *    take a payment honestly, so it does not take one. [NN-05]
                 */
                disabled={!hasZones(deliveryConfig)}
                onClick={() => setCartOpen(false)}
              >
                <Link href="/checkout">Checkout</Link>
              </Button>

              <Button variant="ghost" fullWidth asChild onClick={() => setCartOpen(false)}>
                <Link href="/cart">View your box</Link>
              </Button>

              {!hasZones(deliveryConfig) && (
                <p className="pt-1 text-center text-xs leading-relaxed text-charcoal/60">
                  Checkout opens once delivery areas are confirmed.
                </p>
              )}
            </div>
          )
        }
      >
        <CartContents resolve={resolve} onClose={() => setCartOpen(false)} />
      </Drawer>
    </>
  );
}
