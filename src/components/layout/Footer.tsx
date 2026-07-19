import Link from 'next/link';
import { Logo } from '../primitives/Logo';
import { cn } from '../../lib/utils/cn';
import { BRAND_MANTRA } from '../../lib/seo';

/* ================================================================== *
 * SkipLink
 *
 * The first focusable element on the page. Invisible until focused.
 * Without it, a keyboard user tabs through the entire header on every page.
 * WCAG 2.4.1.
 * ================================================================== */

export function SkipLink() {
  return (
    <a
      href="#main"
      className={cn(
        'sr-only focus:not-sr-only',
        'focus:fixed focus:left-4 focus:top-4 focus:z-[--z-skip-link]',
        'focus:rounded-[--radius-md] focus:border focus:border-[--color-border]',
        'focus:bg-[--color-action] focus:px-4 focus:py-3',
        'focus:font-body focus:text-[length:--text-small] focus:text-[--color-action-fg]',
        'focus:no-underline'
      )}
    >
      Skip to content
    </a>
  );
}

/* ================================================================== *
 * AnnouncementStrip
 *
 * ⚠ P-07 — THIS IS NOT A PROMOTIONAL BANNER.
 *
 *   It carries ONE calm, factual line. It has no countdown, no timer, no
 *   "SHOP NOW", no exclamation mark, and no urgency of any kind. If a
 *   stakeholder asks for a countdown here, the answer in the Brand Book is
 *   already written: the voice is "someone already at ease".
 *
 *   It is DISMISSIBLE and it does not reappear. A strip you cannot close is
 *   an ad.
 * ================================================================== */

export function AnnouncementStrip({
  message,
  href,
  linkLabel,
}: {
  message: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div
      className={cn(
        'w-full border-b border-[--color-border]',
        // Forest ground, cream text — 6.0:1.
        'bg-[--color-link] text-[--color-ink-inverse]'
      )}
      data-ground="dark"
    >
      <p
        className={cn(
          'mx-auto flex max-w-[--container-max] items-center justify-center gap-2',
          'px-4 py-2 text-center',
          'font-body text-[length:--text-caption]'
        )}
      >
        {message}
        {href && linkLabel && (
          <Link
            href={href}
            className="text-[--color-ink-inverse] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-[--color-focus-inverse]"
          >
            {linkLabel}
          </Link>
        )}
      </p>
    </div>
  );
}

/* ================================================================== *
 * Footer
 *
 * ⛔ Contact details (D-47), stockists (D-10) and all legal copy are NOT
 *    supplied. Those links point at pages that will themselves declare the
 *    gap. No address, phone or email is invented here. [NN-05]
 * ================================================================== */

export const FOOTER_COLUMNS = [
  {
    heading: 'Shop',
    links: [
      { href: '/shop', label: 'All flavours' },
      { href: '/bundles/build-your-own', label: 'Build a Box' },
    ],
  },
  {
    heading: 'Discover',
    links: [
      { href: '/our-story', label: 'Our Story' },
      { href: '/ingredients', label: 'Ingredients' },
      { href: '/stockists', label: 'Stockists' },
    ],
  },
  {
    heading: 'Business',
    links: [
      { href: '/wholesale', label: 'Wholesale' },
      { href: '/corporate', label: 'Corporate orders' },
      { href: '/contact', label: 'Contact' },
      { href: '/faqs', label: 'FAQs' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: '/delivery-and-returns', label: 'Delivery & returns' },
      { href: '/cookie-preferences', label: 'Cookie preferences' },
      { href: '/accessibility', label: 'Accessibility' },
    ],
  },
] as const;

export interface FooterProps {
  /**
   * ⚠ Brand Book: the mantra appears "once per page, maximum".
   *
   *   The homepage's Origin section already renders it, so the Footer must NOT
   *   render it a second time on that route. Any page that shows the mantra
   *   elsewhere passes `showMantra={false}`.
   */
  showMantra?: boolean;
}

export function Footer({ showMantra = true }: FooterProps) {
  return (
    <footer className="mt-24 border-t border-[--color-border] bg-[--color-canvas]">
      <div className="mx-auto max-w-[--container-max] px-4 py-16 md:px-8">
        {/*
          The mantra. Fraunces italic, forest green.
          Brand Book: "Once per page, maximum." It lives here, so no other
          component on a given page should also render it.
        */}
        {showMantra && (
          <p className="mantra measure-narrow mb-12 text-[length:--text-h4]">{BRAND_MANTRA}</p>
        )}

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          {FOOTER_COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 className="label-caps mb-4 text-[--color-ink-muted]">{col.heading}</h2>
              <ul className="flex flex-col gap-1">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        'inline-flex min-h-[--touch-min] items-center',
                        'font-body text-[length:--text-small] text-[--color-ink]',
                        'no-underline hover:text-[--color-link] hover:underline',
                        'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2',
                        'rounded-[--radius-sm]'
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div
          className={cn(
            'mt-16 flex flex-col gap-6 border-t border-[--color-border] pt-8',
            'md:flex-row md:items-end md:justify-between'
          )}
        >
          <Logo variant="full" width={170} decorative clearSpace={0.18} />

          <div className="flex flex-col gap-1 text-[length:--text-caption] text-[--color-ink-muted]">
            <p>Brewed in Nairobi, Kenya.</p>
            {/*
              ⛔ D-47 — no trading address, phone or email has been supplied.
                 A company registration line will be added when it exists.
                 It is not invented here.
            */}
            <p className="font-mono text-[length:--text-micro]">
              © {new Date().getFullYear()} Tabasamu Sips
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ================================================================== *
 * MobileActionBar
 *
 * The persistent bottom action area on phones — the PDP add-to-cart, the
 * checkout CTA.
 *
 * ⚠ It respects `env(safe-area-inset-bottom)`. Without that, the primary CTA
 *   sits under the iOS home indicator and the Android gesture bar, and a real
 *   fraction of customers simply cannot tap it.
 *
 * ⚠ Pages that use this must add matching bottom padding, or the bar covers
 *   the last element of the page. `MobileActionBarSpacer` does that.
 * ================================================================== */

export function MobileActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-[--z-mobile-bar] lg:hidden',
        'border-t border-[--color-border] bg-[--color-surface]',
        'px-4 pt-3',
        'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
        'shadow-[0_-2px_8px_rgb(45_45_45_/_0.06)]'
      )}
    >
      {children}
    </div>
  );
}

export function MobileActionBarSpacer() {
  return <div aria-hidden="true" className="h-24 lg:hidden" />;
}
