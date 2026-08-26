import { describe, expect, it } from 'vitest';
import type { NestApiProduct } from '../../src/adapters/http/map-nest-product';
import { toAdminProductRow } from '../../src/utils/admin/products/products-display';
import { filterAdminProducts } from '../../src/utils/admin/products/products-search';

const sampleProduct: NestApiProduct = {
  id: 'prod_grape-ginger',
  slug: 'grape-ginger',
  name: 'Grape Ginger',
  flavour: 'Grape Ginger',
  position: 1,
  subscriptionEligible: true,
  descriptor: { available: true, value: 'Caffeine Free' },
  base: { available: true, value: 'Rooibos' },
  status: 'draft',
  variants: [
    {
      id: 'var_1',
      productId: 'prod_grape-ginger',
      sku: 'TS-GRAPEG-1L',
      active: true,
      stockOnHand: 24,
    },
    {
      id: 'var_2',
      productId: 'prod_grape-ginger',
      sku: 'TS-GRAPEG-1L-OLD',
      active: false,
      stockOnHand: 6,
    },
  ],
};

describe('toAdminProductRow', () => {
  it('maps Nest product fields into admin table rows', () => {
    const row = toAdminProductRow(sampleProduct);

    expect(row).toEqual({
      id: 'prod_grape-ginger',
      name: 'Grape Ginger',
      slug: 'grape-ginger',
      flavour: 'Grape Ginger',
      status: 'draft',
      position: 1,
      subscriptionEligible: true,
      primarySku: 'TS-GRAPEG-1L',
      stockOnHand: 30,
      descriptorLabel: 'Caffeine Free',
      canPublish: true,
      canArchive: false,
    });
  });

  it('marks active products as archivable', () => {
    const row = toAdminProductRow({ ...sampleProduct, status: 'active' });
    expect(row.canPublish).toBe(false);
    expect(row.canArchive).toBe(true);
  });

  it('shows Pending when descriptor is unavailable', () => {
    const row = toAdminProductRow({
      ...sampleProduct,
      descriptor: { available: false, decision: 'D-13', note: 'Missing' },
    });
    expect(row.descriptorLabel).toBe('Pending');
  });
});

describe('filterAdminProducts', () => {
  const rows = [
    toAdminProductRow(sampleProduct),
    toAdminProductRow({
      ...sampleProduct,
      id: 'prod_pineapple',
      slug: 'pineapple',
      name: 'Pineapple',
      flavour: 'Pineapple',
      variants: [],
    }),
  ];

  it('returns all rows when search is empty', () => {
    expect(filterAdminProducts(rows, '')).toHaveLength(2);
  });

  it('filters by name, slug, sku, and status', () => {
    expect(filterAdminProducts(rows, 'pineapple')).toHaveLength(1);
    expect(filterAdminProducts(rows, 'TS-GRAPEG-1L')).toHaveLength(1);
    expect(filterAdminProducts(rows, 'draft')).toHaveLength(2);
    expect(filterAdminProducts(rows, 'missing-value')).toHaveLength(0);
  });
});
