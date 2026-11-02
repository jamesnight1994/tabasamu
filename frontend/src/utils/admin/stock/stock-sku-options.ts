import type { NestApiProduct } from '../../../adapters/http/map-nest-product';
import type { StockSkuOption } from './stock-unit-types';

/** Seed-aligned fallbacks so activate works when the products API is down. */
export const FALLBACK_STOCK_SKU_OPTIONS: StockSkuOption[] = [
  { variantId: 'preview-var-grapeg', sku: 'TS-GRAPEG-1L', productName: 'Grape Ginger', flavour: 'Grape Ginger' },
  { variantId: 'preview-var-pineap', sku: 'TS-PINEAP-1L', productName: 'Pineapple', flavour: 'Pineapple' },
  { variantId: 'preview-var-pinegi', sku: 'TS-PINEGI-1L', productName: 'Pineapple Ginger', flavour: 'Pineapple Ginger' },
  { variantId: 'preview-var-passion', sku: 'TS-PASSION-1L', productName: 'Passion', flavour: 'Passion' },
  { variantId: 'preview-var-beetro', sku: 'TS-BEETRO-1L', productName: 'Beetroot', flavour: 'Beetroot' },
  { variantId: 'preview-var-gooseb', sku: 'TS-GOOSEB-1L', productName: 'Gooseberry', flavour: 'Gooseberry' },
];

export function toStockSkuOptions(products: NestApiProduct[]): StockSkuOption[] {
  const options: StockSkuOption[] = [];

  for (const product of products) {
    for (const variant of product.variants ?? []) {
      if (!variant.id || !variant.sku) continue;
      options.push({
        variantId: variant.id,
        sku: variant.sku,
        productName: product.name,
        flavour: product.flavour,
      });
    }
  }

  return options.sort((a, b) => a.flavour.localeCompare(b.flavour) || a.sku.localeCompare(b.sku));
}

export function skuOptionLabel(option: StockSkuOption): string {
  return `${option.flavour} · ${option.sku}`;
}
