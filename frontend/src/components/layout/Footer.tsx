import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';
import { Logo } from '../primitives/Logo';
import { cn } from '../../lib/utils/cn';
import { BRAND_MANTRA } from '../../lib/seo';
import { FOOTER, FOOTER_LEGAL, FOOTER_NAV, footerContactRows, type FooterContactRow } from '../../content/footer';
import { NAV_SOCIALS, NAV_UTILITY, type SocialLink } from '../../content/navigation';

/* ================================================================== *
 * SkipLink
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
 * Footer — two-tier dark layout
 * ================================================================== */

export { FOOTER_COLUMNS } from '../../content/footer';

const SITE_CONTAINER =
  'container mx-auto w-full max-w-[--container-max] px-6 md:px-12 lg:px-16';

const FOOTER_LINK = cn(
  'footer-nav-link inline-flex min-h-[--touch-min] items-center',
  'font-body text-[length:--text-small] font-medium no-underline',
  'focus-visible:outline-2 focus-visible:outline-[--color-focus-inverse] focus-visible:outline-offset-2',
  'rounded-[--radius-sm]'
);

const FOOTER_LEGAL_LINK = cn(
  'footer-legal-link no-underline text-[0.875rem]',
  'focus-visible:outline-2 focus-visible:outline-[--color-focus-inverse] focus-visible:outline-offset-2',
  'rounded-[--radius-sm]'
);

const FOOTER_BRAND_LOGO_SIZE = 28;

const FOOTER_SOCIAL_ACTIVE = cn(
  'footer-social-link inline-flex size-10 items-center justify-center rounded-full',
  'focus-visible:outline-2 focus-visible:outline-[--color-focus-inverse] focus-visible:outline-offset-2'
);

const FOOTER_CONTACT_LINK = cn(
  FOOTER_LINK,
  'footer-contact-link gap-3 transition-[color,transform] duration-[--duration-base]',
  'hover:translate-x-0.5 motion-reduce:hover:translate-x-0'
);

const FOOTER_SOCIAL_DISABLED = cn(
  'footer-social-disabled inline-flex size-10 cursor-not-allowed items-center justify-center rounded-full'
);

function ContactRowIcon({ icon }: { icon: FooterContactRow['icon'] }) {
  const className = 'size-4 shrink-0';
  const stroke = { strokeWidth: 1.75, 'aria-hidden': true as const };

  switch (icon) {
    case 'location':
      return <MapPin className={cn(className, 'mt-0.5')} {...stroke} />;
    case 'phone':
      return <Phone className={className} {...stroke} />;
    case 'email':
      return <Mail className={className} {...stroke} />;
  }
}

function FooterContactRowItem({ row }: { row: FooterContactRow }) {
  if (row.kind === 'text') {
    return (
      <li className="footer-contact-text flex items-start gap-3 text-[length:--text-small]">
        <ContactRowIcon icon={row.icon} />
        <span>{row.label}</span>
      </li>
    );
  }

  const isInternal = row.href.startsWith('/') && !row.external;
  const opensNewTab = row.external && row.href.startsWith('http');
  const linkProps = opensNewTab
    ? { target: '_blank' as const, rel: 'noopener noreferrer' as const }
    : {};

  if (isInternal) {
    return (
      <li>
        <Link href={row.href} className={FOOTER_CONTACT_LINK}>
          <ContactRowIcon icon={row.icon} />
          {row.label}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <a href={row.href} className={FOOTER_CONTACT_LINK} {...linkProps}>
        <ContactRowIcon icon={row.icon} />
        {row.label}
      </a>
    </li>
  );
}

function FooterNavColumn({
  heading,
  links,
}: {
  heading: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <nav aria-label={heading}>
      <h2 className="label-caps mb-4 text-footer-heading">{heading}</h2>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={FOOTER_LINK}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SocialIcon({ platform }: { platform: SocialLink['platform'] }) {
  const className = 'size-[1.125rem] shrink-0';
  switch (platform) {
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            fill="currentColor"
            d="M14 9h3V6h-3a3 3 0 0 0-3 3v2H8v3h3v7h3v-7h2.5l.5-3H14V9z"
          />
        </svg>
      );
    case 'twitter':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            fill="currentColor"
            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          />
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            fill="currentColor"
            d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-5 3.5A5.5 5.5 0 1 1 6.5 13 5.5 5.5 0 0 1 12 7.5zm0 2A3.5 3.5 0 1 0 15.5 13 3.5 3.5 0 0 0 12 9.5zM17.75 6a1.25 1.25 0 1 1-1.25 1.25A1.25 1.25 0 0 1 17.75 6z"
          />
        </svg>
      );
    case 'pinterest':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            fill="currentColor"
            d="M12 2C6.48 2 2 6.48 2 12c0 4.07 2.44 7.56 5.94 9.09-.08-.77-.15-1.95.03-2.79.16-.68 1.06-4.33 1.06-4.33s-.27-.54-.27-1.34c0-1.25.73-2.19 1.63-2.19.77 0 1.14.58 1.14 1.27 0 .77-.49 1.93-.75 3-.21.89.45 1.62 1.34 1.62 1.61 0 2.85-1.7 2.85-4.15 0-2.17-1.56-3.69-3.79-3.69-2.58 0-4.09 1.93-4.09 3.93 0 .77.3 1.6.67 2.05.07.09.08.17.06.26-.06.25-.2.77-.23.88-.04.14-.13.17-.3.1-1.12-.52-1.82-2.15-1.82-3.47 0-2.82 2.05-5.41 5.91-5.41 3.1 0 5.52 2.21 5.52 5.17 0 3.08-1.94 5.56-4.63 5.56-.9 0-1.75-.47-2.04-1.03l-.55 2.11c-.2.77-.74 1.73-1.1 2.32.83.26 1.71.4 2.62.4 5.52 0 10-4.48 10-10S17.52 2 12 2z"
          />
        </svg>
      );
  }
}

