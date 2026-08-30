import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAdapters } from '../../../../adapters';
import { pageMeta } from '../../../../lib/seo';
import { type Inventory, isUnavailable } from '../../../../domain/catalogue';
import { Breadcrumbs } from '../../../../components/primitives/Surface';
import { BundleBuilder } from '../../../../components/shop/BundleBuilder';

/**
 * BUNDLE PAGE — preset and build-your-own share one route and one builder.
 *
 * ⛔ D-06 — the required bottle count is NOT confirmed, and nothing here
 *    invents one. The builder says so, visibly, rather than counting to a
 *    plausible six and going green.
 */

export async function generateStaticParams() {
  // Bundles are mock-only until the Nest port ships. Http adapters stub this
  // repository — pre-rendering at build would throw. Pages render on demand.
  return [];
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await getAdapters().bundles.bySlug(slug);

  if (!bundle) {
    return pageMeta({
      title: 'Not found',
      description: 'This box does not exist.',
      path: `/bundles/${slug}`,
      noIndex: true,
    });
  }

  const description = isUnavailable(bundle.description)
    ? 'Build a mixed box of caffeine-free rooibos kombucha.'
    : bundle.description;

  return pageMeta({
    title: bundle.seo?.title ?? bundle.title,
    description: bundle.seo?.description ?? description,
    path: `/bundles/${bundle.slug}`,
  });
}

export default async function BundlePage({ params }: Props) {
  const { slug } = await params;
  const adapters = getAdapters();

  const bundle = await adapters.bundles.bySlug(slug);
  if (!bundle || bundle.status === 'archived') notFound();

  const products = await adapters.products.list();

  const entries = await Promise.all(
    products.map(async (p) => {
      const inv = await adapters.inventory.check(p.variants[0].id);
      return [p.variants[0].id as string, inv] as const;
    })
  );

  const inventory = new Map<string, Inventory>(
    entries.filter((e): e is readonly [string, Inventory] => e[1] !== null)
  );

  return (
    <main id="main" className="mx-auto max-w-[--container-max] px-4 py-8 md:px-8 md:py-12">
      <Breadcrumbs
        items={[
          { label: 'Shop', href: '/shop' },
          { label: bundle.title, href: `/bundles/${bundle.slug}` },
        ]}
      />

      <header className="mb-10 mt-8 flex flex-col gap-4">
        <p className="label-caps text-[--color-accent]">
          {bundle.kind === 'preset' ? 'Preset box' : 'Build your own'}
        </p>
        <h1 className="text-[length:--text-h1]">{bundle.title}</h1>
        {!isUnavailable(bundle.description) && (
          <p className="measure text-[length:--text-body-lg] text-[--color-ink-muted]">
            {bundle.description}
          </p>
        )}
      </header>

      <BundleBuilder bundle={bundle} products={products} inventory={inventory} />
    </main>
  );
}
