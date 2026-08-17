'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { AdapterProvider } from '../../components/commerce/AdapterProvider';
import { SessionProvider } from '../../components/commerce/SessionProvider';
import { getAdapters } from '../../adapters';
import { NoIndex } from '../../components/seo/NoIndex';
import { Logo } from '../../components/primitives/Logo';

/**
 * AUTH LAYOUT
 *
 * A calm, single-column frame for the credential screens. Deliberately sparse —
 * this is not a place to upsell or decorate; the customer came here to do one
 * thing. The brand mark returns them home, and nothing else competes.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const adapters = useMemo(() => getAdapters(), []);

  return (
    <AdapterProvider adapters={adapters}>
      <NoIndex />
      <SessionProvider>
        <div className="flex min-h-screen flex-col bg-cream">
          <header className="px-5 py-6 sm:px-8">
            <Link
              href="/"
              aria-label="Tabasamu Sips — home"
              className="inline-flex rounded-sm transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-forest focus-visible:outline-offset-4"
            >
              {/* Approved full logo on the cream auth field. */}
              <Logo variant="full" width={150} decorative clearSpace={0.12} />
            </Link>
          </header>

          <main className="flex flex-1 items-start justify-center px-5 pb-16 pt-4 sm:items-center sm:pb-24">
            <div className="w-full max-w-md">{children}</div>
          </main>
        </div>
      </SessionProvider>
    </AdapterProvider>
  );
}
