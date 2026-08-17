'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AdapterProvider } from '../../components/commerce/AdapterProvider';
import { SessionProvider, useSession } from '../../components/commerce/SessionProvider';
import { CartProvider } from '../../components/commerce/CartProvider';
import { getAdapters } from '../../adapters';
import { Button } from '../../components/primitives/Button';
import { NoIndex } from '../../components/seo/NoIndex';
import { Logo } from '../../components/primitives/Logo';

/**
 * ACCOUNT LAYOUT
 *
 * ⚠ THE ROUTE GUARD LIVES HERE, AND IT WAITS FOR THE SERVER.
 *
 *   A guard that reads a client flag can be spoofed and flickers on reload. This
 *   one holds render until `useSession().loading` is false — i.e. until the
 *   server has answered "who are you?" — and only then decides. No protected
 *   content is ever painted for an unauthenticated visitor, and there is no
 *   logged-out flash for an authenticated one. [F-75]
 */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const adapters = useMemo(() => getAdapters(), []);
  return (
    <AdapterProvider adapters={adapters}>
      <NoIndex />
      <SessionProvider>
        {/* CartProvider so "reorder" from an order can fill the cart. */}
        <CartProvider adapters={adapters}>
          <Guarded>{children}</Guarded>
        </CartProvider>
      </SessionProvider>
    </AdapterProvider>
  );
}

const NAV = [
  { href: '/account', label: 'Overview' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/subscriptions', label: 'Subscription' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/preferences', label: 'Preferences' },
];

function Guarded({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, session, signOut } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-pulse rounded-full bg-terracotta/30" />
        <span className="sr-only">Loading your account…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream px-5 text-center">
        <div>
          <h1 className="font-[family-name:var(--font-fraunces)] text-2xl text-charcoal">
            Please sign in
          </h1>
          <p className="mt-2 text-sm text-charcoal/70">
            You need to be signed in to see this page.
          </p>
        </div>
        <Button asChild>
          <Link href="/signin">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-charcoal/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            href="/"
            aria-label="Tabasamu Sips — home"
            className="inline-flex rounded-sm hover:opacity-80 focus-visible:outline-2 focus-visible:outline-forest focus-visible:outline-offset-4"
          >
            {/* Approved full logo on the cream account field. */}
            <Logo variant="full" width={140} decorative clearSpace={0.1} />
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-charcoal/60 sm:inline">
              {session?.displayName}
            </span>
            <button
              onClick={() => {
                void signOut().then(() => router.push('/'));
              }}
              className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.14em] text-charcoal/60 underline underline-offset-4 hover:text-terracotta"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-[180px_1fr]">
          <nav aria-label="Account" className="sm:sticky sm:top-8 sm:self-start">
            <ul className="flex gap-1 overflow-x-auto sm:flex-col sm:overflow-visible">
              {NAV.map((item) => {
                const active =
                  item.href === '/account'
                    ? pathname === '/account'
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href} className="shrink-0">
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={[
                        'block whitespace-nowrap rounded-sm px-3 py-2 text-sm transition-colors',
                        active
                          ? 'bg-forest/[0.08] font-medium text-forest'
                          : 'text-charcoal/70 hover:bg-charcoal/[0.04] hover:text-charcoal',
                      ].join(' ')}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
