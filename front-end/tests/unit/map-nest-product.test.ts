import { describe, it, expect } from 'vitest';
import { mapNestProduct, type NestApiProduct } from '../../src/adapters/http/map-nest-product';
import { isUnavailable, PLACEHOLDER_PRICES } from '../../src/domain/catalogue';

describe('mapNestProduct', () => {
  const raw: NestApiProduct = {
    id: 'prod_grape-ginger',
    slug: 'grape-ginger',
    name: 'Grape Ginger',
    flavour: 'Grape Ginger',
    position: 1,
    subscriptionEligible: true,
    descriptor: { available: true, value: 'Caffeine Free' },
    base: { available: true, value: 'Rooibos' },
    forwardNote: { available: true, value: 'Black grape, fresh ginger' },
    status: 'active',
    images: [{ url: '/products/grape-ginger.jpg', alt: 'Grape Ginger', role: 'packshot' }],
    variants: [
      {
        id: 'var_grape-ginger_1l',
        productId: 'prod_grape-ginger',
        sku: 'TS-GRAPEG-1L',
        size: { code: '1L', millilitres: 1000 },
        price: {
          available: false,
          decision: 'D-14',
          note: 'Demo only',
        },
        compareAtPrice: null,
        active: true,
        stockOnHand: 24,
      },
    ],
  };

  it('maps Nest OpenAPI JSON onto domain Product', () => {
    const product = mapNestProduct(raw);
    expect(product.id).toBe('prod_grape-ginger');
    expect(product.slug).toBe('grape-ginger');
    expect(product.name).toBe('Grape Ginger');
    expect(product.position).toBe(1);
    expect(product.status).toBe('active');
    expect(product.variants).toHaveLength(1);
    expect(product.variants[0]?.sku).toBe('TS-GRAPEG-1L');
    expect(product.images).toHaveLength(1);
    expect(product.images[0]?.src).toBe('/products/grape-ginger.jpg');
    expect(product.descriptor).toBe('Caffeine Free');
    expect(product.base).toBe('Rooibos');
  });

  it('keeps D-14 price honesty while PLACEHOLDER_PRICES is true', () => {
    expect(PLACEHOLDER_PRICES).toBe(true);
    const product = mapNestProduct(raw);
    const price = product.variants[0]?.price;
    expect(price).toBeDefined();
    expect(isUnavailable(price!)).toBe(true);
    if (isUnavailable(price!)) {
      expect(price.blockedBy).toBe('D-14');
    }
  });
});
