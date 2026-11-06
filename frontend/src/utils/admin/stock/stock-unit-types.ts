export const STOCK_UNIT_STATUSES = ['printed', 'in_stock', 'sold', 'void'] as const;

export type StockUnitStatus = (typeof STOCK_UNIT_STATUSES)[number];

export type StockUnit = {
  id: string;
  code: string;
  status: StockUnitStatus;
  variantId: string | null;
  batchId: string;
  createdAt: string;
  activatedAt: string | null;
  soldAt: string | null;
};

export type StockSkuOption = {
  variantId: string;
  sku: string;
  productName: string;
  flavour: string;
};

export type StockPrintBatch = {
  batchId: string;
  units: StockUnit[];
  source: 'nest' | 'preview';
};

export type StockScanResult = {
  unit: StockUnit;
  source: 'nest' | 'preview';
};

export type StockErrorKind =
  | 'unknown_code'
  | 'already_in_stock'
  | 'already_sold'
  | 'void'
  | 'not_activated'
  | 'invalid_variant'
  | 'invalid_size'
  | 'unknown';

export class StockUnitClientError extends Error {
  readonly kind: StockErrorKind;
  readonly status?: number;

  constructor(kind: StockErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'StockUnitClientError';
    this.kind = kind;
    this.status = status;
  }
}

export function isStockUnitClientError(error: unknown): error is StockUnitClientError {
  return error instanceof StockUnitClientError;
}
