/**
 * SITE NAVIGATION — menu, utility bar, and socials.
 *
 * Structured as plain data so the Navbar (and any future mega-menu) can stay
 * presentational. Contact phone / street address and live social URLs are
 * intentionally unset until D-47 / brand socials are supplied [NN-05].
 */

export type NavFlag = 'stockists' | 'siteSearch' | 'buildABox';

export interface NavChild {
  readonly href: string;
  readonly label: string;
  readonly flag?: NavFlag;
}

export interface NavEntry {
  readonly href: string;
  readonly label: string;
  readonly hasDropdown?: boolean;
  readonly flag?: NavFlag;
  readonly children?: readonly NavChild[];
}

export interface SocialLink {
  readonly platform: 'facebook' | 'twitter' | 'instagram' | 'pinterest';
  readonly label: string;
  /** Empty until a real handle is supplied. Icons still render for layout. */
  readonly href: string | null;
}

export interface UtilityContact {
  readonly address: string | null;
  readonly addressHref: string | null;
  readonly phone: string | null;
  readonly phoneHref: string | null;
  /** Soft location line used when street address is not yet confirmed. */
  readonly locationFallback: string;
}

export interface NavCta {
  readonly label: string;
  readonly href: string;
}

export interface NavLocale {
  readonly language: string;
  readonly currency: string;
}

export interface NavSupport {
  readonly label: string;
  readonly href: string;
}

export const NAV_UTILITY: {
  readonly contact: UtilityContact;
  readonly support: NavSupport;
  readonly locale: NavLocale;
} = {
  /**
   * Phase 3 unlock (D-47) — set when client confirms:
   *   address: '…', addressHref: 'https://maps…' | null,
   *   phone: '+254 …', phoneHref: 'tel:+254…',
   */
  contact: {
    address: null,
    addressHref: null,
    phone: '+254 717 207 112',
    phoneHref: 'tel:+254717207112',
    locationFallback: 'Brewed in Nairobi, Kenya',
  },
  support: { label: 'Support', href: '/contact' },
  locale: { language: 'English', currency: 'KES' },
};

export const NAV_SEARCH = {
  placeholder: 'Find a flavour',
} as const;

/**
 * Phase 3 unlock — set `href` when each profile goes live.
 * Footer + Organization schema `sameAs` pick these up automatically.
 */
export const NAV_SOCIALS: readonly SocialLink[] = [
  { platform: 'facebook', label: 'Facebook', href: null },
  { platform: 'twitter', label: 'Twitter', href: null },
  { platform: 'instagram', label: 'Instagram', href: null },
  { platform: 'pinterest', label: 'Pinterest', href: null },
];

/**
 * Primary menu — compact inline row beside the logo (navbar.png pattern).
 * Home is omitted; the logo link covers it.
 */
export const NAV_MENU: readonly NavEntry[] = [
  {
    href: '/shop',
    label: 'Shop',
    hasDropdown: true,
    children: [
      { href: '/shop', label: 'All flavours' },
      { href: '/bundles/build-your-own', label: 'Build a Box', flag: 'buildABox' },
      { href: '/catalogue', label: 'Catalogue' },
    ],
  },
  { href: '/our-story', label: 'Our Story' },
  { href: '/ingredients', label: 'Ingredients' },
  {
    href: '/stockists',
    label: 'Stockists',
    flag: 'stockists',
    hasDropdown: true,
    children: [
      { href: '/stockists', label: 'Find a stockist' },
      { href: '/wholesale', label: 'Wholesale' },
    ],
  },
  { href: '/contact', label: 'Contact' },
];

export const NAV_CTA: NavCta = {
  label: 'Order now',
  href: '/shop',
};

export const NAV_ACCOUNT_HREF = '/account';
export const NAV_SIGNIN_HREF = '/signin';
