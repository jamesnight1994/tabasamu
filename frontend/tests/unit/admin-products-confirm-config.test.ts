import { describe, expect, it } from 'vitest';
import { getDeactivateProductConfirmCopy } from '../../src/utils/admin/products/products-confirm-config';
import type { AdminProductRow } from '../../src/utils/admin/products/products-types';

const sampleRow: AdminProductRow = {
  id: 'prod_grape-ginger',
  name: 'Grape Ginger',
  slug: 'grape-ginger',
  flavour: 'grape-ginger',
  status: 'active',
  position: 1,
  subscriptionEligible: true,
  primarySku: 'TS-GRAPEG-1L',
  stockOnHand: 24,
  descriptorLabel: 'Caffeine Free',
  canPublish: false,
  canArchive: true,
};

describe('getDeactivateProductConfirmCopy', () => {
  it('includes the product name in the confirmation message', () => {
    const copy = getDeactivateProductConfirmCopy(sampleRow);

    expect(copy.title).toBe('Deactivate product');
    expect(copy.message).toContain('Grape Ginger');
    expect(copy.confirmLabel).toBe('Deactivate');
  });
});
