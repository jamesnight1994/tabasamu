import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMeta } from '../../../lib/seo';
import { getAdapters } from '../../../adapters';
import {
  parseQuery,
  runQuery,
  flavourFacets,
  sizeFacets,
  matchesFilters,
} from '../../../domain/catalogue/query';
import { type Inventory, isPurchasable } from '../../../domain/catalogue';
import { ShopGrid } from '../../../components/shop/ShopGrid';

/**
 * SHOP — a SERVER COMPONENT that reads its query from the URL.
 *
 * ⚠ THE URL IS THE STATE. This page holds no client-side filter state at all.
 *
 *   `searchParams` → `parseQuery` → `runQuery` → HTML. Which means:
 *
 *     · the FILTERED grid is in the initial HTML. A customer on a slow Nairobi
 *       connection sees bottles, not a spinner that resolves into bottles after
 *       a round trip. [P-10]
 *     · a filtered view is SHAREABLE — paste the URL into WhatsApp and it
 *       arrives filtered.
 *     · the BACK BUTTON works, because each filter change is a history entry.
 *     · a RELOAD survives.
 *
 *   Holding the query in `useState` would look identical in a screenshot and
 *   silently break every one of those four.
 *
 * ⚠ DATA COMES THROUGH THE PORT. This page does not know a mock adapter sits
 *   behind `getAdapters()`. At Gate G2 the adapter swaps to HTTP, the backend
 *   receives the same `CatalogueQuery`, and this file does not change. [R-13]
 */

export const metadata: Metadata = pageMeta({
  // ✅ D-13 answered — the descriptor may now appear in the title.
  title: 'Shop — caffeine-free rooibos kombucha',
  description:
    'Six flavours of small-batch rooibos kombucha, brewed in Nairobi and finished with Kenyan fruit. One litre, no caffeine.',
  path: '/shop',
});

interface ShopPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const raw = await searchParams;

  // Next hands back `string | string[]`. Flatten it — a repeated `?q=a&q=b`
  // must not crash the page. A URL is untrusted input.
  const flat: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(raw)) {
    flat[k] = Array.isArray(v) ? v[0] : v;
  }

  const query = parseQuery(flat);
  const adapters = getAdapters();

  /**
   * ⚠ THE ERROR STATE IS REAL, NOT DECORATIVE.
   *
   *   The mock adapter injects failures on purpose. If the catalogue cannot
   *   load we render an honest error with a retry — NOT an empty grid, which a
   *   customer would read as "this shop has nothing in it".
   *
   *   An empty result is a FACT. A failed fetch is a FAULT. They must never
   *   look the same.
   */
  let products;
  try {
    products = await adapters.products.list();
  } catch {
    return (
      <main
        id="main"
        className="mx-auto flex max-w-[--container-max] flex-col items-center gap-6 px-4 py-24 text-center md:px-8"
      >
        <h1 className="text-[length:--text-h2]">The shop did not load.</h1>
        <p className="measure-narrow text-[length:--text-body-lg] text-[--color-ink-muted]">
          Something went wrong on our side, not yours. Reload the page and it will most likely
          work.
        </p>
        <Link
          href="/shop"
          className="min-h-[--touch-min] rounded-[--radius-sm] bg-[--color-action] px-8 py-4 font-medium text-[--color-action-fg] no-underline"
        >
          Try again
        </Link>
      </main>
    );
  }

  const entries = await Promise.all(
    products.map(async (p) => {
      const inv = await adapters.inventory.check(p.variants[0].id);
      return [p.variants[0].id as string, inv] as const;
    })
  );

  const inventory = new Map<string, Inventory>(
    entries.filter((e): e is readonly [string, Inventory] => e[1] !== null)
  );

  const ctx = { inventory };
  const result = runQuery(products, query, ctx);

  // Facet counts — each computed with ITS OWN facet removed from the query, so
  // a checkbox shows what you WOULD see if you ticked it.
  const flavours = flavourFacets(products, query, ctx);
  const sizes = sizeFacets(products, query, ctx);

  const withoutAvailability = { ...query, availability: 'all' as const };
  const inStockCount = products.filter((p) => {
    const inv = inventory.get(p.variants[0].id as string);
    return inv !== undefined && isPurchasable(inv) && matchesFilters(p, withoutAvailability, ctx);
  }).length;

  const withoutSubscription = { ...query, subscription: false };
  const subscriptionCount = products.filter(
    (p) => p.subscriptionEligible && matchesFilters(p, withoutSubscription, ctx)
  ).length;

  return (
    <ShopGrid
      result={result}
      inventory={inventory}
      flavourFacets={flavours}
      sizeFacets={sizes}
      inStockCount={inStockCount}
      subscriptionCount={subscriptionCount}
    />
  );
}
