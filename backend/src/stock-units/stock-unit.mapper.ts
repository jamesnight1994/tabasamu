import type { StockUnit, StockUnitStatus } from '@prisma/client';

/**
 * API shape for a serialized stock unit. The opaque `code` is the external
 * handle (what a QR encodes and what scans send back); the internal cuid `id`
 * is not exposed.
 */
export type ApiStockUnit = {
  code: string;
  status: StockUnitStatus;
  variantId: string | null;
  batchId: string | null;
  createdAt: string;
  updatedAt: string;
  activatedAt: string | null;
  soldAt: string | null;
};

export function toApiStockUnit(u: StockUnit): ApiStockUnit {
  return {
    code: u.code,
    status: u.status,
    variantId: u.variantId,
    batchId: u.batchId,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    activatedAt: u.activatedAt ? u.activatedAt.toISOString() : null,
    soldAt: u.soldAt ? u.soldAt.toISOString() : null,
  };
}
