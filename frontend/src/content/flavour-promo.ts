/**
 * FLAVOUR PROMO — homepage 3-card section (post-hero).
 *
 * Health-adjacent copy only [R-02]. No medical claims.
 * Beetroot offer wording pending commercial sign-off [D-14].
 * Pineapple price hint supplied by client for promo card.
 *
 * Assets: `public/flavors/{passion,pineapple,beetroot}.png`
 */

export type FlavourPromoLayout = 'feature' | 'compact' | 'compact-offer';

export interface FlavourPromoSurface {
  readonly background: string;
  readonly boxShadow: string;
}

interface FlavourPromoCardBase {
  readonly id: string;
  readonly slug: 'passion' | 'pineapple' | 'beetroot';
  readonly layout: FlavourPromoLayout;
  readonly name: string;
  readonly title: string;
  readonly subline: string;
  readonly image: `/flavors/${string}.png`;
  readonly imageAlt: string;
  /** Glossy gradient surface — derived from strip tints [R-15], not full strip fills */
  readonly surface: FlavourPromoSurface;
  readonly href: `/shop/${string}`;
}

export interface FlavourPromoFeatureCard extends FlavourPromoCardBase {
  readonly layout: 'feature';
  readonly microLabel: string;
  readonly cta: { readonly label: 'Shop now'; readonly href: `/shop/${string}` };
}

/** Stylistic “From KES …” line on compact cards (reference: flavours-section top-right). */
export interface FlavourPromoPriceFrom {
  readonly prefix: 'from';
  readonly amount: string;
}

export interface FlavourPromoCompactCard extends FlavourPromoCardBase {
  readonly layout: 'compact';
  readonly priceFrom?: FlavourPromoPriceFrom;
}

export interface FlavourPromoOfferCard extends FlavourPromoCardBase {
  readonly layout: 'compact-offer';
  readonly badge: string;
}

export type FlavourPromoCard =
  | FlavourPromoFeatureCard
  | FlavourPromoCompactCard
  | FlavourPromoOfferCard;

/** ~22–28% strip tint gradients — slightly darker, glossy inset highlight */
const SURFACES = {
  passion: {
    background: 'linear-gradient(145deg, #b8d8ef 0%, #9ec4e5 52%, #adcee8 100%)',
    boxShadow:
      'inset 0 1px 0 rgba(255,255,255,0.45), 0 10px 28px rgba(11, 139, 255, 0.16)',
  },
  pineapple: {
    background: 'linear-gradient(145deg, #f0e4bc 0%, #e5d090 52%, #ecd9a8 100%)',
    boxShadow:
      'inset 0 1px 0 rgba(255,255,255,0.45), 0 10px 28px rgba(233, 194, 91, 0.18)',
  },
  beetroot: {
    background: 'linear-gradient(145deg, #e8ccd3 0%, #d4aab5 52%, #dfbfc8 100%)',
    boxShadow:
      'inset 0 1px 0 rgba(255,255,255,0.42), 0 10px 28px rgba(139, 38, 53, 0.14)',
  },
} as const satisfies Record<'passion' | 'pineapple' | 'beetroot', FlavourPromoSurface>;

export const FLAVOUR_PROMO = {
  sectionId: 'flavours-promo',
  cards: [
    {
      id: 'passion-feature',
      slug: 'passion',
      layout: 'feature',
      name: 'Passion Fruit',
      title: 'Passion Fruit',
      subline: 'Caffeine-free rooibos, finished with Kenyan passion fruit.',
      microLabel: 'Live culture · no coffee crash',
      image: '/flavors/passion.png',
      imageAlt:
        'Tabasamu Sips Passion bottle with fresh passion fruit on a warm ground.',
      surface: SURFACES.passion,
      href: '/shop/passion',
      cta: { label: 'Shop now', href: '/shop/passion' },
    },
    {
      id: 'pineapple-compact',
      slug: 'pineapple',
      layout: 'compact',
      name: 'Pineapple',
      title: 'Pineapple',
      subline: 'Bright pineapple on a slow ferment — easy on the evening.',
      image: '/flavors/pineapple.png',
      imageAlt: 'Tabasamu Sips Pineapple with fresh pineapple.',
      surface: SURFACES.pineapple,
      href: '/shop/pineapple',
      priceFrom: { prefix: 'from', amount: 'KES 550' },
    },
    {
      id: 'beetroot-offer',
      slug: 'beetroot',
      layout: 'compact-offer',
      name: 'Beetroot',
      title: 'Beetroot',
      subline: 'Intro offer — save on your first box.',
      image: '/flavors/beetroot.png',
      imageAlt: 'Tabasamu Sips Beetroot with fresh beetroot.',
      surface: SURFACES.beetroot,
      href: '/shop/beetroot',
      badge: 'Intro offer',
    },
  ],
} as const satisfies { sectionId: string; cards: readonly FlavourPromoCard[] };

/** Feature card (left bento column). */
export const FLAVOUR_PROMO_FEATURE = FLAVOUR_PROMO.cards[0];

/** Compact cards (right bento column). */
export const FLAVOUR_PROMO_COMPACT = FLAVOUR_PROMO.cards.slice(1);
