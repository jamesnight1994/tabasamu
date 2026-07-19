'use client';

/**
 * PRODUCT COLLECTION PREVIEW
 *
 * ⚠ This is a CLIENT ISLAND, and it is the only one on the homepage that
 *   carries product logic.
 *
 *   It needs client JS for exactly one reason: quick-add gives immediate
 *   feedback ("Added to your box"), and that is state. Everything else on this
 *   page — the hero, the proposition, the process, the origin story — is a
 *   server component and arrives as plain HTML.
 *
 *   Isolating the interactivity here means a customer on a mid-range Android
 *   over 3G downloads the JS for a grid of six cards, not for eleven sections
 *   of static prose. [P-10]
 *
 * ⚠ The DATA is fetched on the server and passed down. This component never
 *   touches an adapter — it receives plain `Product` and `Inventory` values.
 *   The boundary lint enforces that. [R-13]
 */

import Link from 'next/link';
import { Button } from '../primitives/Button';
import { SectionHeader } from '../primitives/Surface';
import { ProductCard } from './ProductCard';
import { COLLECTION } from '../../content/homepage';
import type { Product, Inventory } from '../../domain/catalogue';

export function CollectionPreview({
  products,
  inventory,
}: {
  products: readonly Product[];
  inventory: ReadonlyMap<string, Inventory>;
}) {
  /**
   * ⚠ QUICK ADD IS A STUB, AND IT IS HONEST ABOUT IT.
   *
   *   The CART is Phase 4. Wiring `carts.addLine()` now would hand the customer
   *   a cart they cannot check out of — worse than a button that plainly does
   *   not persist yet.
   *
   *   The INTERACTION is real and testable: the button gives feedback, the
   *   change is announced to a screen reader, the disabled/sold-out states
   *   work. Only the persistence is deferred. [NN-04]
   */
  const handleQuickAdd = (product: Product) => {
    // Phase 4 → adapters.carts.addLine(cartId, { variantId, quantity: 1 })
    console.info('[quick-add] Phase 4 will persist this:', product.slug);
  };

  return (
    <section
      aria-labelledby="collection-heading"
      className="mx-auto max-w-[--container-max] px-4 py-16 md:px-8 md:py-24"
    >
      <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeader
          eyebrow={COLLECTION.eyebrow}
          title={COLLECTION.title}
          intro={COLLECTION.intro}
          as="h2"
        />
        <Button asChild variant="ghost" className="shrink-0 self-start md:self-end">
          <Link href={COLLECTION.cta.href}>{COLLECTION.cta.label}</Link>
        </Button>
      </div>

      {/*
        ⚠ TWO COLUMNS AT 360px, NOT ONE.

          A single-column product grid on a phone shows one bottle per screen
          and turns the range into a very long scroll — so the customer never
          perceives that there IS a range, which is the entire purpose of this
          section. The cards are designed to survive at ~160px, which is exactly
          why the flavour name and the colour swatch carry the identification
          rather than the (identical) bottle photograph. [R-12, P-09]
      */}
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-5">
        {products.map((product, i) => (
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
    </section>
  );
}
