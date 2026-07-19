import type { MetadataRoute } from 'next';
import { SITE_NAME } from '../lib/seo';

/**
 * WEB APP MANIFEST  (Phase 8 · §2)
 *
 * `rootMetadata()` already references `/manifest.webmanifest`; Next serves this
 * route AT that path. Without it, the referenced manifest 404s — which some
 * browsers and Lighthouse flag.
 *
 * ⚠ COLOURS ARE BRAND-BOOK TOKENS, not guesses. Cream canvas (#FDF6F0),
 *   terracotta theme (#C05A2C). `display: 'minimal-ui'` — this is a
 *   storefront, not a full-screen app pretending to be native.
 *
 * ⚠ Icons reference the APPROVED terracotta monogram (SVG + exported PNG set,
 *   incl. a maskable 512) that ships in /public/brand/approved. The monogram
 *   carries its own safe-zone padding, so masked platforms do not clip it.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: 'Tabasamu',
    description: 'Caffeine-free rooibos kombucha, brewed slowly in Nairobi.',
    start_url: '/',
    display: 'minimal-ui',
    background_color: '#FDF6F0',
    theme_color: '#C05A2C',
    lang: 'en-KE',
    icons: [
      {
        src: '/brand/approved/tabasamu-monogram.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/brand/approved/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/brand/approved/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/brand/approved/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
