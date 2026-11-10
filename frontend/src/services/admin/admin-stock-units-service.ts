import { isAdminApiError } from '../../lib/admin/admin-api-error';
import { ADMIN_API_PATHS } from '../../lib/admin/api-paths';
import { adminWebApi } from '../../lib/admin/web-api';
import { adminProductsService } from './admin-products-service';
import {
  FALLBACK_STOCK_SKU_OPTIONS,
  toStockSkuOptions,
} from '../../utils/admin/stock/stock-sku-options';
import { toStockUnitClientError } from '../../utils/admin/stock/stock-unit-errors';
import {
  activatePreviewUnit,
  createPreviewPrintBatch,
  fulfillPreviewUnit,
  listPreviewUnits,
  readLastSku,
  voidPreviewUnit,
} from '../../utils/admin/stock/stock-preview-store';
import type {
  StockPrintBatch,
  StockScanResult,
  StockSkuOption,
  StockUnit,
} from '../../utils/admin/stock/stock-unit-types';

type NestStockUnit = Partial<StockUnit> & {
  code?: string;
  status?: StockUnit['status'];
};

type NestPrintBatch = {
  batchId?: string;
  id?: string;
  units?: NestStockUnit[];
};

function mapUnit(raw: NestStockUnit, fallbackBatchId: string): StockUnit {
  return {
    id: raw.id ?? raw.code ?? '',
    code: raw.code ?? '',
    status: raw.status ?? 'printed',
    variantId: raw.variantId ?? null,
    batchId: raw.batchId ?? fallbackBatchId,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    activatedAt: raw.activatedAt ?? null,
    soldAt: raw.soldAt ?? null,
  };
}

function shouldUsePreview(error: unknown): boolean {
  if (!isAdminApiError(error)) return true;
  if (error.status === 501 || error.status === 502 || error.status === 503) return true;
  // Nest missing-route 404: "Cannot POST /v1/admin/stock-units/..."
  // A real unknown-code 404 must stay an error — do not invent a preview unit.
  if (error.status === 404 && /cannot (get|post|put|patch|delete)/i.test(error.message)) {
    return true;
  }
  return false;
}

export const adminStockUnitsService = {
  async printBatch(size: number): Promise<StockPrintBatch> {
    try {
      const response = await adminWebApi.createRecord<NestPrintBatch>(
        ADMIN_API_PATHS.stockUnitBatches,
        { size },
      );
      const batchId = response.batchId ?? response.id ?? 'batch';
      const units = (response.units ?? []).map((unit) => mapUnit(unit, batchId));
      if (units.length === 0) {
        return createPreviewPrintBatch(size);
      }
      return { batchId, units, source: 'nest' };
    } catch (error) {
      if (shouldUsePreview(error)) {
        return createPreviewPrintBatch(size);
      }
      throw toStockUnitClientError(error);
    }
  },

  async activate(code: string, variantId: string): Promise<StockScanResult> {
    try {
      const unit = await adminWebApi.postRecord<NestStockUnit>(
        ADMIN_API_PATHS.stockUnitActivate(code),
        { variantId },
      );
      return { unit: mapUnit(unit, unit.batchId ?? ''), source: 'nest' };
    } catch (error) {
      if (shouldUsePreview(error)) {
        return activatePreviewUnit(code, variantId);
      }
      throw toStockUnitClientError(error);
    }
  },

  async fulfill(code: string): Promise<StockScanResult> {
    try {
      const unit = await adminWebApi.postRecord<NestStockUnit>(
        ADMIN_API_PATHS.stockUnitFulfill(code),
      );
      return { unit: mapUnit(unit, unit.batchId ?? ''), source: 'nest' };
    } catch (error) {
      if (shouldUsePreview(error)) {
        return fulfillPreviewUnit(code);
      }
      throw toStockUnitClientError(error);
    }
  },

  async void(code: string): Promise<StockScanResult> {
    try {
      const unit = await adminWebApi.postRecord<NestStockUnit>(
        ADMIN_API_PATHS.stockUnitVoid(code),
      );
      return { unit: mapUnit(unit, unit.batchId ?? ''), source: 'nest' };
    } catch (error) {
      if (shouldUsePreview(error)) {
        return voidPreviewUnit(code);
      }
      throw toStockUnitClientError(error);
    }
  },

  async listSkuOptions(): Promise<StockSkuOption[]> {
    try {
      const products = await adminProductsService.list();
      const options = toStockSkuOptions(products);
      return options.length > 0 ? options : FALLBACK_STOCK_SKU_OPTIONS;
    } catch {
      return FALLBACK_STOCK_SKU_OPTIONS;
    }
  },

  recentPreviewUnits(): StockUnit[] {
    return listPreviewUnits();
  },

  lastSku(): string | null {
    return readLastSku();
  },
};
