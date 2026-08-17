import type { Product, ProductImage, Variant } from '@prisma/client';

/** OpenAPI Pending: concrete value or unavailable marker. */
export type Pending<T> =
  | { available: true; value: T }
  | { available: false; decision: string; note?: string };

export type ApiMoney = {
  amount: number;
  currency: string;
  taxIncluded: boolean | null;
};

export type ApiProduct = {
  id: string;
  slug: string;
  name: string;
  flavour: string;
  position: number;
  subscriptionEligible: boolean;
  descriptor: Pending<string>;
  base: Pending<string>;
  forwardNote: Pending<string>;
  provenance: Pending<never>;
  ingredients: Pending<never>;
  nutrition: Pending<never>;
  fermentationDays: Pending<never>;
  strip: { color: string; label: string };
  images: Array<{ url: string; alt: string; width?: number; height?: number; role?: string }>;
  seo: Record<string, unknown> | null;
  status: 'draft' | 'active' | 'archived';
  variants: ApiVariant[];
};

export type ApiVariant = {
  id: string;
  productId: string;
  sku: string;
  size: { code: string; millilitres?: number; label?: string };
  price: Pending<ApiMoney>;
  compareAtPrice: ApiMoney | null;
  active: boolean;
  stockOnHand?: number;
};

const STRIPS: Record<string, { color: string; label: string }> = {
  'grape-ginger': { color: '#4A2A55', label: 'GRAPE GINGER' },
  pineapple: { color: '#E9C25B', label: 'PINEAPPLE' },
  'pineapple-ginger': { color: '#C05A2C', label: 'PINEAPPLE GINGER' },
  beetroot: { color: '#8B2635', label: 'BEETROOT' },
  passion: { color: '#0B8BFF', label: 'PASSION' },
  gooseberry: { color: '#4A7C59', label: 'GOOSEBERRY' },
};

const pendingValue = <T>(value: T | null | undefined, decision: string, note: string): Pending<T> => {
  if (value == null || value === '') {
    return { available: false, decision, note };
  }
  return { available: true, value };
};

const unavailable = (decision: string, note: string): Pending<never> => ({
  available: false,
  decision,
  note,
});

type ProductWithRelations = Product & {
  variants: Variant[];
  images: ProductImage[];
};

/**
 * Map DB rows → OpenAPI Product.
 * Demo prices remain Pending (D-14) until commercial approval.
 */
export function toApiProduct(p: ProductWithRelations): ApiProduct {
  const strip = STRIPS[p.slug] ?? { color: '#2C2A29', label: p.name.toUpperCase() };

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    flavour: p.flavour,
    position: p.position,
    subscriptionEligible: p.subscriptionEligible,
    descriptor: pendingValue(p.descriptor, 'D-13', 'Descriptor not set.'),
    base: pendingValue(p.base, 'D-50', 'Base not set.'),
    forwardNote: pendingValue(
      p.forwardNote,
      'D-51',
      `A forward note for ${p.name} has not been written or approved.`,
    ),
    provenance: unavailable(
      'D-49',
      'Named farms and regions have not been supplied.',
    ),
    ingredients: unavailable(
      'D-05',
      'The ingredients list is regulated food information and has not been supplied.',
    ),
    nutrition: unavailable(
      'D-05',
      'The nutritional panel is regulated food information and has not been supplied.',
    ),
    fermentationDays: unavailable(
      'D-52',
      'Fermentation days have not been confirmed.',
    ),
    strip,
    images: p.images
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((img) => ({
        url: img.src,
        alt: img.alt,
        width: img.width,
        height: img.height,
        role: img.role,
      })),
    seo: (p.seo as Record<string, unknown> | null) ?? null,
    status: p.status,
    variants: p.variants.map((v) => toApiVariant(v)),
  };
}

function toApiVariant(v: Variant): ApiVariant {
  // D-14: store demo amounts but expose as Pending until client-approved.
  const price: Pending<ApiMoney> =
    v.priceAmount == null
      ? {
          available: false,
          decision: 'D-14',
          note: 'Retail prices are not client-approved yet.',
        }
      : {
          available: false,
          decision: 'D-14',
          note: 'Retail prices are not client-approved yet. Demo amounts are plumbing only.',
        };

  return {
    id: v.id,
    productId: v.productId,
    sku: v.sku,
    size: {
      code: v.sizeCode,
      millilitres: v.millilitres,
      label: v.sizeCode === '1L' ? '1 Litre' : v.sizeCode,
    },
    price,
    compareAtPrice:
      v.compareAt != null
        ? { amount: v.compareAt, currency: v.currency, taxIncluded: null }
        : null,
    active: v.active,
    stockOnHand: v.stockOnHand,
  };
}
