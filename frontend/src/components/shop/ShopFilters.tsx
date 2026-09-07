'use client';

/**
 * SHOP FILTERS
 *
 * ⚠ THE URL IS THE STATE. There is no `useState` holding the query.
 *
 *   Every change writes to the URL, and the page re-renders from `searchParams`.
 *   That gives us, for free:
 *     · a SHAREABLE link — paste "Grape Ginger, in stock" into WhatsApp and it
 *       arrives filtered
 *     · a working BACK BUTTON — because each filter change is a history entry
 *     · a survivable RELOAD
 *     · a server-renderable page — the filtered grid is in the initial HTML,
 *       not assembled after a round trip [P-10]
 *
 *   Holding it in component state instead would give a filter UI that looks
 *   fine and silently breaks all four.
 *
 * ⚠ Facet counts are computed with that facet REMOVED from the query — so the
 *   Beetroot checkbox tells you how many products you would see if you ticked
 *   it, not how many you can see now. Counting with the facet applied shows
 *   "(0)" beside every unticked box, which is worse than no count at all.
 */

import { useRouter, usePathname } from 'next/navigation';
import { useState, useTransition, useId } from 'react';
import { Checkbox, Label, ListBox, Select } from '@heroui/react';
import { X } from 'lucide-react';
import { Button } from '../primitives/Button';
import { Drawer } from '../primitives/Overlay';
import { FlavourSwatch } from '../commerce/Price';
import { SHOP_PAGE } from '../../content/shop';
import {
  type CatalogueQuery,
  type Facet,
  type SortOption,
  SORT_OPTIONS,
  SORT_LABELS,
  hasActiveFilters,
  activeFilterCount,
  EMPTY_QUERY,
  serialiseQuery,
} from '../../domain/catalogue/query';
import { FLAVOUR_STRIPS, type FlavourSlug, type SizeCode } from '../../domain/catalogue';
import { cn } from '../../lib/utils/cn';

/** Storefront teal — same family as consent CTAs, not HeroUI default blue. */
const FLAVOUR_CHECKBOX =
  '[--accent:#3a9d7a] [--accent-foreground:#fff] w-full';

/** Sort options shown in the toolbar — default catalogue order is the empty placeholder. */
const SORT_MENU_OPTIONS = SORT_OPTIONS.filter((o) => o !== 'featured').map((value) => ({
  value,
  label: SORT_LABELS[value],
}));

export interface ShopFiltersProps {
  query: CatalogueQuery;
  flavourFacets: readonly Facet<FlavourSlug>[];
  sizeFacets: readonly Facet<SizeCode>[];
  subscriptionCount: number;
  inStockCount: number;
  matched: number;
}

/** Writes a new query to the URL. Every control funnels through this. */
type QueryWriter = {
  write: (patch: Partial<CatalogueQuery>) => void;
  isPending: boolean;
};

