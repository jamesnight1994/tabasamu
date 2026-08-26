'use client';

import { Ban, Pencil, UploadCloud } from 'lucide-react';
import { Button } from '@heroui/react';
import type { AdminProductRow } from '../../../utils/admin/products/products-types';

type AdminProductsRowActionsProps = {
  row: AdminProductRow;
  disabled?: boolean;
  onEdit: (row: AdminProductRow) => void;
  onPublish: (row: AdminProductRow) => void;
  onDeactivate: (row: AdminProductRow) => void;
};

export function AdminProductsRowActions({
  row,
  disabled = false,
  onEdit,
  onPublish,
  onDeactivate,
}: AdminProductsRowActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      <Button
        isIconOnly
        aria-label={`Edit ${row.name}`}
        className="admin-products-action admin-products-action--edit size-11 min-h-11 min-w-11 rounded-full"
        isDisabled={disabled}
        variant="secondary"
        onPress={() => onEdit(row)}
      >
        <Pencil size={18} aria-hidden />
      </Button>

      {row.canPublish ? (
        <Button
          isIconOnly
          aria-label={`Publish ${row.name}`}
          className="admin-products-action admin-products-action--publish size-11 min-h-11 min-w-11 rounded-full"
          isDisabled={disabled}
          variant="secondary"
          onPress={() => onPublish(row)}
        >
          <UploadCloud size={18} aria-hidden />
        </Button>
      ) : null}

      {row.canArchive ? (
        <Button
          isIconOnly
          aria-label={`Deactivate ${row.name}`}
          className="admin-products-action admin-products-action--deactivate size-11 min-h-11 min-w-11 rounded-full"
          isDisabled={disabled}
          variant="secondary"
          onPress={() => onDeactivate(row)}
        >
          <Ban size={18} aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
