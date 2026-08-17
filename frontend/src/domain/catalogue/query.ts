/**
 * DOMAIN — CATALOGUE QUERY
 *
 * Search, filtering, sorting and pagination as PURE FUNCTIONS.
 *
 * ⚠ WHY THIS IS DOMAIN AND NOT A COMPONENT.
 *
 *   Today the shop filters six products in memory. Tomorrow the backend filters
 *   six hundred in SQL. If the filter logic lives inside a React component, that
 *   migration is a rewrite; if it lives here as a pure function over a typed
 *   query, the backend implements the SAME `CatalogueQuery` contract and the UI
 *   does not change.
 *
 *   `parseQuery` / `serialiseQuery` are the URL boundary — they exist so that
 *   filter state is SHAREABLE. A customer can send a link to "Grape Ginger, in
 *   stock, subscription" and it survives a reload, a back button, and a paste
 *   into WhatsApp. That is a requirement, not a nicety.
 *
 * ⚠ NOTHING HERE INVENTS DATA. A product with an `Unavailable` price is sorted
 *   LAST under a price sort rather than being assigned a fake number — see
 *   `comparePrice`.
 */

import {
  type Product,
  type Inventory,
  type FlavourSlug,
  type SizeCode,
  isUnavailable,
  isPurchasable,
  FLAVOUR_SLUGS,
} from './index';
import type { VariantId } from '../shared';

/* ================================================================== *
 * THE QUERY
 * ================================================================== */

export const SORT_OPTIONS = [
  'featured',
  'name-asc',
  'name-desc',
  'price-asc',
  'price-desc',
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number];

export const SORT_LABELS: Readonly<Record<SortOption, string>> = {
  featured: 'Featured',
  'name-asc': 'Name, A to Z',
  'name-desc': 'Name, Z to A',
  'price-asc': 'Price, low to high',
  'price-desc': 'Price, high to low',
};

export type AvailabilityFilter = 'all' | 'in-stock';

export interface CatalogueQuery {
  /** Free-text search across name, flavour and descriptor. */
  readonly search: string;
  readonly flavours: readonly FlavourSlug[];
  readonly sizes: readonly SizeCode[];
  readonly availability: AvailabilityFilter;
  /** Subscription-eligible only. */
  readonly subscription: boolean;
  readonly sort: SortOption;
  readonly page: number;
}

export const EMPTY_QUERY: CatalogueQuery = {
  search: '',
  flavours: [],
  sizes: [],
  availability: 'all',
  subscription: false,
  sort: 'featured',
  page: 1,
};

/** Is anything actually filtering? Drives the "clear all" affordance. */
export const hasActiveFilters = (q: CatalogueQuery): boolean =>
  q.search.trim().length > 0 ||
  q.flavours.length > 0 ||
  q.sizes.length > 0 ||
  q.availability !== 'all' ||
  q.subscription;

/** How many filters are on. Shown as a badge on the mobile drawer trigger. */
export const activeFilterCount = (q: CatalogueQuery): number =>
  (q.search.trim() ? 1 : 0) +
  q.flavours.length +
  q.sizes.length +
  (q.availability !== 'all' ? 1 : 0) +
  (q.subscription ? 1 : 0);

/* ================================================================== *
 * URL SERIALISATION — the shareable-state boundary.
 *
 * ⚠ Defaults are OMITTED from the URL. `/shop` and `/shop?sort=featured&page=1`
 *   are the same view, and only one of them should exist — otherwise the URL
 *   grows noise, and search engines index two URLs for one page.
 * ================================================================== */

export const serialiseQuery = (q: CatalogueQuery): string => {
  const p = new URLSearchParams();
  if (q.search.trim()) p.set('q', q.search.trim());
  if (q.flavours.length) p.set('flavour', [...q.flavours].sort().join(','));
  if (q.sizes.length) p.set('size', [...q.sizes].sort().join(','));
  if (q.availability !== 'all') p.set('availability', q.availability);
  if (q.subscription) p.set('subscription', '1');
  if (q.sort !== 'featured') p.set('sort', q.sort);
  if (q.page > 1) p.set('page', String(q.page));
  return p.toString();
};

/**
 * ⚠ TOTALLY DEFENSIVE. A URL is user input — it can be hand-edited, truncated,
 *   or pasted from a stale bookmark after a flavour was discontinued. An
 *   unknown value is DROPPED, never trusted, and never allowed to throw. A
 *   crash on a bad query string is a crash on a shared link.
 */
