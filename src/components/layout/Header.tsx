'use client';

/**
 * SITE HEADER
 *
 * ⚠ THE HEADER IS A SOLID CREAM BAND. It is NEVER transparent over a
 *   photograph, and it never becomes so on scroll.
 *
 *   This is not a style preference. Brand Book §02 forbids the mark on a busy
 *   or image field — "the mark must always have a calm, single-tone field."
 *   A transparent header over a hero image would place the logo on a
 *   photograph on every single page. The constraint therefore decides the
 *   architecture, not the other way round.
 *
 * ⚠ MOBILE LOGO: the full logo has a 120px digital minimum (Brand Book §02).
 *   At 360px, a 120px full logo plus a cart control plus a menu control does
 *   not fit with adequate touch targets. So on mobile the header uses the
 *   approved coloured MONOGRAM (40px minimum) on the cream band, switching to
 *   the approved full logo from the `md` breakpoint upward.
 *
 * ⚠ N-02/N-03 — text-only navigation. No icon-only nav items. An icon without
 *   a label is a guess, and this audience is not a Silicon Valley power user.
 *   The cart and menu controls carry visible text.
 */

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '../primitives/Logo';
import { Drawer } from '../primitives/Overlay';
import { cn } from '../../lib/utils/cn';
import { isEnabled } from '../../lib/flags';

/** Four primary items. Wholesale, Corporate, FAQs, Contact live in the footer. */
export const PRIMARY_NAV = [
  { href: '/shop', label: 'Shop' },
  { href: '/our-story', label: 'Our Story' },
  { href: '/ingredients', label: 'Ingredients' },
  { href: '/stockists', label: 'Stockists', flag: 'stockists' as const },
] as const;

export interface HeaderProps {
  cartCount?: number;
  onCartClick?: () => void;
}

export function Header({ cartCount = 0, onCartClick }: HeaderProps) {
  const [navOpen, setNavOpen] = useState(false);

  const visibleNav = PRIMARY_NAV.filter((item) => !('flag' in item) || isEnabled(item.flag));

  const navLink = cn(
    'inline-flex items-center min-h-[--touch-min] px-3',
    'font-body text-[length:--text-small] text-[--color-ink]',
    'no-underline hover:text-[--color-link]',
    'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2',
    'rounded-[--radius-sm] transition-colors duration-[--duration-fast]'
  );

  const control = cn(
    'inline-flex items-center gap-1.5 min-h-[--touch-min] px-3',
    'font-body text-[length:--text-small] text-[--color-ink] cursor-pointer',
    'rounded-[--radius-md] hover:bg-[--color-surface-sunken]',
    'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2',
    'transition-colors duration-[--duration-fast]'
  );

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-[--z-header]',
          // ⚠ SOLID. Opaque. Always. See the note above.
          'bg-[--color-canvas]',
          'border-b border-[--color-border]'
        )}
      >
        <div
          className={cn(
            'mx-auto flex items-center justify-between gap-4',
            'h-[--header-height] max-w-[--container-max]',
            'px-4 md:px-8'
          )}
        >
          {/* --- logo --- */}
          <Link
            href="/"
            aria-label="Tabasamu Sips — home"
            className="shrink-0 rounded-[--radius-sm] focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-4"
          >
            {/* Monogram below md (40px min); full logo from md (120px min).
                The wrapping <Link> already gives ≥44px touch target and the
                header flex `gap` guarantees separation, so the logo's own
                clear-space wrapper is dialled down here to avoid a bulky band. */}
            <span className="md:hidden">
              <Logo variant="monogram" width={40} priority decorative clearSpace={0.1} />
            </span>
            <span className="hidden md:block">
              <Logo variant="full" width={150} priority decorative clearSpace={0.12} />
            </span>
          </Link>

          {/* --- desktop nav --- */}
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {visibleNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={navLink}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* --- controls --- */}
          <div className="flex shrink-0 items-center gap-1">
            {/* Account — links to the self-service area. The account layout's
                own guard decides sign-in vs dashboard, so this is a plain link. */}
            <Link href="/account" className={control}>
              Account
            </Link>
            <button type="button" onClick={onCartClick} className={control}>
              Cart
              {cartCount > 0 && (
                <span
                  className={cn(
                    'grid min-w-5 place-items-center rounded-[--radius-pill] px-1.5',
                    'bg-[--color-action] font-mono text-[length:--text-micro] text-[--color-action-fg]'
                  )}
                >
                  {cartCount}
                </span>
              )}
              <span className="sr-only">
                {cartCount === 0
                  ? ', empty'
                  : `, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-expanded={navOpen}
              aria-controls="mobile-nav"
              className={cn(control, 'lg:hidden')}
            >
              Menu
            </button>
          </div>
        </div>
      </header>

      {/* --- mobile nav drawer --- */}
      <Drawer open={navOpen} onOpenChange={setNavOpen} title="Menu" side="right">
        <nav aria-label="Mobile" id="mobile-nav">
          <ul className="flex flex-col">
            {visibleNav.map((item) => (
              <li key={item.href} className="border-b border-[--color-border]">
                <Link
                  href={item.href}
                  onClick={() => setNavOpen(false)}
                  className={cn(
                    'flex min-h-[--touch-comfortable] items-center py-4',
                    // Fraunces here: the drawer is an editorial surface, not a toolbar.
                    'font-display text-[length:--text-h4] text-[--color-ink] no-underline',
                    'hover:text-[--color-link]',
                    'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-[-2px]'
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Drawer>
    </>
  );
}
