import { describe, it, expect } from 'vitest';
import {
  parseQuery,
  serialiseQuery,
  EMPTY_QUERY,
  matchesSearch,
  matchesFilters,
  sortProducts,
  paginate,
  runQuery,
  flavourFacets,
  hasActiveFilters,
  activeFilterCount,
  relatedProducts,
  pushRecentlyViewed,
  quickAddVariant,
  RECENTLY_VIEWED_MAX,
  type CatalogueQuery,
} from '../../src/domain/catalogue/query';
import { MOCK_PRODUCTS, MOCK_INVENTORY } from '../../src/adapters/mock/fixtures';
import { unavailable, type Product, type Inventory } from '../../src/domain/catalogue';
import { fromMajor } from '../../src/domain/shared';

const inventory = new Map<string, Inventory>(
  MOCK_INVENTORY.map((i) => [i.variantId as string, i])
);
const ctx = { inventory };

const q = (patch: Partial<CatalogueQuery> = {}): CatalogueQuery => ({ ...EMPTY_QUERY, ...patch });

/* ================================================================== *
 * URL — the shareable-state boundary
 * ================================================================== */

describe('URL serialisation', () => {
  it('omits defaults — /shop and /shop?sort=featured&page=1 are the same view', () => {
    // Otherwise the URL accumulates noise and search engines index two URLs
    // for one page.
    expect(serialiseQuery(EMPTY_QUERY)).toBe('');
  });

  it('round-trips a full query', () => {
    const original = q({
      search: 'ginger',
      flavours: ['grape-ginger', 'passion'],
      sizes: ['1L'],
      availability: 'in-stock',
      subscription: true,
      sort: 'price-asc',
      page: 2,
    });
    expect(parseQuery(new URLSearchParams(serialiseQuery(original)))).toEqual(original);
  });

  /**
   * ⚠ A URL IS UNTRUSTED INPUT. It can be hand-edited, truncated, or pasted
   *   from a bookmark saved before a flavour was discontinued. A crash on a bad
   *   query string is a crash on a SHARED LINK — the worst place to have one.
   */
  describe('is defensive against hostile input', () => {
    it('drops an unknown flavour rather than trusting it', () => {
      expect(parseQuery({ flavour: 'not-a-flavour' }).flavours).toEqual([]);
    });

    it('keeps the valid flavours from a mixed list', () => {
      expect(parseQuery({ flavour: 'passion,made-up,beetroot' }).flavours).toEqual([
        'passion',
        'beetroot',
      ]);
    });

    it('falls back to the default sort on garbage', () => {
      expect(parseQuery({ sort: 'DROP TABLE' }).sort).toBe('featured');
    });

    it('never returns a page below 1', () => {
      expect(parseQuery({ page: '-5' }).page).toBe(1);
      expect(parseQuery({ page: 'abc' }).page).toBe(1);
      expect(parseQuery({ page: '0' }).page).toBe(1);
    });

    it('bounds the search term — an unbounded one is a payload', () => {
      expect(parseQuery({ q: 'x'.repeat(5000) }).search.length).toBe(100);
    });

    it('does not throw on an empty query string', () => {
      expect(() => parseQuery(new URLSearchParams(''))).not.toThrow();
    });
  });
});

/* ================================================================== *
 * SEARCH
 * ================================================================== */

