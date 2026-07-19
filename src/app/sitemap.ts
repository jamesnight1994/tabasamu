import type { MetadataRoute } from 'next';
import { clientEnv } from '../lib/config/env';
import { PUBLIC_ROUTES, PRODUCT_PATH_BASE } from '../lib/seo/routes';
import { FLAVOUR_SLUGS } from '../domain/catalogue';

/**
 * SITEMAP  (Phase 8 · §2)
 *
 * Enumerates ONLY public, indexable URLs — the same set `robots.ts` allows and
 * the footer links to. Private surfaces (account, cart, checkout, admin, auth)
 * are absent by construction: they are not in `PUBLIC_ROUTES`.
 *
 * ⚠ Product URLs come from the real catalogue slugs, not a hand-kept list, so a
 *   new flavour appears in the sitemap the moment it exists in the domain.
 *
 * ⚠ `lastModified` is the build time. Without real per-entity timestamps
 *   (which need the backend), a single honest build date beats a fabricated
 *   per-page date that implies edits that never happened.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = clientEnv().NEXT_PUBLIC_APP_URL;
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = PUBLIC_ROUTES.map((r) => ({
    url: new URL(r.path, base).toString(),
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const productEntries: MetadataRoute.Sitemap = FLAVOUR_SLUGS.map((slug) => ({
    url: new URL(`${PRODUCT_PATH_BASE}/${slug}`, base).toString(),
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...productEntries];
}
