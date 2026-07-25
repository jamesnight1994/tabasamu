import { describe, it, expect } from 'vitest';
import { mapMedusaProduct, type MedusaStoreProduct } from '../../src/adapters/http/map-product';
import { isUnavailable, PLACEHOLDER_PRICES } from '../../src/domain/catalogue';

describe('mapMedusaProduct', () => {
  const raw: MedusaStoreProduct = {
    id: 'prod_01grape',
    title: 'Grape Ginger',
    handle: 'grape-ginger',
    status: 'published',
    description: 'Demo seed copy',
    variants: [
      {
        id: 'variant_01gg',
        title: '1 Litre',
        sku: 'TS-grape-ginger-1L',
        calculated_price: {
          calculated_amount: 850,
          currency_code: 'kes',
        },
      },
    ],
  };

  it('maps Medusa Store JSON onto domain Product with Tabasamu flavour slug', () => {
    const product = mapMedusaProduct(raw, 3);

    expect(product.id).toBe('prod_01grape');
    expect(product.slug).toBe('grape-ginger');
    expect(product.name).toBe('Grape Ginger');
    expect(product.position).toBe(3);
    expect(product.status).toBe('active');
    expect(product.variants).toHaveLength(1);
    expect(product.variants[0]?.sku).toBe('TS-grape-ginger-1L');
    expect(String(product.variants[0]?.id)).toBe('variant_01gg');
  });

  it('keeps D-14 price honesty while PLACEHOLDER_PRICES is true', () => {
    expect(PLACEHOLDER_PRICES).toBe(true);
    const product = mapMedusaProduct(raw, 1);
    const price = product.variants[0]?.price;
    expect(price).toBeDefined();
    expect(isUnavailable(price!)).toBe(true);
    if (isUnavailable(price!)) {
      expect(price.blockedBy).toBe('D-14');
    }
  });

  it('falls back to a known flavour slug when handle is unknown', () => {
    const product = mapMedusaProduct({ ...raw, handle: 'mystery-flavour' }, 1);
    expect(product.slug).toBe('passion');
  });
});