const useQueryWriter = (query: CatalogueQuery): QueryWriter => {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const write = (patch: Partial<CatalogueQuery>): void => {
    // ⚠ Any change other than paging returns to page 1. Staying on page 3 of a
    //   result set that now has one page is how a customer sees an empty grid
    //   and concludes the shop is broken.
    const next: CatalogueQuery = {
      ...query,
      ...patch,
      page: patch.page ?? 1,
    };
    const qs = serialiseQuery(next);
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  return { write, isPending };
};

/* ================================================================== *
 * FACET GROUPS
 * ================================================================== */

function FlavourFacets({
  query,
  facets,
}: {
  query: CatalogueQuery;
  facets: readonly Facet<FlavourSlug>[];
}) {
  const { write } = useQueryWriter(query);

  const setFlavour = (slug: FlavourSlug, selected: boolean) => {
    const next = selected
      ? query.flavours.includes(slug)
        ? query.flavours
        : [...query.flavours, slug]
      : query.flavours.filter((f) => f !== slug);
    write({ flavours: next });
  };

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="sr-only">{SHOP_PAGE.catalogue.flavourFilterHeading}</legend>

      <ul className="shop-filter-panel-list m-0 flex list-none flex-col gap-1 p-3">
        {facets.map((f) => (
          <li key={f.value} className="min-w-0">
            <Checkbox
              isSelected={f.selected}
              onChange={(selected) => setFlavour(f.value, selected)}
              // ⚠ A facet with zero results is DISABLED, not hidden. Hiding it makes
              //   the list jump around as you filter; disabling it tells the truth
              //   and keeps the layout stable.
              isDisabled={f.count === 0 && !f.selected}
              className={FLAVOUR_CHECKBOX}
            >
              <Checkbox.Content className="w-full min-w-0 items-center gap-3 py-1.5">
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <FlavourSwatch
                      strip={FLAVOUR_STRIPS[f.value]}
                      size="sm"
                      showLabel={false}
                    />
                    <span className="truncate font-body text-[length:--text-small] text-[--color-ink]">
                      {f.label}
                    </span>
                  </span>
                  <span className="spec-mono shrink-0 text-[length:--text-caption] text-[--color-ink-subtle]">
                    {f.count}
                  </span>
                </span>
              </Checkbox.Content>
            </Checkbox>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

/* Size / availability / search UI intentionally omitted from the shop redesign
 * sidebar (Phase 2). Domain query support in `query.ts` is unchanged. */

/* ================================================================== *
 * SORT — HeroUI select; default catalogue order shows as placeholder.
 * ================================================================== */

export function SortSelect({ query }: { query: CatalogueQuery }) {
  const { write } = useQueryWriter(query);
  const selectedKey = query.sort === 'featured' ? null : query.sort;

  return (
    <div
      className={cn(
        'shop-sort-select-wrap relative w-full max-w-[16rem] sm:w-60',
        selectedKey && 'shop-sort-select-wrap--clearable'
      )}
    >
      <Select
        aria-label={SHOP_PAGE.catalogue.orderByLabel}
        placeholder={SHOP_PAGE.catalogue.sortPlaceholder}
        selectedKey={selectedKey}
        onSelectionChange={(key) => {
          write({
            sort: (key ? String(key) : 'featured') as SortOption,
          });
        }}
        className="shop-sort-select w-full"
      >
        <Label className="sr-only">{SHOP_PAGE.catalogue.orderByLabel}</Label>
        <Select.Trigger className="shop-sort-select__trigger">
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover className="shop-sort-select__popover">
          <ListBox items={SORT_MENU_OPTIONS}>
            {(item) => (
              <ListBox.Item id={item.value} textValue={item.label}>
                {item.label}
              </ListBox.Item>
            )}
          </ListBox>
        </Select.Popover>
      </Select>

      {selectedKey ? (
        <button
          type="button"
          aria-label={SHOP_PAGE.catalogue.sortClearLabel}
          className="shop-sort-select__clear"
          onClick={() => write({ sort: 'featured' })}
        >
          <X className="size-3.5" strokeWidth={2.25} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

/* ================================================================== *
 * CLEAR ALL
 * ================================================================== */

export function ClearAll({ query }: { query: CatalogueQuery }) {
  const { write } = useQueryWriter(query);
  if (!hasActiveFilters(query)) return null;

  return (
    <Button variant="ghost" onClick={() => write({ ...EMPTY_QUERY })}>
      Clear all filters
    </Button>
  );
}

/* ================================================================== *
 * THE PANEL — flavour-only card matching the Shop Page Grid sidebar
 * chrome (header bar + bordered body). Size / availability domain
 * support remains; those controls are simply not rendered here.
 * ================================================================== */

function FlavourOnlyPanel(props: Pick<ShopFiltersProps, 'query' | 'flavourFacets'>) {
  const panelId = useId();
  const headingId = `${panelId}-heading`;

  return (
    <div className="shop-filter-panel overflow-hidden rounded-[--radius-md] border border-[--color-border] bg-[--color-surface]">
      <h2
        id={headingId}
        className={cn(
          'shop-filter-panel-header m-0 border-b border-[--color-border]',
          'bg-[color-mix(in_oklab,var(--color-surface-sunken)_72%,var(--color-ink)_6%)]',
          'px-4 py-2.5',
          'font-body text-[1.0rem] font-normal tracking-[0.04em] text-[--color-ink]'
        )}
      >
        {SHOP_PAGE.catalogue.flavourFilterHeading}
      </h2>

      <section aria-labelledby={headingId}>
        <FlavourFacets query={props.query} facets={props.flavourFacets} />

        {hasActiveFilters(props.query) && (
          <div className="border-t border-[--color-border] px-4 py-3">
            <ClearAll query={props.query} />
          </div>
        )}
      </section>
    </div>
  );
}

/* ================================================================== *
 * DESKTOP — a persistent sidebar.
 * ================================================================== */

export function ShopFiltersSidebar(props: ShopFiltersProps) {
  return (
    <aside
      aria-label="Filter products"
      className="hidden lg:block lg:w-72 lg:shrink-0"
    >
      <FlavourOnlyPanel query={props.query} flavourFacets={props.flavourFacets} />
    </aside>
  );
}

/* ================================================================== *
 * MOBILE — a drawer.
 *
 * ⚠ A drawer, not an accordion stack pushed inline. On a 360px screen, six
 *   flavour checkboxes plus sizes plus availability pushes the actual PRODUCTS
 *   two full screens down. The customer came to see bottles.
 * ================================================================== */

export function ShopFiltersDrawer(props: ShopFiltersProps) {
  const [open, setOpen] = useState(false);
  const count = activeFilterCount(props.query);

  return (
    <div className="lg:hidden">
      <Button
        variant="secondary"
        onClick={() => setOpen(true)}
        className="w-full justify-center sm:w-auto"
      >
        Filter
        {count > 0 && (
          <span
            className={cn(
              'ml-2 grid min-w-5 place-items-center rounded-full px-1.5',
              'bg-[--color-action] text-[--color-action-fg]',
              'spec-mono text-[length:--text-micro]'
            )}
          >
            {count}
          </span>
        )}
      </Button>

      <Drawer
        open={open}
        onOpenChange={setOpen}
        title="Filter products"
        side="bottom"
      >
        <div className="flex flex-col gap-8 pb-4">
          <FlavourOnlyPanel query={props.query} flavourFacets={props.flavourFacets} />

          {/*
            ⚠ The result count is on the CONFIRM button. A customer ticking
              boxes in a drawer cannot see the grid behind it — so the button
              must tell them what they will get before they commit to closing.
          */}
          <Button fullWidth onClick={() => setOpen(false)}>
            Show {props.matched} {props.matched === 1 ? 'product' : 'products'}
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