function FooterContact() {
  const rows = footerContactRows();

  return (
    <div className="flex w-fit max-w-full flex-col gap-5">
      <h2 className="label-caps text-footer-heading">Contact</h2>

      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <FooterContactRowItem key={`${row.icon}-${row.label}`} row={row} />
        ))}
      </ul>

      <div className="flex flex-wrap gap-2 pt-1">
        {NAV_SOCIALS.map((social) =>
          social.href ? (
            <a
              key={social.platform}
              href={social.href}
              aria-label={social.label}
              className={FOOTER_SOCIAL_ACTIVE}
              target="_blank"
              rel="noopener noreferrer"
            >
              <SocialIcon platform={social.platform} />
            </a>
          ) : (
            <span
              key={social.platform}
              aria-disabled="true"
              title="Not yet linked"
              className={FOOTER_SOCIAL_DISABLED}
            >
              <SocialIcon platform={social.platform} />
              <span className="sr-only">{social.label} (not yet linked)</span>
            </span>
          )
        )}
      </div>
    </div>
  );
}

function FooterBrand({ showMantra }: { showMantra: boolean }) {
  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/"
        className={cn(
          'footer-brand-link inline-flex w-fit items-center gap-3 no-underline',
          'focus-visible:outline-2 focus-visible:outline-[--color-focus-inverse] focus-visible:outline-offset-4'
        )}
        aria-label="Tabasamu Sips — home"
      >
        <Logo
          variant="monogram"
          tone="dark"
          width={FOOTER_BRAND_LOGO_SIZE}
          decorative
          clearSpace={0}
        />
        <span
          className="font-display font-normal leading-none text-white"
          style={{ fontSize: FOOTER_BRAND_LOGO_SIZE }}
        >
          {FOOTER.companyName}
        </span>
      </Link>

      <p className="pl-12 max-w-xs text-[length:--text-body-lg] leading-[--leading-body] text-footer-link">
        {FOOTER.slogan}
      </p>

      {showMantra && (
        <p className="mantra max-w-xs text-[length:--text-h4] text-[--color-ink-inverse]">{BRAND_MANTRA}</p>
      )}
    </div>
  );
}

function FooterLegalBar() {
  const year = new Date().getFullYear();

  return (
    <div
      className={cn(
        'flex flex-col gap-4 text-[length:--text-micro] md:flex-row md:items-center md:justify-between'
      )}
    >
      <p className="text-footer-muted text-[0.875rem]">
        © {year} {FOOTER.companyName}
        {FOOTER.companyRegistration ? ` · ${FOOTER.companyRegistration}` : ''} ·{' '}
        {NAV_UTILITY.contact.locationFallback}
      </p>

      <nav aria-label="Legal">
        <ul className="flex flex-wrap gap-x-1 gap-y-2 md:justify-end">
          {FOOTER_LEGAL.map((link, i) => (
            <li key={link.href} className="inline-flex items-center">
              {i > 0 && (
                <span aria-hidden className="px-2 text-footer-muted">
                  ·
                </span>
              )}
              <Link href={link.href} className={FOOTER_LEGAL_LINK}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export interface FooterProps {
  /**
   * Brand Book: the mantra appears once per page maximum.
   * The homepage suppresses this when Origin (or another section) owns it.
   */
  showMantra?: boolean;
}

export function Footer({ showMantra = true }: FooterProps) {
  return (
    <footer className="mt-0">
      <div className="bg-footer-dark py-16 md:py-20 lg:pt-20" data-ground="dark">
        <div className={SITE_CONTAINER}>
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-12">
            <div className="sm:col-span-2 lg:col-span-4">
              <FooterBrand showMantra={showMantra} />
            </div>

            <div className="lg:col-span-2">
              <FooterNavColumn heading={FOOTER_NAV.shop.heading} links={FOOTER_NAV.shop.links} />
            </div>

            <div className="lg:col-span-2">
              <FooterNavColumn heading={FOOTER_NAV.discover.heading} links={FOOTER_NAV.discover.links} />
            </div>

            <div className="sm:col-span-2 lg:col-span-4 lg:col-start-9 lg:flex lg:justify-end lg:pr-12">
              <FooterContact />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/8 bg-footer-bar py-5 md:py-6" data-ground="dark">
        <div className={SITE_CONTAINER}>
          <FooterLegalBar />
        </div>
      </div>
    </footer>
  );
}

/* ================================================================== *
 * MobileActionBar
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
