import { AdminApiError, isAdminApiError } from '../../../lib/admin/admin-api-error';
import {
  StockUnitClientError,
  type StockErrorKind,
} from './stock-unit-types';

const KIND_COPY: Record<StockErrorKind, string> = {
  unknown_code: 'This code is not in the system. Check the print batch or try again.',
  already_in_stock: 'This bottle is already activated and in stock.',
  already_sold: 'This bottle is already marked sold.',
  void: 'This code has been voided. Print a new label.',
  not_activated: 'This label was never activated. Bind a SKU before fulfilling.',
  invalid_variant: 'Choose a valid product / SKU.',
  invalid_size: 'Enter a batch size between 1 and 200.',
  unknown: 'Could not complete this scan. Try again.',
};

const MESSAGE_KIND: Array<[RegExp, StockErrorKind]> = [
  [/unknown code|not found|no stock unit/i, 'unknown_code'],
  [/already sold|status is sold/i, 'already_sold'],
  [/already in[_ ]stock|already activated/i, 'already_in_stock'],
  [/void/i, 'void'],
  [/printed|never activated|not activated/i, 'not_activated'],
  [/invalid variant|unknown variant/i, 'invalid_variant'],
  [/batch size|invalid size/i, 'invalid_size'],
];

export function stockErrorMessage(kind: StockErrorKind): string {
  return KIND_COPY[kind];
}

export function kindFromMessage(message: string): StockErrorKind {
  for (const [pattern, kind] of MESSAGE_KIND) {
    if (pattern.test(message)) return kind;
  }
  return 'unknown';
}

export function toStockUnitClientError(error: unknown): StockUnitClientError {
  if (error instanceof StockUnitClientError) return error;

  if (isAdminApiError(error)) {
    const kind = kindFromAdminError(error);
    return new StockUnitClientError(kind, stockErrorMessage(kind), error.status);
  }

  if (error instanceof Error && error.message) {
    const kind = kindFromMessage(error.message);
    return new StockUnitClientError(kind, stockErrorMessage(kind));
  }

  return new StockUnitClientError('unknown', stockErrorMessage('unknown'));
}

function kindFromAdminError(error: AdminApiError): StockErrorKind {
  if (error.status === 404) return 'unknown_code';
  if (error.status === 400 || error.status === 422) {
    return kindFromMessage(error.message);
  }
  return kindFromMessage(error.message);
}