describe('search', () => {
  const passion = MOCK_PRODUCTS.find((p) => p.slug === 'passion')!;

  it('matches everything on an empty term', () => {
    expect(matchesSearch(passion, '')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(matchesSearch(passion, 'PASSION')).toBe(true);
  });

  it('requires EVERY token — "grape ginger" must not match plain "ginger"', () => {
    const grapeGinger = MOCK_PRODUCTS.find((p) => p.slug === 'grape-ginger')!;
    const pineappleGinger = MOCK_PRODUCTS.find((p) => p.slug === 'pineapple-ginger')!;
    expect(matchesSearch(grapeGinger, 'grape ginger')).toBe(true);
    expect(matchesSearch(pineappleGinger, 'grape ginger')).toBe(false);
  });

  /**
   * ⚠ THE BUG THIS PREVENTS. `descriptor` is `Pending<string>`. If an
   *   `Unavailable` object were stringified into the haystack it would become
   *   "[object Object]" — and a search for "object" would match every product,
   *   silently. The field must simply not contribute.
   */
  it('never stringifies an Unavailable field into the haystack', () => {
    const broken: Product = {
      ...passion,
      descriptor: unavailable('D-13', 'blocked'),
      base: unavailable('D-50', 'blocked'),
    };
    expect(matchesSearch(broken, 'object')).toBe(false);
    expect(matchesSearch(broken, 'unavailable')).toBe(false);
    expect(matchesSearch(broken, 'undefined')).toBe(false);
    // The real fields still work.
    expect(matchesSearch(broken, 'passion')).toBe(true);
  });
});

/* ================================================================== *
 * FILTERS
 * ================================================================== */

describe('filters', () => {
  it('filters by flavour', () => {
    const out = MOCK_PRODUCTS.filter((p) => matchesFilters(p, q({ flavours: ['passion'] }), ctx));
    expect(out.map((p) => p.slug)).toEqual(['passion']);
  });

  it('filters by subscription eligibility', () => {
    const out = MOCK_PRODUCTS.filter((p) => matchesFilters(p, q({ subscription: true }), ctx));
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((p) => p.subscriptionEligible)).toBe(true);
  });

  it('in-stock excludes a sold-out product', () => {
    const out = MOCK_PRODUCTS.filter((p) => matchesFilters(p, q({ availability: 'in-stock' }), ctx));
    // Gooseberry has zero stock.
    expect(out.map((p) => p.slug)).not.toContain('gooseberry');
  });

  /**
   * ⚠ ABSENCE OF EVIDENCE IS NOT STOCK. A product with no inventory record is
   *   not known to be in stock, so it must NOT pass an in-stock filter. The
   *   alternative sells something that may not exist.
   */
  it('excludes a product with NO inventory record from an in-stock filter', () => {
    const orphan = MOCK_PRODUCTS[0];
    const emptyCtx = { inventory: new Map<string, Inventory>() };
    expect(matchesFilters(orphan, q({ availability: 'in-stock' }), emptyCtx)).toBe(false);
    // But it still shows under 'all' — unknown stock is not the same as absent.
    expect(matchesFilters(orphan, q({ availability: 'all' }), emptyCtx)).toBe(true);
  });

  it('reports active filters and their count', () => {
    expect(hasActiveFilters(EMPTY_QUERY)).toBe(false);
    expect(hasActiveFilters(q({ flavours: ['passion'] }))).toBe(true);
    expect(activeFilterCount(q({ flavours: ['passion', 'beetroot'], subscription: true }))).toBe(3);
  });
});

/* ================================================================== *
 * SORTING — the important one
 * ================================================================== */

describe('sorting', () => {
  it('featured uses the curated position, and is STABLE', () => {
    const out = sortProducts(MOCK_PRODUCTS, 'featured');
    const positions = out.map((p) => p.position);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    // Stable across calls — a grid that reshuffles loses the customer's place.
    expect(sortProducts(MOCK_PRODUCTS, 'featured').map((p) => p.slug)).toEqual(
      out.map((p) => p.slug)
    );
  });

  it('sorts by name', () => {
    expect(sortProducts(MOCK_PRODUCTS, 'name-asc')[0].name).toBe('Beetroot');
    expect(sortProducts(MOCK_PRODUCTS, 'name-desc')[0].name).toBe('Pineapple Ginger');
  });

  /**
   * ⚠ THE MOST IMPORTANT SORT TEST.
   *
   *   A product with an `Unavailable` price (⛔ D-14) must sort LAST — in BOTH
   *   directions. It must NOT be coerced to 0, which would rank an unpriced
   *   product as the CHEAPEST under "price, low to high" and put it at the top
   *   of the page. Unknown is unknown.
   */
  it('⚠ sorts Unavailable prices LAST in both directions — never as zero', () => {
    const priced: Product = {
      ...MOCK_PRODUCTS[0],
      variants: [{ ...MOCK_PRODUCTS[0].variants[0], price: fromMajor(500) }],
    };
    const unpriced: Product = {
      ...MOCK_PRODUCTS[1],
      variants: [
        {
          ...MOCK_PRODUCTS[1].variants[0],
          price: unavailable('D-14', 'No approved price.'),
        },
      ],
    };

    const asc = sortProducts([unpriced, priced], 'price-asc');
    expect(asc[0].id).toBe(priced.id);
    expect(asc[1].id).toBe(unpriced.id); // last, NOT first

    const desc = sortProducts([unpriced, priced], 'price-desc');
    expect(desc[0].id).toBe(priced.id);
    expect(desc[1].id).toBe(unpriced.id); // still last
  });
});

