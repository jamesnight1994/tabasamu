'use client';

/**
 * SHOP GRID
 *
 * The layout shell: sidebar (desktop) / drawer (mobile), the count, the sort,
 * the grid, and pagination.
 */

import Link from 'next/link';
import { ProductCard } from '../storefront/ProductCard';
import {
  ShopFiltersSidebar,
  ShopFiltersDrawer,
  SortSelect,
  ClearAll,
} from './ShopFilters';
import { Button } from '../primitives/Button';
import {
  type CatalogueResult,
  type Facet,
  serialiseQuery,
  hasActiveFilters,
} from '../../domain/catalogue/query';
import type { Inventory, FlavourSlug, SizeCode, Product } from '../../domain/catalogue';
import { cn } from '../../lib/utils/cn';

export interface ShopGridProps {
  result: CatalogueResult;
  inventory: ReadonlyMap<string, Inventory>;
  flavourFacets: readonly Facet<FlavourSlug>[];
  sizeFacets: readonly Facet<SizeCode>[];
  inStockCount: number;
  subscriptionCount: number;
}

export function ShopGrid({
  result,
  inventory,
  flavourFacets,
  sizeFacets,
  inStockCount,
  subscriptionCount,
}: ShopGridProps) {
  const { page, matched, catalogueSize, query } = result;

  const handleQuickAdd = (product: Product) => {
    /**
     * ⛔ THE CART IS PHASE 5. This is deliberately a stub.
     *
     *   Wiring `carts.addLine()` now would hand the customer a cart they cannot
     *   check out of — worse than a button that plainly does not persist yet.
     *   The INTERACTION is real and testable (feedback, aria-live, sold-out
     *   disabling); only the persistence is deferred. [NN-04]
     */
    console.info('[quick-add] Phase 5 will persist this:', product.slug);
  };

  const filterProps = {
    query,
    flavourFacets,
    sizeFacets,
    inStockCount,
    subscriptionCount,
    matched,
  };

  return (
    <main id="main" className="mx-auto max-w-[--container-max] px-4 py-12 md:px-8 md:py-16">
      <header className="mb-8 flex flex-col gap-4">
        <p className="label-caps text-[--color-accent]">The range</p>
        <h1 className="text-[length:--text-h1]">Six flavours, one system.</h1>
        <p className="measure text-[length:--text-body-lg] text-[--color-ink-muted]">
          The label never changes. Only the strip along the bottom does — so you learn to find
          your one by its colour.
        </p>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <ShopFiltersSidebar {...filterProps} />

        <div className="min-w-0 flex-1">
          {/* ---- toolbar: count + sort ---- */}
          <div className="mb-6 flex flex-col gap-4 border-b border-[--color-border] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {/*
                ⚠ THE COUNT IS ANNOUNCED. `aria-live` — a screen-reader user
                  ticking a filter box gets no visual feedback, so the result
                  count must be spoken. Without this, filtering is silent and the
                  user has no idea whether anything changed.
              */}
              <p aria-live="polite" className="text-[length:--text-small] text-[--color-ink-muted]">
                <span className="spec-mono text-[--color-ink]">{matched}</span>{' '}
                {matched === 1 ? 'product' : 'products'}
                {hasActiveFilters(query) && (
                  <span className="text-[--color-ink-subtle]"> of {catalogueSize}</span>
                )}
              </p>
              <div className="hidden sm:block">
                <ClearAll query={query} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 sm:hidden">
                <ShopFiltersDrawer {...filterProps} />
              </div>
              <SortSelect query={query} />
            </div>
          </div>

          {/* ---- the grid, or the empty state ---- */}
          {page.items.length === 0 ? (
            <EmptyResults query={query} />
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                {page.items.map((product, i) => (
                  <li key={product.id} className="contents">
                    <ProductCard
                      product={product}
                      inventory={inventory.get(product.variants[0].id as string) ?? null}
                      quickAdd
                      onQuickAdd={handleQuickAdd}
                      // The first two are above the fold on a phone.
                      priority={i < 2}
                    />
                  </li>
                ))}
              </ul>

              <Pagination result={result} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

/* ================================================================== *
 * EMPTY RESULTS
 *
 * ⚠ This is NOT the same as an error, and it must not look like one. An empty
 *   result is a FACT about the query — and the most useful thing to offer is
 *   the way back out of it.
 * ================================================================== */

function EmptyResults({ query }: { query: CatalogueResult['query'] }) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-[--radius-lg] border border-dashed border-[--color-border-strong] px-6 py-16 text-center">
      <h2 className="text-[length:--text-h3]">Nothing matches that.</h2>

      <p className="measure-narrow text-[--color-ink-muted]">
        {query.search.trim() ? (
          <>
            No product matches <span className="text-[--color-ink]">“{query.search}”</span>
            {hasActiveFilters({ ...query, search: '' })
              ? ' with the filters you have on.'
              : '.'}
          </>
        ) : (
          'No product matches the filters you have on.'
        )}
      </p>

      <ClearAll query={query} />
    </div>
  );
}

/* ================================================================== *
 * PAGINATION
 *
 * ⚠ PAGINATION, NOT INFINITE SCROLL. Deliberate, and the reasons are practical:
 *     · a paginated URL is SHAREABLE; a scroll position is not
 *     · the FOOTER stays reachable — wholesale, legal, contact all live there
 *     · on a slow connection, an unbounded scroll is an unbounded download
 *
 *   With six products this is academic. The CONTRACT is what matters: the
 *   backend will paginate server-side, and this shape already matches it.
 * ================================================================== */

function Pagination({ result }: { result: CatalogueResult }) {
  const { page, query } = result;
  if (page.pageCount <= 1) return null;

  const href = (n: number) => {
    const qs = serialiseQuery({ ...query, page: n });
    return qs ? `/shop?${qs}` : '/shop';
  };

  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
      <Button asChild variant="ghost" disabled={!page.hasPrev}>
        <Link href={href(page.page - 1)} aria-disabled={!page.hasPrev}>
          Previous
        </Link>
      </Button>

      <ol className="flex items-center gap-1">
        {Array.from({ length: page.pageCount }, (_, i) => i + 1).map((n) => (
          <li key={n}>
            <Link
              href={href(n)}
              aria-current={n === page.page ? 'page' : undefined}
              className={cn(
                'grid min-h-[--touch-min] min-w-[--touch-min] place-items-center rounded-[--radius-sm]',
                'spec-mono text-[length:--text-small] no-underline',
                'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-1',
                'transition-colors duration-[--duration-fast]',
                n === page.page
                  ? 'bg-[--color-action] text-[--color-action-fg]'
                  : 'text-[--color-ink] hover:bg-[--color-surface-sunken]'
              )}
            >
              {n}
            </Link>
          </li>
        ))}
      </ol>

      <Button asChild variant="ghost" disabled={!page.hasNext}>
        <Link href={href(page.page + 1)} aria-disabled={!page.hasNext}>
          Next
        </Link>
      </Button>
    </nav>
  );
}
