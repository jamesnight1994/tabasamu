/**
 * PUBLIC ROUTE REGISTRY  (Phase 8 · §2)
 *
 * The single source of truth for which URLs are (a) public, (b) indexable, and
 * (c) belong in the sitemap. The sitemap, the breadcrumb builder, and the
 * footer's link integrity all read from here, so they cannot drift apart — a
 * sitemap that lists a page the footer removed (or omits one it added) is a
 * classic silent SEO regression.
 *
 * ⚠ PRIVATE ROUTES ARE DELIBERATELY ABSENT. Account, cart, checkout and the
 *   auth flows are noindex and are NOT enumerated here. `robots.ts`
 *   disallows them independently.
 *
 * ⚠ `changeFrequency` and `priority` are HINTS, not promises. Google largely
 *   ignores them now; we set them honestly rather than gaming them.
 */

export type RouteChangeFreq = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface PublicRoute {
  /** Path relative to the origin, no trailing slash (except root). */
  readonly path: string;
  /** Human label — used for breadcrumbs. */
  readonly label: string;
  readonly changeFrequency: RouteChangeFreq;
  readonly priority: number;
  /**
   * When true, this route depends on an unanswered decision and renders a
   * "awaiting confirmation" state. It is STILL indexable (the page is real and
   * useful — it tells a customer the honest status) but carries low priority.
   */
  readonly awaitingContent?: boolean;
}

/**
 * ⚠ Ordered as they should read in a sitemap: the store first, the brand
 *   story next, the trust/legal pages last.
 */
export const PUBLIC_ROUTES: readonly PublicRoute[] = [
  { path: '/', label: 'Home', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/shop', label: 'Shop', changeFrequency: 'daily', priority: 0.9 },
  { path: '/our-story', label: 'Our Story', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/ingredients', label: 'Ingredients', changeFrequency: 'monthly', priority: 0.7 },
  {
    path: '/stockists',
    label: 'Stockists',
    changeFrequency: 'monthly',
    priority: 0.4,
    awaitingContent: true, // ⛔ D-10
  },
  {
    path: '/wholesale',
    label: 'Wholesale',
    changeFrequency: 'monthly',
    priority: 0.5,
    awaitingContent: true, // ⛔ D-11
  },
  {
    path: '/corporate',
    label: 'Corporate orders',
    changeFrequency: 'monthly',
    priority: 0.5,
    awaitingContent: true, // ⛔ D-12
  },
  {
    path: '/contact',
    label: 'Contact',
    changeFrequency: 'monthly',
    priority: 0.6,
    awaitingContent: true, // ⛔ D-47
  },
  {
    path: '/faqs',
    label: 'FAQs',
    changeFrequency: 'monthly',
    priority: 0.6,
    awaitingContent: true, // ⛔ D-46 (most answers), partial content present
  },
  {
    path: '/delivery-and-returns',
    label: 'Delivery & returns',
    changeFrequency: 'monthly',
    priority: 0.6,
    awaitingContent: true, // ⛔ D-21/22/23/24/36
  },
  { path: '/privacy', label: 'Privacy', changeFrequency: 'yearly', priority: 0.3, awaitingContent: true }, // ⛔ D-43
  { path: '/terms', label: 'Terms', changeFrequency: 'yearly', priority: 0.3, awaitingContent: true },
  { path: '/cookie-preferences', label: 'Cookie preferences', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/accessibility', label: 'Accessibility', changeFrequency: 'yearly', priority: 0.3 },
] as const;

/** The product detail base — slugs are appended by the sitemap. */
export const PRODUCT_PATH_BASE = '/shop';

export const isPublicRoute = (path: string): boolean =>
  PUBLIC_ROUTES.some((r) => r.path === path) || path.startsWith(`${PRODUCT_PATH_BASE}/`);
