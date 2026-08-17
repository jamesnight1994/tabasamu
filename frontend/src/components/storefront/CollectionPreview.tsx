'use client';

/**
 * PRODUCT COLLECTION PREVIEW
 *
 * ⚠ This is a CLIENT ISLAND, and it is the only one on the homepage that
 *   carries product logic.
 *
 *   It needs client JS for the product carousel. Everything else on this page
 *   — the hero, the proposition, the process, the origin story — is a server
 *   component and arrives as plain HTML.
 *
 * ⚠ The DATA is fetched on the server and passed down. This component never
 *   touches an adapter — it receives plain `Product` and `Inventory` values.
 *   The boundary lint enforces that. [R-13]
 */

import { ProductCollectionCarousel } from './ProductCarousel';
import { COLLECTION } from '../../content/homepage';
import type { Product, Inventory } from '../../domain/catalogue';

export function CollectionPreview({
  products,
  inventory,
}: {
  products: readonly Product[];
  inventory: ReadonlyMap<string, Inventory>;
}) {
  return (
    <section
      aria-labelledby="collection-heading"
      className="bg-collection-ground"
    >
      <div className="container mx-auto max-w-[--container-max] px-4 py-16 md:pl-12 md:pt-16 md:pb-20">
        <ProductCollectionCarousel
          title={COLLECTION.title}
          products={products}
          inventory={inventory}
        />
      </div>
    </section>
  );
}
