import {
  StockUnitClientError,
  type StockPrintBatch,
  type StockScanResult,
  type StockUnit,
} from './stock-unit-types';
import { stockErrorMessage } from './stock-unit-errors';

export const STOCK_PREVIEW_STORAGE_KEY = 'tabasamu.admin.stock-units';
export const STOCK_PREVIEW_LAST_SKU_KEY = 'tabasamu.admin.stock-last-sku';
export const MIN_PRINT_BATCH = 1;
export const MAX_PRINT_BATCH = 200;

type PreviewState = {
  units: StockUnit[];
};

const nowIso = () => new Date().toISOString();

const randomId = (prefix: string): string => {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes, (byte) => (byte % 36).toString(36)).join('');
  return `${prefix}_${body}`;
};

const emptyState = (): PreviewState => ({ units: [] });

function readState(): PreviewState {
  if (typeof window === 'undefined') return emptyState();
  try {
    const raw = window.sessionStorage.getItem(STOCK_PREVIEW_STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as PreviewState;
    if (!Array.isArray(parsed.units)) return emptyState();
    return parsed;
  } catch {
    return emptyState();
  }
}

function writeState(state: PreviewState): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(STOCK_PREVIEW_STORAGE_KEY, JSON.stringify(state));
}

function findUnit(state: PreviewState, code: string): StockUnit | undefined {
  const normalized = code.trim();
  return state.units.find((unit) => unit.code === normalized);
}

export function createPreviewPrintBatch(size: number): StockPrintBatch {
  if (!Number.isInteger(size) || size < MIN_PRINT_BATCH || size > MAX_PRINT_BATCH) {
    throw new StockUnitClientError('invalid_size', stockErrorMessage('invalid_size'));
  }

  const state = readState();
  const batchId = randomId('batch');
  const createdAt = nowIso();
  const units: StockUnit[] = Array.from({ length: size }, () => ({
    id: randomId('su'),
    code: randomId('su'),
    status: 'printed',
    variantId: null,
    batchId,
    createdAt,
    activatedAt: null,
    soldAt: null,
  }));

  state.units.push(...units);
  writeState(state);

  return { batchId, units, source: 'preview' };
}

export function activatePreviewUnit(code: string, variantId: string): StockScanResult {
  const trimmedVariant = variantId.trim();
  if (!trimmedVariant) {
    throw new StockUnitClientError('invalid_variant', stockErrorMessage('invalid_variant'));
  }

  const state = readState();
  const unit = findUnit(state, code);
  if (!unit) {
    throw new StockUnitClientError('unknown_code', stockErrorMessage('unknown_code'));
  }
  if (unit.status === 'in_stock') {
    throw new StockUnitClientError('already_in_stock', stockErrorMessage('already_in_stock'));
  }
  if (unit.status === 'sold') {
    throw new StockUnitClientError('already_sold', stockErrorMessage('already_sold'));
  }
  if (unit.status === 'void') {
    throw new StockUnitClientError('void', stockErrorMessage('void'));
  }

  unit.status = 'in_stock';
  unit.variantId = trimmedVariant;
  unit.activatedAt = nowIso();
  writeState(state);
  persistLastSku(trimmedVariant);

  return { unit: { ...unit }, source: 'preview' };
}

export function fulfillPreviewUnit(code: string): StockScanResult {
  const state = readState();
  const unit = findUnit(state, code);
  if (!unit) {
    throw new StockUnitClientError('unknown_code', stockErrorMessage('unknown_code'));
  }
  if (unit.status === 'printed') {
    throw new StockUnitClientError('not_activated', stockErrorMessage('not_activated'));
  }
  if (unit.status === 'sold') {
    throw new StockUnitClientError('already_sold', stockErrorMessage('already_sold'));
  }
  if (unit.status === 'void') {
    throw new StockUnitClientError('void', stockErrorMessage('void'));
  }

  unit.status = 'sold';
  unit.soldAt = nowIso();
  writeState(state);

  return { unit: { ...unit }, source: 'preview' };
}

export function voidPreviewUnit(code: string): StockScanResult {
  const state = readState();
  const unit = findUnit(state, code);
  if (!unit) {
    throw new StockUnitClientError('unknown_code', stockErrorMessage('unknown_code'));
  }
  if (unit.status === 'sold') {
    throw new StockUnitClientError('already_sold', stockErrorMessage('already_sold'));
  }
  if (unit.status === 'void') {
    throw new StockUnitClientError('void', stockErrorMessage('void'));
  }

  unit.status = 'void';
  writeState(state);

  return { unit: { ...unit }, source: 'preview' };
}

export function listPreviewUnits(): StockUnit[] {
  return readState().units.slice().reverse();
}

export function persistLastSku(variantId: string): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(STOCK_PREVIEW_LAST_SKU_KEY, variantId);
}

export function readLastSku(): string | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(STOCK_PREVIEW_LAST_SKU_KEY);
}
