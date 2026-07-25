'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '../../components/layout/Header';
import { Footer, SkipLink } from '../../components/layout/Footer';
import { ToastProvider } from '../../components/primitives/Overlay';
import { AdapterProvider } from '../../components/commerce/AdapterProvider';
import { ConsentProvider } from '../../components/analytics/ConsentProvider';
import { CartProvider } from '../../components/commerce/CartProvider';
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
 *   CartProvider stays so PDP / shop flows that still call `useCart()` keep
 *   working; header entry points (Account, Cart drawer) are intentionally gone
 *   while the storefront is design-led.
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

function StorefrontChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  /**
   * ⚠ Brand Book: the mantra appears "once per page, maximum".
   *   The homepage's Origin section renders it, so the Footer suppresses its own
   *   copy on `/`. Everywhere else the Footer carries it.
   */
  const homepageOwnsTheMantra = pathname === '/';

  return (
    <>
      <SkipLink />
      <Header />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <Footer showMantra={!homepageOwnsTheMantra} />
    </>
  );
}
