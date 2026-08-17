/**
 * Map Medusa Store API product payloads → Tabasamu domain `Product`.
 * Exported for unit tests (no live Medusa required).
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

export interface MedusaStoreImage {
  id?: string;
  url?: string | null;
  alt?: string | null;
  rank?: number | null;
}

export interface MedusaStoreProduct {
  id: string;
  title: string;
  handle?: string | null;
  status?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  images?: MedusaStoreImage[] | null;
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

/**
 * Make Medusa file URLs absolute and reachable by `next/image`.
 *
 * Medusa Store returns browser-facing hosts (e.g. http://localhost:9000/static/…).
 * The Image optimizer fetches that URL from the Next process — in Docker that is
 * the app container, where localhost:9000 is refused. Rewrite public API hosts to
 * MEDUSA_BACKEND_URL (e.g. http://medusa:9000) on the server only; the browser
 * still loads via `/_next/image?url=…` (same-origin).
 */
export const resolveMedusaMediaUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  let absolute = trimmed;
  if (!/^(https?:|data:|blob:)/i.test(trimmed)) {
    const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
    if (!base) return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    absolute = `${base}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
  }

  if (typeof window !== 'undefined') return absolute;

  const internal = (process.env.MEDUSA_BACKEND_URL || '').replace(/\/$/, '');
  if (!internal) return absolute;

  try {
    const media = new URL(absolute);
    const publicBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
    const publicHost = publicBase ? new URL(publicBase).host : '';
    const rewrite =
      media.host === 'localhost:9000' ||
      media.host === '127.0.0.1:9000' ||
      (publicHost !== '' && media.host === publicHost);
    if (!rewrite) return absolute;

    const backend = new URL(internal);
    media.protocol = backend.protocol;
    media.host = backend.host; // hostname + port
    return media.toString();
  } catch {
    return absolute;
  }
};

const mapImages = (raw: MedusaStoreProduct, productName: string): ProductImage[] => {
  const fromGallery = (raw.images ?? [])
    .map((img, i) => {
      const url = img.url?.trim();
      if (!url) return null;
      return {
        src: resolveMedusaMediaUrl(url),
        alt: img.alt?.trim() || productName,
        width: 1200,
        height: 1500,
        role: (i === 0 ? 'hero' : 'packshot') as ProductImage['role'],
      };
    })
    .filter((x): x is ProductImage => x !== null);

  if (fromGallery.length > 0) return fromGallery;

  const thumb = raw.thumbnail?.trim();
  if (!thumb) return [];
  return [
    {
      src: resolveMedusaMediaUrl(thumb),
      alt: productName,
      width: 1200,
      height: 1500,
      role: 'hero',
    },
  ];
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

  const images = mapImages(raw, raw.title);

  const mapped: Product = {
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
    images,
    status: raw.status === 'published' || raw.status === 'PUBLISHED' ? 'active' : 'draft',
  };

  return mapped;
};