export const parseQuery = (params: URLSearchParams | Record<string, string | undefined>): CatalogueQuery => {
  const get = (k: string): string | undefined =>
    params instanceof URLSearchParams ? (params.get(k) ?? undefined) : params[k];

  const csv = (k: string): string[] =>
    (get(k) ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const flavours = csv('flavour').filter((f): f is FlavourSlug =>
    (FLAVOUR_SLUGS as readonly string[]).includes(f)
  );

  const sizes = csv('size').filter((s): s is SizeCode => s === '1L');

  const rawSort = get('sort');
  const sort: SortOption = (SORT_OPTIONS as readonly string[]).includes(rawSort ?? '')
    ? (rawSort as SortOption)
    : 'featured';

  const rawAvailability = get('availability');
  const availability: AvailabilityFilter = rawAvailability === 'in-stock' ? 'in-stock' : 'all';

  const rawPage = Number.parseInt(get('page') ?? '1', 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  return {
    search: (get('q') ?? '').slice(0, 100), // bound it — a URL is untrusted
    flavours,
    sizes,
    availability,
    subscription: get('subscription') === '1',
    sort,
    page,
  };
};

/* ================================================================== *
 * MATCHING
 * ================================================================== */

/** Case- and accent-insensitive. "passion" must match "Passion". */
const normalise = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

/**
 * Free-text match across the fields a customer would actually type.
 *
 * ⚠ The descriptor is `Pending<string>` — if it is `Unavailable` it simply does
 *   not contribute to the haystack. It is NOT stringified into "[object Object]"
 *   or coerced to "undefined", which is exactly the kind of bug that makes a
 *   search box quietly match everything.
 */
export const matchesSearch = (product: Product, term: string): boolean => {
  const q = normalise(term);
  if (!q) return true;

  const haystack: string[] = [product.name, product.flavour];
  if (!isUnavailable(product.descriptor)) haystack.push(product.descriptor);
  if (!isUnavailable(product.base)) haystack.push(product.base);

  const hay = normalise(haystack.join(' '));

  // Every whitespace-separated token must appear. "grape ginger" should not
  // match a product that contains only "ginger".
  return q.split(/\s+/).every((token) => hay.includes(token));
};

export interface CatalogueContext {
  readonly inventory: ReadonlyMap<string, Inventory>;
}

const productInventory = (p: Product, ctx: CatalogueContext): Inventory | null =>
  ctx.inventory.get(p.variants[0].id as string) ?? null;

export const matchesFilters = (
  product: Product,
  q: CatalogueQuery,
  ctx: CatalogueContext
): boolean => {
  if (!matchesSearch(product, q.search)) return false;

  if (q.flavours.length && !q.flavours.includes(product.slug as FlavourSlug)) return false;

  if (q.sizes.length) {
    const has = product.variants.some((v) => q.sizes.includes(v.size.code));
    if (!has) return false;
  }

  if (q.availability === 'in-stock') {
    const inv = productInventory(product, ctx);
    // ⚠ No inventory record means we do NOT know it is in stock. Absence of
    //   evidence is not stock. Excluded from an in-stock filter.
    if (!inv || !isPurchasable(inv)) return false;
  }

  if (q.subscription && !product.subscriptionEligible) return false;

  return true;
};

/* ================================================================== *
 * SORTING
 * ================================================================== */

/**
 * ⚠ THE IMPORTANT ONE.
 *
 *   Prices are `Pending<Money>` — ⛔ D-14 means no approved price exists, and
 *   the mock carries placeholders.
 *
 *   A product whose price is `Unavailable` is sorted to the END under a price
 *   sort. It is NOT assigned `0` (which would rank it first under "low to high"
 *   and make an unpriced product look like the cheapest) and NOT assigned
 *   `Infinity` silently. Unknown is unknown, and it goes last, in both
 *   directions.
 */
const comparePrice = (a: Product, b: Product, dir: 1 | -1): number => {
  const pa = a.variants[0].price;
  const pb = b.variants[0].price;

  const aUnknown = isUnavailable(pa);
  const bUnknown = isUnavailable(pb);

  if (aUnknown && bUnknown) return 0;
  if (aUnknown) return 1; // unknown always last
  if (bUnknown) return -1;

  return (pa.amount - pb.amount) * dir;
};

export const sortProducts = (
  products: readonly Product[],
  sort: SortOption
): readonly Product[] => {
  const out = [...products];

  switch (sort) {
    case 'name-asc':
      return out.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return out.sort((a, b) => b.name.localeCompare(a.name));
    case 'price-asc':
      return out.sort((a, b) => comparePrice(a, b, 1));
    case 'price-desc':
      return out.sort((a, b) => comparePrice(a, b, -1));
    case 'featured':
    default:
      // Featured = the curated order the client set in the catalogue.
      // ⚠ Stable: NOT random, and NOT alphabetical-by-accident. A grid that
      //   reshuffles between renders makes a customer lose the bottle they were
      //   looking at.
      return out.sort((a, b) => a.position - b.position);
  }
};

/* ================================================================== *
 * PAGINATION
 *
 * ⚠ PAGINATION, NOT INFINITE SCROLL. Deliberate:
 *     · a paginated URL is shareable; an infinite scroll position is not
 *     · the footer stays reachable (wholesale, legal, contact)
 *     · on a slow Nairobi connection, an unbounded scroll is an unbounded
 *       download
 *   With six products it is academic; the contract is what matters, because the
 *   backend will paginate server-side and this shape already matches.
 * ================================================================== */

export const PAGE_SIZE = 12;

export interface Page<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly pageCount: number;
  readonly total: number;
  readonly hasPrev: boolean;
  readonly hasNext: boolean;
}

export const paginate = <T>(items: readonly T[], page: number, size = PAGE_SIZE): Page<T> => {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / size));
  // Clamp — a hand-edited `?page=99` must not render an empty void.
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * size;

  return {
    items: items.slice(start, start + size),
    page: current,
    pageCount,
    total,
    hasPrev: current > 1,
    hasNext: current < pageCount,
  };
};

