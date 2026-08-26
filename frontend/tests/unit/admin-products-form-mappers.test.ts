import { describe, expect, it } from 'vitest';
import type { NestApiProduct } from '../../src/adapters/http/map-nest-product';
import {
  buildCreateProductPayload,
  buildUpdateProductPayload,
  pendingToInput,
  productToFormValues,
} from '../../src/utils/admin/products/products-form-mappers';
import { adminProductCreateSchema } from '../../src/utils/admin/products/products-form-schema';

const sampleProduct: NestApiProduct = {
  id: 'prod_grape-ginger',
  slug: 'grape-ginger',
  name: 'Grape Ginger',
  flavour: 'grape-ginger',
  position: 2,
  subscriptionEligible: true,
  descriptor: { available: true, value: 'Caffeine Free' },
  base: { available: true, value: 'Rooibos' },
  forwardNote: { available: false, decision: 'D-51', note: 'Pending' },
  status: 'draft',
  variants: [
    {
      id: 'var_1',
      productId: 'prod_grape-ginger',
      sku: 'TS-GRAPEG-1L',
      active: true,
      stockOnHand: 24,
    },
  ],
};

describe('products-form-mappers', () => {
  it('maps pending fields to empty strings when unavailable', () => {
    expect(pendingToInput({ available: false, decision: 'D-13' })).toBe('');
    expect(pendingToInput({ available: true, value: 'Fresh' })).toBe('Fresh');
  });

  it('maps Nest product into admin form values', () => {
    expect(productToFormValues(sampleProduct)).toEqual({
      name: 'Grape Ginger',
      slug: 'grape-ginger',
      flavour: 'grape-ginger',
      position: 2,
      subscriptionEligible: true,
      descriptor: 'Caffeine Free',
      base: 'Rooibos',
      forwardNote: '',
      primarySku: 'TS-GRAPEG-1L',
      stockOnHand: 24,
    });
  });

  it('builds create payload with draft status and primary variant', () => {
    const payload = buildCreateProductPayload({
      name: 'Passion',
      slug: 'passion',
      flavour: 'passion',
      position: 3,
      subscriptionEligible: false,
      descriptor: 'Bright',
      base: '',
      forwardNote: '',
      primarySku: 'TS-PASSION-1L',
      stockOnHand: 10,
    });

    expect(payload).toEqual({
      slug: 'passion',
      name: 'Passion',
      flavour: 'passion',
      position: 3,
      subscriptionEligible: false,
      status: 'draft',
      descriptor: 'Bright',
      base: null,
      forwardNote: null,
      variants: [
        {
          sku: 'TS-PASSION-1L',
          stockOnHand: 10,
          active: true,
          sizeCode: '1l',
          millilitres: 1000,
        },
      ],
    });
  });

  it('builds update payload without slug or variants', () => {
    const payload = buildUpdateProductPayload(productToFormValues(sampleProduct));

    expect(payload).toEqual({
      name: 'Grape Ginger',
      flavour: 'grape-ginger',
      position: 2,
      subscriptionEligible: true,
      descriptor: 'Caffeine Free',
      base: 'Rooibos',
      forwardNote: null,
    });
  });
});

describe('adminProductCreateSchema', () => {
  it('accepts valid slug patterns', async () => {
    await expect(
      adminProductCreateSchema.validate({
        name: 'Grape Ginger',
        slug: 'grape-ginger',
        flavour: 'grape-ginger',
        position: 1,
        subscriptionEligible: true,
        primarySku: 'TS-1',
        stockOnHand: 0,
        descriptor: '',
        base: '',
        forwardNote: '',
      }),
    ).resolves.toBeDefined();
  });

  it('rejects invalid slug patterns', async () => {
    await expect(
      adminProductCreateSchema.validate({
        name: 'Grape Ginger',
        slug: 'Grape Ginger',
        flavour: 'grape-ginger',
        position: 1,
        subscriptionEligible: true,
        primarySku: 'TS-1',
        stockOnHand: 0,
        descriptor: '',
        base: '',
        forwardNote: '',
      }),
    ).rejects.toThrow(/lowercase/);
  });
});
