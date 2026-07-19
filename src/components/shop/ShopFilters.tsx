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
import { useState, useEffect, useTransition, useId } from 'react';
import { Button } from '../primitives/Button';
import { Input, Checkbox } from '../primitives/Form';
import { Drawer } from '../primitives/Overlay';
import { FlavourSwatch } from '../commerce/Price';
import {
  type CatalogueQuery,
  type Facet,
  type SortOption,
  SORT_OPTIONS,
  SORT_LABELS,
  serialiseQuery,
  hasActiveFilters,
  activeFilterCount,
  EMPTY_QUERY,
} from '../../domain/catalogue/query';
import { FLAVOUR_STRIPS, type FlavourSlug, type SizeCode } from '../../domain/catalogue';
import { cn } from '../../lib/utils/cn';

export interface ShopFiltersProps {
  query: CatalogueQuery;
  flavourFacets: readonly Facet<FlavourSlug>[];
  sizeFacets: readonly Facet<SizeCode>[];
  subscriptionCount: number;
  inStockCount: number;
  matched: number;
}

/** Writes a new query to the URL. Every control funnels through this. */
const useQueryWriter = (query: CatalogueQuery) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const write = (patch: Partial<CatalogueQuery>) => {
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
 * SEARCH
 * ================================================================== */

function SearchField({ query }: { query: CatalogueQuery }) {
  const { write } = useQueryWriter(query);
  const [value, setValue] = useState(query.search);
  const id = useId();

  // Keep in step when the URL changes underneath us (back button, clear-all).
  useEffect(() => setValue(query.search), [query.search]);

  /**
   * ⚠ DEBOUNCED. Writing to the URL on every keystroke would push a history
   *   entry per character — and the back button would then walk backwards
   *   through "g", "gr", "gra"… 250ms is below the threshold where typing feels
   *   laggy, and well above the rate at which people type.
   */
  useEffect(() => {
    if (value === query.search) return;
    const t = setTimeout(() => write({ search: value }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="label-caps text-[--color-ink-muted]">
        Search
      </label>
      <div className="relative">
        <Input
          id={id}
          type="search"
          inputMode="search"
          placeholder="Flavour, name…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="pr-10"
        />
        {value && (
          <button
            type="button"
            onClick={() => setValue('')}
            aria-label="Clear search"
            className={cn(
              'absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center',
              'rounded-[--radius-sm] text-[--color-ink-muted]',
              'hover:bg-[--color-surface-sunken] focus-visible:outline-2 focus-visible:outline-[--color-focus]'
            )}
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3 fill-none stroke-current">
              <path d="M3.5 3.5l9 9m0-9l-9 9" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

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

  const toggle = (slug: FlavourSlug) => {
    const next = query.flavours.includes(slug)
      ? query.flavours.filter((f) => f !== slug)
      : [...query.flavours, slug];
    write({ flavours: next });
  };

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="label-caps mb-1 text-[--color-ink-muted]">Flavour</legend>

      {facets.map((f) => (
        <Checkbox
          key={f.value}
          checked={f.selected}
          onCheckedChange={() => toggle(f.value)}
          // ⚠ A facet with zero results is DISABLED, not hidden. Hiding it makes
          //   the list jump around as you filter; disabling it tells the truth
          //   and keeps the layout stable.
          disabled={f.count === 0 && !f.selected}
          label={
            <span className="flex w-full items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <FlavourSwatch strip={FLAVOUR_STRIPS[f.value]} size="sm" showLabel={false} />
                <span>{f.label}</span>
              </span>
              <span className="spec-mono text-[--color-ink-subtle]">{f.count}</span>
            </span>
          }
        />
      ))}
    </fieldset>
  );
}

function SizeFacets({
  query,
  facets,
}: {
  query: CatalogueQuery;
  facets: readonly Facet<SizeCode>[];
}) {
  const { write } = useQueryWriter(query);

  const toggle = (code: SizeCode) => {
    const next = query.sizes.includes(code)
      ? query.sizes.filter((s) => s !== code)
      : [...query.sizes, code];
    write({ sizes: next });
  };

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="label-caps mb-1 text-[--color-ink-muted]">Size</legend>
      {facets.map((f) => (
        <Checkbox
          key={f.value}
          checked={f.selected}
          onCheckedChange={() => toggle(f.value)}
          disabled={f.count === 0 && !f.selected}
          label={
            <span className="flex w-full items-center justify-between gap-2">
              <span>{f.label}</span>
              <span className="spec-mono text-[--color-ink-subtle]">{f.count}</span>
            </span>
          }
        />
      ))}
    </fieldset>
  );
}

function AvailabilityFacets({
  query,
  inStockCount,
  subscriptionCount,
}: {
  query: CatalogueQuery;
  inStockCount: number;
  subscriptionCount: number;
}) {
  const { write } = useQueryWriter(query);

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="label-caps mb-1 text-[--color-ink-muted]">Availability</legend>

      <Checkbox
        checked={query.availability === 'in-stock'}
        onCheckedChange={(c) => write({ availability: c ? 'in-stock' : 'all' })}
        label={
          <span className="flex w-full items-center justify-between gap-2">
            <span>In stock only</span>
            <span className="spec-mono text-[--color-ink-subtle]">{inStockCount}</span>
          </span>
        }
      />

      {/*
        ⛔ D-09 — SUBSCRIPTION ELIGIBILITY is a catalogue fact, and it is safe to
           filter on. It does NOT mean subscriptions work: the billing model is
           undecided (M-PESA has no card-on-file equivalent), nothing can be
           subscribed to, and the PDP says so plainly. Filtering by an attribute
           is not the same as selling against it. [NN-04]
      */}
      <Checkbox
        checked={query.subscription}
        onCheckedChange={(c) => write({ subscription: c })}
        label={
          <span className="flex w-full items-center justify-between gap-2">
            <span>Subscription eligible</span>
            <span className="spec-mono text-[--color-ink-subtle]">{subscriptionCount}</span>
          </span>
        }
      />
    </fieldset>
  );
}

/* ================================================================== *
 * SORT
 * ================================================================== */

export function SortSelect({ query }: { query: CatalogueQuery }) {
  const { write } = useQueryWriter(query);
  const id = useId();

  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="label-caps shrink-0 text-[--color-ink-muted]">
        Sort
      </label>
      <select
        id={id}
        value={query.sort}
        onChange={(e) => write({ sort: e.target.value as SortOption })}
        className={cn(
          'min-h-[--touch-min] rounded-[--radius-sm] border border-[--color-border]',
          'bg-[--color-surface] px-3 py-2 text-[length:--text-small] text-[--color-ink]',
          'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-1'
        )}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o} value={o}>
            {SORT_LABELS[o]}
          </option>
        ))}
      </select>
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
 * THE PANEL — shared by the desktop sidebar and the mobile drawer.
 * ================================================================== */

function FilterPanel(props: ShopFiltersProps) {
  return (
    <div className="flex flex-col gap-8">
      <SearchField query={props.query} />
      <FlavourFacets query={props.query} facets={props.flavourFacets} />
      <SizeFacets query={props.query} facets={props.sizeFacets} />
      <AvailabilityFacets
        query={props.query}
        inStockCount={props.inStockCount}
        subscriptionCount={props.subscriptionCount}
      />
      <ClearAll query={props.query} />
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
      className="hidden lg:block lg:w-64 lg:shrink-0"
    >
      <FilterPanel {...props} />
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
        className="w-full justify-center"
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
          <FilterPanel {...props} />

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
