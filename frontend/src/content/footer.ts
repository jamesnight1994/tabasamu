/**
 * FOOTER COPY & LINKS — single source of truth
 *
 * Layout reference: docs/design/footer-redesign-implementation.md
 *
 * ⛔ D-47 — no trading address, phone, or email is invented here.
 *    Contact rows use navigation fallbacks or interim routes until supplied.
 *
 * Phase 3 unlock — set these when client confirms:
 *   • `NAV_UTILITY.contact.address` / `addressHref` / `phone` / `phoneHref`
 *   • `FOOTER.email` (public inbox)
 *   • `FOOTER.companyRegistration` (legal bar)
 *   • `NAV_SOCIALS[].href` (live profile URLs)
 */

import { NAV_SOCIALS, NAV_UTILITY } from './navigation';

export const FOOTER = {
  slogan: 'Caffeine-free rooibos kombucha, brewed slowly in Nairobi.',
  /** Interim until a public inbox is supplied (D-47). */
  emailInterim: { label: 'Contact us', href: '/contact' },
  /** Public inbox — footer renders mailto: when set. */
  email: 'owagaantony@gmail.com' as string | null,
  companyName: 'Tabasamu Sips',
  /** Company registration line for legal bar — null until D-47 confirms entity details. */
  companyRegistration: null as string | null,
} as const;

export type FooterContactIcon = 'location' | 'phone' | 'email';

export type FooterContactRow =
  | { readonly kind: 'text'; readonly icon: FooterContactIcon; readonly label: string }
  | {
      readonly kind: 'link';
      readonly icon: FooterContactIcon;
      readonly label: string;
      readonly href: string;
      readonly external?: boolean;
    };

/** Resolved email row — real mailto when `FOOTER.email` is set, else interim contact page. */
export const footerContactEmail = (): { label: string; href: string; external: boolean } => {
  if (FOOTER.email) {
    return { label: FOOTER.email, href: `mailto:${FOOTER.email}`, external: true };
  }
  return {
    label: FOOTER.emailInterim.label,
    href: FOOTER.emailInterim.href,
    external: false,
  };
};

/** Contact rows for footer — prefers supplied D-47 fields over fallbacks. */
export const footerContactRows = (): readonly FooterContactRow[] => {
  const { contact } = NAV_UTILITY;
  const rows: FooterContactRow[] = [];

  if (contact.address) {
    if (contact.addressHref) {
      rows.push({
        kind: 'link',
        icon: 'location',
        label: contact.address,
        href: contact.addressHref,
        external: contact.addressHref.startsWith('http'),
      });
    } else {
      rows.push({ kind: 'text', icon: 'location', label: contact.address });
    }
  } else {
    rows.push({ kind: 'text', icon: 'location', label: contact.locationFallback });
  }

  if (contact.phone && contact.phoneHref) {
    rows.push({
      kind: 'link',
      icon: 'phone',
      label: contact.phone,
      href: contact.phoneHref,
      external: contact.phoneHref.startsWith('http'),
    });
  }

  const email = footerContactEmail();
  rows.push({
    kind: 'link',
    icon: 'email',
    label: email.label,
    href: email.href,
    external: email.external,
  });

  return rows;
};

/** Social profile URLs that are live — for schema `sameAs` when Phase 3 unlocks. */
export const footerSocialUrls = (): readonly string[] =>
  NAV_SOCIALS.flatMap((s) => (s.href ? [s.href] : []));


export const FOOTER_NAV = {
  shop: {
    heading: 'Shop',
    links: [
      { href: '/shop', label: 'All flavours' },
      { href: '/bundles/build-your-own', label: 'Build a Box' },
      { href: '/catalogue', label: 'Catalogue' },
    ],
  },
  discover: {
    heading: 'Discover',
    links: [
      { href: '/about', label: 'About us' },
      { href: '/contact', label: 'Contact' },
    ],
  },
} as const;

export const FOOTER_LEGAL = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/delivery-and-returns', label: 'Delivery & returns' },
  { href: '/cookie-preferences', label: 'Cookie preferences' },
] as const;

/** Flat list of every footer href — for route-integrity tests. */
export const footerAllLinks = (): readonly { href: string; label: string }[] => {
  const contactLinks = footerContactRows().flatMap((row) =>
    row.kind === 'link' && !row.external && !row.href.startsWith('mailto:') && !row.href.startsWith('tel:')
      ? [{ href: row.href, label: row.label }]
      : []
  );

  return [
    ...FOOTER_NAV.shop.links,
    ...FOOTER_NAV.discover.links,
    ...FOOTER_LEGAL,
    ...contactLinks,
  ];
};

/** @deprecated Use FOOTER_NAV — kept for tests migrating from FOOTER_COLUMNS. */
export const FOOTER_COLUMNS = [
  { heading: FOOTER_NAV.shop.heading, links: FOOTER_NAV.shop.links },
  { heading: FOOTER_NAV.discover.heading, links: FOOTER_NAV.discover.links },
  { heading: 'Legal', links: FOOTER_LEGAL },
] as const;