/* ================================================================== *
 * PAGINATION
 * ================================================================== */

describe('pagination', () => {
  const items = Array.from({ length: 25 }, (_, i) => i);

  it('paginates', () => {
    const p = paginate(items, 1, 10);
    expect(p.items.length).toBe(10);
    expect(p.pageCount).toBe(3);
    expect(p.total).toBe(25);
    expect(p.hasPrev).toBe(false);
    expect(p.hasNext).toBe(true);
  });

  it('CLAMPS an out-of-range page — a hand-edited ?page=99 must not show a void', () => {
    expect(paginate(items, 99, 10).page).toBe(3);
    expect(paginate(items, -3, 10).page).toBe(1);
  });

  it('handles an empty set without dividing by zero', () => {
    const p = paginate([], 1, 10);
    expect(p.pageCount).toBe(1);
    expect(p.items).toEqual([]);
  });
});

/* ================================================================== *
 * FACETS
 * ================================================================== */

describe('facet counts', () => {
  /**
   * ⚠ Counted with THAT facet removed — so a checkbox shows what you WOULD see
   *   if you ticked it. Counting with it applied shows "(0)" beside every
   *   unticked box, which is worse than no count at all.
   */
  it('a selected flavour still shows a non-zero count for the OTHERS', () => {
    const query = q({ flavours: ['passion'] });
    const facets = flavourFacets(MOCK_PRODUCTS, query, ctx);

    const beetroot = facets.find((f) => f.value === 'beetroot')!;
    expect(beetroot.selected).toBe(false);
    // Would be 0 if we counted with the flavour facet applied.
    expect(beetroot.count).toBe(1);

    expect(facets.find((f) => f.value === 'passion')!.selected).toBe(true);
  });
});

/* ================================================================== *
 * PIPELINE
 * ================================================================== */

describe('runQuery', () => {
  it('returns the matched count and the catalogue size', () => {
    const r = runQuery(MOCK_PRODUCTS, q({ flavours: ['passion'] }), ctx);
    expect(r.matched).toBe(1);
    expect(r.catalogueSize).toBe(MOCK_PRODUCTS.length);
    expect(r.page.items.map((p) => p.slug)).toEqual(['passion']);
  });

  it('an empty result is a FACT, not an error — matched 0, no throw', () => {
    const r = runQuery(MOCK_PRODUCTS, q({ search: 'zzzzz' }), ctx);
    expect(r.matched).toBe(0);
    expect(r.page.items).toEqual([]);
  });
});

/* ================================================================== *
 * RELATED & RECENTLY VIEWED
 * ================================================================== */

describe('related products', () => {
  it('excludes the current product', () => {
    const current = MOCK_PRODUCTS[0];
    const out = relatedProducts(MOCK_PRODUCTS, current);
    expect(out.map((p) => p.id)).not.toContain(current.id);
  });

  it('respects the limit', () => {
    expect(relatedProducts(MOCK_PRODUCTS, MOCK_PRODUCTS[0], 2).length).toBe(2);
  });
});

describe('recently viewed', () => {
  it('puts the newest first and de-duplicates', () => {
    const out = pushRecentlyViewed(['a', 'b'], 'b');
    expect(out).toEqual(['b', 'a']);
  });

  it('caps the list — it is a convenience, not a behavioural profile', () => {
    let list: readonly string[] = [];
    for (let i = 0; i < 20; i++) list = pushRecentlyViewed(list, `p${i}`);
    expect(list.length).toBe(RECENTLY_VIEWED_MAX);
    expect(list[0]).toBe('p19');
  });
});

/* ================================================================== *
 * QUICK ADD
 * ================================================================== */

describe('quick add', () => {
  it('resolves a variant when there is exactly one', () => {
    expect(quickAddVariant(MOCK_PRODUCTS[0])).not.toBeNull();
  });

  /**
   * ⚠ With more than one variant there is NO correct default. Returning the
   *   first is how a customer receives the wrong size. The card must show a
   *   selector instead — so this returns null, and the UI branches on it.
   */
  it('⚠ returns NULL for a multi-variant product rather than guessing', () => {
    const multi: Product = {
      ...MOCK_PRODUCTS[0],
      variants: [MOCK_PRODUCTS[0].variants[0], MOCK_PRODUCTS[1].variants[0]],
    };
    expect(quickAddVariant(multi)).toBeNull();
  });
});
