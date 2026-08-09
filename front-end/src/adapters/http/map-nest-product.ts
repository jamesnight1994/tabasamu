/**
 * Map Nest OpenAPI `/v1` Product payloads → Tabasamu domain `Product`.
 */

import {
  type Product,
  type ProductImage,
  type Variant,
  type FlavourSlug,
  FLAVOUR_SLUGS,
  FLAVOUR_STRIPS,
  SIZE_1L,
  unavailable,
  PLACEHOLDER_PRICES,
  type Pending,
} from '../../domain/catalogue';
import { productId, variantId, type Money } from '../../domain/shared';

export type NestPending<T> =
  | { available: true; value: T }
  | { available: false; decision: string; note?: string };

export interface NestApiVariant {
  id: string;
  productId: string;
  sku: string;
  size?: { code?: string; millilitres?: number; label?: string };
  price?: NestPending<{ amount: number; currency: string; taxIncluded?: boolean | null }>;
  compareAtPrice?: { amount: number; currency: string; taxIncluded?: boolean | null } | null;
  active: boolean;
  stockOnHand?: number;
}

export interface NestApiProduct {
  id: string;
  slug: string;
  name: string;
  flavour: string;
  position: number;
  subscriptionEligible: boolean;
  descriptor?: NestPending<string>;
  base?: NestPending<string>;
  forwardNote?: NestPending<string>;
  images?: Array<{
    url: string;
    alt: string;
    width?: number;
    height?: number;
    role?: string;
  }>;
  seo?: Record<string, unknown> | null;
  status: 'draft' | 'active' | 'archived';
  variants?: NestApiVariant[];
}

const isFlavourSlug = (h: string): h is FlavourSlug =>
  (FLAVOUR_SLUGS as readonly string[]).includes(h);

const fromNestPending = <T>(
  p: NestPending<T> | undefined,
  fallbackDecision: string,
  fallbackNote: string
): Pending<T> => {
  if (!p) return unavailable(fallbackDecision, fallbackNote);
  if (p.available) return p.value;
  return unavailable(p.decision, p.note ?? fallbackNote);
};

const mapPrice = (v: NestApiVariant): Variant['price'] => {
  if (PLACEHOLDER_PRICES) {
    return unavailable(
      'D-14',
      'Retail prices are not client-approved yet. Demo Nest amounts are plumbing only.'
    );
  }
  if (!v.price?.available) {
    return unavailable(
      v.price?.decision ?? 'D-14',
      v.price?.note ?? 'Retail prices are not client-approved yet.'
    );
  }
  const money: Money = {
    amount: v.price.value.amount,
    currency: 'KES',
    taxIncluded: v.price.value.taxIncluded ?? null,
  };
  return money;
};

const mapImages = (raw: NestApiProduct): ProductImage[] =>
  (raw.images ?? [])
    .map((img): ProductImage | null => {
      const src = img.url?.trim();
      if (!src) return null;
      const role = (['hero', 'packshot', 'lifestyle', 'label', 'process'] as const).includes(
        img.role as ProductImage['role']
      )
        ? (img.role as ProductImage['role'])
        : 'packshot';
      return {
        src,
        alt: img.alt?.trim() || raw.name,
        width: img.width ?? 800,
        height: img.height ?? 1000,
        role,
      };
    })
    .filter((x): x is ProductImage => x !== null);

export const mapNestProduct = (raw: NestApiProduct): Product => {
  const slug: FlavourSlug = isFlavourSlug(raw.slug) ? raw.slug : 'passion';
  const pid = productId(raw.id);

  const variants: Variant[] = (raw.variants ?? []).map((v) => ({
    id: variantId(v.id),
    productId: pid,
    sku: v.sku,
    size: SIZE_1L,
    price: mapPrice(v),
    compareAtPrice: v.compareAtPrice
      ? {
          amount: v.compareAtPrice.amount,
          currency: 'KES' as const,
          taxIncluded: v.compareAtPrice.taxIncluded ?? null,
        }
      : null,
    active: v.active,
  }));

  return {
    id: pid,
    slug,
    name: raw.name,
    flavour: raw.flavour || raw.name,
    position: raw.position,
    subscriptionEligible: raw.subscriptionEligible,
    forwardNote: fromNestPending(
      raw.forwardNote,
      'D-51',
      `A forward note for ${raw.name} has not been written or approved.`
    ),
    descriptor: fromNestPending(raw.descriptor, 'D-13', 'Descriptor not set.'),
    base: fromNestPending(raw.base, 'D-50', 'Base not set.'),
    strip: FLAVOUR_STRIPS[slug],
    provenance: unavailable('D-49', 'Named farms have not been supplied.'),
    ingredients: unavailable('D-05', 'Ingredients list has not been supplied.'),
    nutrition: unavailable('D-05', 'Nutrition panel has not been supplied.'),
    fermentationDays: unavailable('D-52', 'Fermentation days not confirmed.'),
    storage: {
      refrigeration:
        'Keep refrigerated. This is a live product — the culture stays active, and cold is what keeps it in balance.',
      shelfLife: unavailable('D-05', 'Shelf life has not been supplied.'),
      servingSuggestion: unavailable('D-53', 'No approved serving suggestion.'),
    },
    variants:
      variants.length > 0
        ? variants
        : [
            {
              id: variantId(`var_${slug}_1l`),
              productId: pid,
              sku: `TS-${slug}-1L`,
              size: SIZE_1L,
              price: unavailable('D-14', 'No variant price from API.'),
              compareAtPrice: null,
              active: true,
            },
          ],
    images: mapImages(raw),
    status: raw.status,
  };
};
