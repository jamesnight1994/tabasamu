'use client';

/**
 * SHOP GRID
 *
 * The layout shell: flavour sidebar (desktop) / drawer (mobile), toolbar
 * (view · order by · count), the grid/list surface, and pagination.
 *
 * Grid: homepage CarouselProductCard. List: ShopProductListCard.
 * Both use live cart via CartProvider.
 */

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { CarouselProductCard } from '../storefront/CarouselProductCard';
import {
  ShopFiltersSidebar,
  ShopFiltersDrawer,
  SortSelect,
  ClearAll,
} from './ShopFilters';
import { ShopViewToggle, type ShopViewMode } from './ShopViewToggle';
import { ShopProductListCard } from './ShopProductListCard';
import { Button } from '../primitives/Button';
import {
  type CatalogueResult,
  type Facet,
  serialiseQuery,
  hasActiveFilters,
} from '../../domain/catalogue/query';
import type { Inventory, FlavourSlug, SizeCode, Product } from '../../domain/catalogue';
import { SHOP_PAGE } from '../../content/shop';
import { cn } from '../../lib/utils/cn';

export interface ShopGridProps {
  result: CatalogueResult;
  inventory: ReadonlyMap<string, Inventory>;
  flavourFacets: readonly Facet<FlavourSlug>[];
  sizeFacets: readonly Facet<SizeCode>[];
  inStockCount: number;
  subscriptionCount: number;
}

const VIEW_EASE = [0.2, 0, 0, 1] as const;

function useViewMotionVariants(): { container: Variants; item: Variants } {
  const reduced = useReducedMotion();

  if (reduced) {
    return {
      container: {
        hidden: { opacity: 1 },
        visible: { opacity: 1 },
        exit: { opacity: 1 },
      },
      item: {
        hidden: { opacity: 1 },
        visible: { opacity: 1 },
        exit: { opacity: 1 },
      },
    };
  }

  return {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          duration: 0.22,
          ease: VIEW_EASE,
          staggerChildren: 0.045,
          delayChildren: 0.04,
        },
      },
      exit: {
        opacity: 0,
        transition: {
          duration: 0.16,
          ease: VIEW_EASE,
          staggerChildren: 0.025,
          staggerDirection: -1,
        },
      },
    },
    item: {
      hidden: { opacity: 0, y: 14, scale: 0.985 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.32, ease: VIEW_EASE },
      },
      exit: {
        opacity: 0,
        y: -8,
        scale: 0.99,
        transition: { duration: 0.14, ease: VIEW_EASE },
      },
    },
  };
}

function ProductViewSurface({
  view,
  products,
  inventory,
}: {
  view: ShopViewMode;
  products: readonly Product[];
  inventory: ReadonlyMap<string, Inventory>;
}) {
  const variants = useViewMotionVariants();
  const isGrid = view === 'grid';

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.ul
        key={view}
        className={cn(
          'shop-product-surface',
          isGrid
            ? 'grid grid-cols-2 items-stretch gap-4 md:grid-cols-3 md:gap-6'
            : 'grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 md:gap-5 lg:gap-6'
        )}
        variants={variants.container}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {products.map((product, i) => (
          <motion.li
            key={product.id}
            className={cn('min-w-0', !isGrid && 'flex')}
            variants={variants.item}
          >
            {isGrid ? (
              <CarouselProductCard
                product={product}
                inventory={inventory.get(product.variants[0].id as string) ?? null}
                priority={i < 2}
                className="h-full"
              />
            ) : (
              <ShopProductListCard
                product={product}
                inventory={inventory.get(product.variants[0].id as string) ?? null}
                priority={i < 2}
              />
            )}
          </motion.li>
        ))}
      </motion.ul>
    </AnimatePresence>
  );
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
  const [view, setView] = useState<ShopViewMode>('grid');

  const filterProps = {
    query,
    flavourFacets,
    sizeFacets,
    inStockCount,
    subscriptionCount,
    matched,
  };

  const SITE_CONTAINER =
  'container mx-auto w-full max-w-[--container-max] px-6 md:px-12 lg:px-16';

  return (
    <section
      id="shop-catalogue"
      className="bg-surface shop-catalogue"
    >
      <div className={cn(SITE_CONTAINER, 'py-16 md:py-20 lg:pb-24 lg:pt-16')}>
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          <ShopFiltersSidebar {...filterProps} />

          <div className="min-w-0 flex-1">
            <div className="shop-toolbar mb-6 border-b border-[--color-border] pb-4 md:grid md:grid-cols-3">
              <div className="flex items-center justify-between gap-3 md:justify-start">
                <ShopViewToggle view={view} onChange={setView} />
                <ShopFiltersDrawer {...filterProps} />
              </div>

              <div className="flex justify-start md:justify-center">
                <SortSelect query={query} />
              </div>

              {/*
                ⚠ THE COUNT IS ANNOUNCED. `aria-live` — a screen-reader user
                  ticking a filter box gets no visual feedback, so the result
                  count must be spoken. Without this, filtering is silent and the
                  user has no idea whether anything changed.
              */}
              <p
                aria-live="polite"
                className="text-left text-[length:--text-small] text-[--color-ink-muted] md:text-right"
              >
                <span className="spec-mono text-[--color-ink]">{matched}</span>
                <span className="text-[--color-ink-subtle]"> of {catalogueSize}</span>{' '}
                {matched === 1 ? 'product' : 'products'}
              </p>
            </div>

            {page.items.length === 0 ? (
              <EmptyResults query={query} />
            ) : (
              <>
                <ProductViewSurface
                  view={view}
                  products={page.items}
                  inventory={inventory}
                />

                <Pagination result={result} />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
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
      <h2 className="text-[length:--text-h3]">{SHOP_PAGE.catalogue.emptyTitle}</h2>

      <p className="measure-narrow text-[--color-ink-muted]">
        {query.search.trim() ? (
          <>
            No product matches <span className="text-[--color-ink]">“{query.search}”</span>
            {hasActiveFilters({ ...query, search: '' })
              ? ' with the filters you have on.'
              : '.'}
          </>
        ) : (
          SHOP_PAGE.catalogue.emptyBody
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
