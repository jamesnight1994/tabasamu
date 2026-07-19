import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAdapters } from '../../../../adapters';
import { pageMeta } from '../../../../lib/seo';
import { relatedProducts } from '../../../../domain/catalogue/query';
import { isUnavailable, type Inventory } from '../../../../domain/catalogue';
import { ProductDetail } from '../../../../components/shop/ProductDetail';

/**
 * PRODUCT DETAIL PAGE
 *
 * A SERVER COMPONENT. Data through the port; the interactive purchase panel is
 * a client island beneath it.
 *
 * ⚠ NO `schema.org/Product` STRUCTURED DATA IS EMITTED — deliberately.
 *
 *   A `Product` schema is only useful with an `offers` block, and `offers`
 *   requires a `price`. ⛔ D-14: no approved price exists.
 *
 *   Publishing a placeholder price as structured data would push a FALSE
 *   COMMERCIAL CLAIM into Google Shopping, price-comparison engines and rich
 *   snippets — at scale, mechanically, to an audience that has no way to know
 *   it is fictional. That is materially worse than showing a placeholder on our
 *   own page, where the "indicative" marker sits right beside it.
 *
 *   So `productJsonLd()` returns `null` until D-14 lands. The function exists
 *   and is tested; it simply refuses to lie. [NN-05]
 */

export async function generateStaticParams() {
  const products = await getAdapters().products.list();
  return products.map((p) => ({ slug: p.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getAdapters().products.bySlug(slug);
  if (!product) {
    return pageMeta({
      title: 'Not found',
      description: 'This product does not exist.',
      path: `/shop/${slug}`,
      noIndex: true,
    });
  }

  // Admin-editable SEO, with a derived fallback. [Phase 4 §6]
  const title = product.seo?.title ?? `${product.name} — caffeine-free rooibos kombucha`;

  const descriptor = isUnavailable(product.descriptor) ? '' : product.descriptor;
  const note = isUnavailable(product.forwardNote) ? '' : `${product.forwardNote}. `;

  const description =
    product.seo?.description ??
    `${note}${descriptor} rooibos kombucha, brewed in small batches in Nairobi. One litre.`;

  const image = product.images[0]?.src;

  return pageMeta({
    title,
    description,
    path: `/shop/${product.slug}`,
    // SOCIAL SHARING — a real OG image, now that photography exists.
    image,
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const adapters = getAdapters();

  const product = await adapters.products.bySlug(slug);
  if (!product || product.status === 'archived') notFound();

  const inventory: Inventory | null = await adapters.inventory.check(product.variants[0].id);

  const all = await adapters.products.list();
  const related = relatedProducts(all, product);

  // Inventory for the related rail.
  const entries = await Promise.all(
    related.map(async (p) => {
      const inv = await adapters.inventory.check(p.variants[0].id);
      return [p.variants[0].id as string, inv] as const;
    })
  );
  const relatedInventory = new Map<string, Inventory>(
    entries.filter((e): e is readonly [string, Inventory] => e[1] !== null)
  );

  return (
    <ProductDetail
      product={product}
      inventory={inventory}
      related={related}
      relatedInventory={relatedInventory}
      allProducts={all}
    />
  );
}
