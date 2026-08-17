import type { MetadataRoute } from 'next';
import { clientEnv } from '../lib/config/env';

/**
 * ROBOTS DIRECTIVES  (Phase 8 · §2, §5)
 *
 * ⚠ Two crawl policies, chosen by environment — not one policy pretending to
 *   fit both. A staging or preview deployment must NOT be indexed; only a real
 *   production origin invites crawlers in. Getting this wrong leaks a
 *   half-built store into Google, and it is the single most common launch-day
 *   SEO mistake.
 *
 * ⛔ PRIVATE SURFACES ARE DISALLOWED. Account, cart, checkout and auth flows are
 *    transactional or authenticated. They carry a customer's session or an
 *    in-progress order — none of which belongs in a search index. Each route
 *    ALSO carries `robots: noindex` at the page level (defence in depth); this
 *    file stops a polite crawler before it ever fetches them.
 */

const PRIVATE_PATHS = [
  '/account',
  '/account/',
  '/cart',
  '/checkout',
  '/signin',
  '/register',
  '/reset',
  '/verify',
] as const;

export default function robots(): MetadataRoute.Robots {
  const base = clientEnv().NEXT_PUBLIC_APP_URL;
  const isProd = clientEnv().NEXT_PUBLIC_APP_ENV === 'production';

  // ⚠ Non-production origins are walled off entirely. A staging URL indexed by
  //   Google outranks nothing useful and confuses customers who find it.
  if (!isProd) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
      sitemap: `${base}/sitemap.xml`,
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...PRIVATE_PATHS],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
