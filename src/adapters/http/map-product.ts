/**
 * Map Medusa Store API product payloads → Tabasamu domain `Product`.
 * Exported for unit tests (no live Medusa required).
 */

import {
  type Product,
  type Variant,
  type FlavourSlug,
  FLAVOUR_SLUGS,
  FLAVOUR_STRIPS,
  SIZE_1L,
  unavailable,
  PLACEHOLDER_PRICES,
} from '../../domain/catalogue';
import { productId, variantId, fromMajor, type Money } from '../../domain/shared';

export interface MedusaStoreVariant {
  id: string;
  title?: string | null;
  sku?: string | null;
  calculated_price?: {
    calculated_amount?: number | null;
    currency_code?: string | null;
  } | null;
  prices?: Array<{ amount?: number; currency_code?: string }> | null;
}

export interface MedusaStoreProduct {
  id: string;
  title: string;
  handle?: string | null;
  status?: string | null;
  description?: string | null;
  variants?: MedusaStoreVariant[] | null;
  metadata?: Record<string, unknown> | null;
}

const isFlavourSlug = (h: string): h is FlavourSlug =>
  (FLAVOUR_SLUGS as readonly string[]).includes(h);

const moneyFromMedusaAmount = (amount: number | null | undefined): Money | null => {
  if (amount == null || Number.isNaN(amount)) return null;
  // Medusa Store calculated_amount is typically major units for KES in our seed.
  return fromMajor(amount);
};

const variantPrice = (v: MedusaStoreVariant): Variant['price'] => {
  const amount =
    v.calculated_price?.calculated_amount ??
    v.prices?.find((p) => p.currency_code === 'kes')?.amount ??
    v.prices?.[0]?.amount;
  const money = moneyFromMedusaAmount(amount ?? undefined);
  if (!money || PLACEHOLDER_PRICES) {
    // Keep commercial honesty until D-14 is closed; seed amounts are demo-only.
    return unavailable('D-14', 'Retail prices are not client-approved yet. Demo Medusa amounts are plumbing only.');
  }
  return money;
};

export const mapMedusaProduct = (raw: MedusaStoreProduct, position = 0): Product => {
  const handle = (raw.handle ?? raw.id).toLowerCase();
  const slug: FlavourSlug = isFlavourSlug(handle) ? handle : 'passion';
  const pid = productId(raw.id.startsWith('prod_') ? raw.id : `prod_${raw.id}`);

  const variants: Variant[] = (raw.variants ?? []).map((v) => ({
    id: variantId(v.id),
    productId: pid,
    sku: v.sku ?? `${handle}-1l`,
    size: SIZE_1L,
    price: variantPrice(v),
    compareAtPrice: null,
    active: true,
  }));

  return {
    id: pid,
    slug,
    name: raw.title,
    flavour: raw.title,
    position,
    subscriptionEligible: true,
    forwardNote: unavailable('D-51', 'Forward notes are not supplied via Medusa yet.'),
    descriptor: 'Caffeine Free',
    base: 'Rooibos',
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
              price: unavailable('D-14', 'No variant price from Medusa.'),
              compareAtPrice: null,
              active: true,
            },
          ],
    images: [],
    status: raw.status === 'published' || raw.status === 'PUBLISHED' ? 'active' : 'draft',
  };
};
