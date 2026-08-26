import type { AdminProductRow } from './products-types';

export type ProductConfirmCopy = {
  title: string;
  message: string;
  confirmLabel: string;
};

export function getDeactivateProductConfirmCopy(row: AdminProductRow): ProductConfirmCopy {
  return {
    title: 'Deactivate product',
    message: `Deactivate "${row.name}"? The product will be archived and removed from the active catalogue.`,
    confirmLabel: 'Deactivate',
  };
}