/* ================================================================== *
 * THE WHOLE PIPELINE — one pure function.
 * ================================================================== */

export interface CatalogueResult {
  readonly page: Page<Product>;
  /** Total BEFORE pagination but AFTER filtering — the count shown to the user. */
  readonly matched: number;
  /** Total in the catalogue, unfiltered. */
  readonly catalogueSize: number;
  readonly query: CatalogueQuery;
}

export const runQuery = (
  products: readonly Product[],
  query: CatalogueQuery,
  ctx: CatalogueContext
): CatalogueResult => {
  const filtered = products.filter((p) => matchesFilters(p, query, ctx));
  const sorted = sortProducts(filtered, query.sort);

  return {
    page: paginate(sorted, query.page),
    matched: filtered.length,
    catalogueSize: products.length,
    query,
  };
};

/* ================================================================== *
 * FACET COUNTS
 *
 * ⚠ Counts are computed against the query with THAT facet removed — so the
 *   Beetroot checkbox shows how many products you would see if you ticked it,
 *   not how many you see now. Counting with the facet applied would show "(0)"
 *   next to every unticked box, which is useless.
 * ================================================================== */

export interface Facet<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly count: number;
  readonly selected: boolean;
}

export const flavourFacets = (
  products: readonly Product[],
  q: CatalogueQuery,
  ctx: CatalogueContext
): readonly Facet<FlavourSlug>[] =>
  FLAVOUR_SLUGS.map((slug) => {
    const without: CatalogueQuery = { ...q, flavours: [] };
    const count = products.filter(
      (p) => p.slug === slug && matchesFilters(p, without, ctx)
    ).length;

    const product = products.find((p) => p.slug === slug);

    return {
      value: slug,
      label: product?.name ?? slug,
      count,
      selected: q.flavours.includes(slug),
    };
  });

export const sizeFacets = (
  products: readonly Product[],
  q: CatalogueQuery,
  ctx: CatalogueContext
): readonly Facet<SizeCode>[] => {
  const without: CatalogueQuery = { ...q, sizes: [] };
  const codes = new Set<SizeCode>();
  products.forEach((p) => p.variants.forEach((v) => codes.add(v.size.code)));

  return [...codes].map((code) => ({
    value: code,
    label: products[0]?.variants.find((v) => v.size.code === code)?.size.label ?? code,
    count: products.filter(
      (p) => p.variants.some((v) => v.size.code === code) && matchesFilters(p, without, ctx)
    ).length,
    selected: q.sizes.includes(code),
  }));
};

/* ================================================================== *
 * RELATED PRODUCTS
 * ================================================================== */

/**
 * ⚠ NOT "you might also like" — that implies a recommendation engine we do not
 *   have, trained on behavioural data we do not collect. This is simply "the
 *   rest of the range", in curated order, excluding the product you are on.
 *   Honest, and useful for a six-product catalogue.
 */
export const relatedProducts = (
  all: readonly Product[],
  current: Product,
  limit = 4
): readonly Product[] =>
  [...all]
    .filter((p) => p.id !== current.id && p.status === 'active')
    .sort((a, b) => a.position - b.position)
    .slice(0, limit);

/* ================================================================== *
 * RECENTLY VIEWED
 *
 * ⚠ Stored client-side, capped, and holding IDs ONLY — never names, prices, or
 *   anything else. It is a convenience, not a behavioural profile, and it must
 *   not become one by accident.
 * ================================================================== */

export const RECENTLY_VIEWED_KEY = 'ts:recently-viewed';
export const RECENTLY_VIEWED_MAX = 6;

export const pushRecentlyViewed = (
  existing: readonly string[],
  slug: string
): readonly string[] => [slug, ...existing.filter((s) => s !== slug)].slice(0, RECENTLY_VIEWED_MAX);

/* ================================================================== *
 * QUICK-ADD SELECTION
 * ================================================================== */

/**
 * The variant a quick-add button should target.
 *
 * ⚠ Returns `null` when the product has more than one variant — because then
 *   there is NO correct default, and silently adding the first one is how a
 *   customer receives the wrong size. The card must show a variant selector
 *   instead. Today every product is 1 Litre only, so this always resolves; the
 *   guard exists for the day it does not.
 */
export const quickAddVariant = (product: Product): VariantId | null =>
  product.variants.length === 1 ? product.variants[0].id : null;
