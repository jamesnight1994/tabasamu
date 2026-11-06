import { afterEach, describe, expect, it } from 'vitest';
import { kindFromMessage, stockErrorMessage } from '../../src/utils/admin/stock/stock-unit-errors';
import { stockUnitsToCsv } from '../../src/utils/admin/stock/stock-print-export';
import { toStockSkuOptions } from '../../src/utils/admin/stock/stock-sku-options';
import {
  STOCK_PREVIEW_STORAGE_KEY,
  activatePreviewUnit,
  createPreviewPrintBatch,
  fulfillPreviewUnit,
} from '../../src/utils/admin/stock/stock-preview-store';
import { StockUnitClientError } from '../../src/utils/admin/stock/stock-unit-types';
import { qrSvg } from '../../src/utils/admin/stock/qr-svg';
import type { NestApiProduct } from '../../src/adapters/http/map-nest-product';

afterEach(() => {
  sessionStorage.clear();
});

describe('preview stock status machine', () => {
  it('prints blank codes, activates, then fulfills', () => {
    const batch = createPreviewPrintBatch(2);
    expect(batch.units).toHaveLength(2);
    expect(batch.units[0].status).toBe('printed');
    expect(batch.units[0].variantId).toBeNull();

    const activated = activatePreviewUnit(batch.units[0].code, 'var_1');
    expect(activated.unit.status).toBe('in_stock');
    expect(activated.unit.variantId).toBe('var_1');

    const sold = fulfillPreviewUnit(batch.units[0].code);
    expect(sold.unit.status).toBe('sold');
  });

  it('rejects fulfill before activate and unknown codes', () => {
    const batch = createPreviewPrintBatch(1);
    expect(() => fulfillPreviewUnit(batch.units[0].code)).toThrow(StockUnitClientError);
    expect(() => activatePreviewUnit('nope', 'var_1')).toThrow(/not in the system/);
  });

  it('rejects a second activate', () => {
    const batch = createPreviewPrintBatch(1);
    activatePreviewUnit(batch.units[0].code, 'var_1');
    expect(() => activatePreviewUnit(batch.units[0].code, 'var_2')).toThrow(/already activated/);
  });

  it('persists units in sessionStorage', () => {
    createPreviewPrintBatch(1);
    const raw = sessionStorage.getItem(STOCK_PREVIEW_STORAGE_KEY);
    expect(raw).toContain('"printed"');
  });
});

describe('stock helpers', () => {
  it('maps product variants to SKU options', () => {
    const product: NestApiProduct = {
      id: 'p1',
      slug: 'grape-ginger',
      name: 'Grape Ginger',
      flavour: 'Grape Ginger',
      position: 1,
      subscriptionEligible: false,
      status: 'active',
      variants: [{ id: 'v1', productId: 'p1', sku: 'TS-GRAPEG-1L', active: true }],
    };
    expect(toStockSkuOptions([product])).toEqual([
      {
        variantId: 'v1',
        sku: 'TS-GRAPEG-1L',
        productName: 'Grape Ginger',
        flavour: 'Grape Ginger',
      },
    ]);
  });

  it('maps API wording to operator copy', () => {
    expect(kindFromMessage('already sold')).toBe('already_sold');
    expect(stockErrorMessage('already_sold')).toMatch(/already marked sold/);
  });

  it('exports CSV without flavour columns', () => {
    const csv = stockUnitsToCsv([
      {
        id: '1',
        code: 'su_abc',
        status: 'printed',
        variantId: null,
        batchId: 'batch_1',
        createdAt: '2026-10-25T00:00:00.000Z',
        activatedAt: null,
        soldAt: null,
      },
    ]);
    expect(csv).toContain('code,status,batchId,createdAt');
    expect(csv).toContain('su_abc');
    expect(csv).not.toContain('flavour');
  });

  it('renders a QR svg for a stock code', () => {
    const svg = qrSvg('su_abc123');
    expect(svg).toContain('<svg');
    expect(svg).toContain('rect');
  });
});
