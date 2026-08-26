'use client';

import { AlertDialog, Button } from '@heroui/react';
import { getDeactivateProductConfirmCopy } from '../../../utils/admin/products/products-confirm-config';
import type { AdminProductRow } from '../../../utils/admin/products/products-types';

type AdminProductsDeactivateConfirmDialogProps = {
  row: AdminProductRow | null;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function AdminProductsDeactivateConfirmDialog({
  row,
  loading = false,
  onCancel,
  onConfirm,
}: AdminProductsDeactivateConfirmDialogProps) {
  const copy = row ? getDeactivateProductConfirmCopy(row) : null;

  return (
    <AlertDialog
      isOpen={Boolean(row)}
      onOpenChange={(open) => {
        if (!open && !loading) {
          onCancel();
        }
      }}
    >
      <AlertDialog.Backdrop
        isDismissable={false}
        isKeyboardDismissDisabled={loading}
      >
        <AlertDialog.Container size="md">
          <AlertDialog.Dialog className="admin-products-confirm-dialog font-body">
            <AlertDialog.Header className="flex items-start gap-3">
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading className="font-body text-lg font-medium text-zinc-800">
                {copy?.title ?? 'Deactivate product'}
              </AlertDialog.Heading>
            </AlertDialog.Header>

            <AlertDialog.Body>
              <p className="font-body text-sm text-zinc-600">{copy?.message}</p>
            </AlertDialog.Body>

            <AlertDialog.Footer className="flex justify-end gap-3">
              <Button variant="secondary" onPress={onCancel} isDisabled={loading}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onPress={onConfirm}
                isPending={loading}
                isDisabled={loading}
              >
                {copy?.confirmLabel ?? 'Deactivate'}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
