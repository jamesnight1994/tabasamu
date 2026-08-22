import type { NestApiProduct, NestPending } from '../../../adapters/http/map-nest-product';
import type { AdminProductRow } from './products-types';

export type { NestApiProduct as AdminApiProduct };

function resolvePendingLabel(field: NestPending<string> | undefined): string {
  if (!field) return 'Pending';
  return field.available ? field.value : 'Pending';
}

export function toAdminProductRow(product: NestApiProduct): AdminProductRow {
  const variants = product.variants ?? [];
  const activeVariants = variants.filter((variant) => variant.active);
  const primarySku = activeVariants[0]?.sku ?? variants[0]?.sku ?? null;
  const stockOnHand = variants.reduce(
    (sum, variant) => sum + (variant.stockOnHand ?? 0),
    0,
  );

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    flavour: product.flavour,
    status: product.status,
    position: product.position,
    subscriptionEligible: product.subscriptionEligible,
    primarySku,
    stockOnHand,
    descriptorLabel: resolvePendingLabel(product.descriptor),
    canPublish: product.status === 'draft',
    canArchive: product.status === 'active',
  };
}
