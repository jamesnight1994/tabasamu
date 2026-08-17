/**
 * SEO METADATA ARCHITECTURE
 *
 * Centralised so that:
 *  (a) the copy lint can see every meta description — a meta description is
 *      copy, and it is a classic back door for invented health claims [R-02];
 *  (b) titles and OG tags cannot drift page by page.
 *
 * ⛔ Product structured data (schema.org/Product) requires a PRICE (D-14) and
 *    an AVAILABILITY. Emitting `offers` with a placeholder price would publish
 *    a false commercial claim to Google. It is therefore NOT emitted until
 *    D-14 is answered. This is deliberate.
 */

import type { Metadata } from 'next';
import { clientEnv } from '../config/env';
import { footerSocialUrls } from '../../content/footer';

export const SITE_NAME = 'Tabasamu Sips';

/** Brand Book §07 — the mantra. Reserved for primary touchpoints. */
export const BRAND_MANTRA = 'Rooted in the soil, crafted for the soul.';

/**
 * ⛔ D-13 — "Caffeine Free" or "Gluten Free" Rooibos Kombucha? These are
 *    DIFFERENT REGULATED FOOD CLAIMS and the artwork disagrees with itself.
 *    Until answered, no descriptor appears in any title, meta description,
 *    or OG tag. A regulated claim will not be published to a search engine
 *    on a guess. [NN-05]
 */
export const PRODUCT_DESCRIPTOR_BLOCKED = 'D-13' as const;

const baseUrl = (): string => clientEnv().NEXT_PUBLIC_APP_URL;

export interface PageMetaInput {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly image?: string;
  readonly noIndex?: boolean;
}

export const pageMeta = (input: PageMetaInput): Metadata => {
  const url = new URL(input.path, baseUrl()).toString();
  const image = input.image ?? '/brand/og-default.png';

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${input.title} · ${SITE_NAME}`,
      description: input.description,
      url,
      siteName: SITE_NAME,
      locale: 'en_KE',
      type: 'website',
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${input.title} · ${SITE_NAME}`,
      description: input.description,
      images: [image],
    },
    robots: input.noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
};

export const rootMetadata = (): Metadata => ({
  metadataBase: new URL(baseUrl()),
  title: {
    default: SITE_NAME,
    // Fraunces sets the wordmark; the separator is a middot, in-voice.
    template: `%s · ${SITE_NAME}`,
  },
  // Deliberately does NOT contain a product descriptor. See D-13 above.
  description: BRAND_MANTRA,
  applicationName: SITE_NAME,
  icons: {
    icon: [
      { url: '/brand/approved/tabasamu-monogram.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
    ],
    apple: '/brand/approved/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
  formatDetection: { telephone: false },
});

/* ------------------------------------------------------------------ *
 * Structured data
 * ------------------------------------------------------------------ */

export interface OrganizationJsonLd {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  sameAs?: readonly string[];
}

export const organizationJsonLd = (): OrganizationJsonLd => {
  const sameAs = footerSocialUrls();

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: baseUrl(),
    logo: new URL('/brand/approved/tabasamu-full-logo.png', baseUrl()).toString(),
    // ⛔ No `address`, `telephone` or `email` — D-47, not supplied.
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
};

/**
 * Product structured data.
 *
 * ⚠ Returns `null` until D-14 (price) is answered. `schema.org/Product`
 *   without `offers` is close to useless, and `offers` with a placeholder
 *   price is a lie told at scale. We emit nothing rather than something false.
 */
export const productJsonLd = (): null => null;
