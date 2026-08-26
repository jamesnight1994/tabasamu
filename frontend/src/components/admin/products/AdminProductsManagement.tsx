'use client';

import { Alert } from '@heroui/react';
import { useCallback, useState } from 'react';
import { showAdminError } from '../../../lib/admin/admin-toast';
import { useAppDispatch, useAppSelector } from '../../../redux/admin/hooks';
import {
  archiveAdminProduct,
  fetchAdminProducts,
  openProductSheet,
  publishAdminProduct,
  selectAdminProductItems,
  selectPaginatedProductRows,
  selectProductSheetSubmitLoader,
  selectProductsPaginationMeta,
  setPage,
  setRowsPerPage,
  setSearchQuery,
} from '../../../redux/admin/slices/productsSlice';
import { adminProductsService } from '../../../services/admin/admin-products-service';
import type { AdminProductRow } from '../../../utils/admin/products/products-types';
import { AdminProductsDeactivateConfirmDialog } from './AdminProductsDeactivateConfirmDialog';
import { AdminProductsGrid } from './AdminProductsGrid';
import { AdminProductsPagination } from './AdminProductsPagination';
import { AdminProductsSideSheet } from './AdminProductsSideSheet';
import { AdminProductsToolbar } from './AdminProductsToolbar';

export function AdminProductsManagement() {
  const dispatch = useAppDispatch();
  const rows = useAppSelector(selectPaginatedProductRows);
  const pagination = useAppSelector(selectProductsPaginationMeta);
  const items = useAppSelector(selectAdminProductItems);
  const listLoader = useAppSelector((state) => state.adminProducts.listLoader);
  const actionLoader = useAppSelector((state) => state.adminProducts.actionLoader);
  const submitLoader = useAppSelector(selectProductSheetSubmitLoader);
  const searchQuery = useAppSelector((state) => state.adminProducts.searchQuery);
  const error = useAppSelector((state) => state.adminProducts.error);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminProductRow | null>(null);

  const handleAdd = useCallback(() => {
    dispatch(openProductSheet({ context: 'addProduct' }));
  }, [dispatch]);

  const handleEdit = useCallback(
    (row: AdminProductRow) => {
      const cached = adminProductsService.findCachedById(items, row.id);
      if (!cached) {
        showAdminError('Product unavailable', 'Refresh the list and try again.');
        return;
      }

      dispatch(openProductSheet({ context: 'updateProduct', productId: row.id }));
    },
    [dispatch, items],
  );

  const handlePublish = useCallback(
    (row: AdminProductRow) => {
      void dispatch(publishAdminProduct(row.id));
    },
    [dispatch],
  );

  const handleDeactivate = useCallback((row: AdminProductRow) => {
    setDeactivateTarget(row);
  }, []);

  const handleCancelDeactivate = useCallback(() => {
    if (actionLoader) return;
    setDeactivateTarget(null);
  }, [actionLoader]);

  const handleConfirmDeactivate = useCallback(async () => {
    if (!deactivateTarget) return;

    const result = await dispatch(archiveAdminProduct(deactivateTarget.id));
    if (archiveAdminProduct.fulfilled.match(result)) {
      setDeactivateTarget(null);
    }
  }, [deactivateTarget, dispatch]);

  return (
    <div className="admin-products-management relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <AdminProductsToolbar
        searchQuery={searchQuery}
        onSearchChange={(value) => dispatch(setSearchQuery(value))}
        onAdd={handleAdd}
        addDisabled={listLoader || submitLoader}
      />

      {error ? (
        <div className="px-4 pt-3">
          <Alert status="danger" className="admin-products-error">
            <Alert.Title>Could not load products</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert>
        </div>
      ) : null}

      <AdminProductsGrid
        rows={rows}
        loading={listLoader}
        hasSearchQuery={Boolean(searchQuery.trim())}
        actionsDisabled={actionLoader || submitLoader}
        onEdit={handleEdit}
        onPublish={handlePublish}
        onDeactivate={handleDeactivate}
      />

      <AdminProductsPagination
        page={pagination.page}
        rowsPerPage={pagination.rowsPerPage}
        total={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={(page) => dispatch(setPage(page))}
        onRowsPerPageChange={(rowsPerPage) => dispatch(setRowsPerPage(rowsPerPage))}
      />

      <AdminProductsSideSheet />

      <AdminProductsDeactivateConfirmDialog
        row={deactivateTarget}
        loading={actionLoader}
        onCancel={handleCancelDeactivate}
        onConfirm={() => {
          void handleConfirmDeactivate();
        }}
      />
    </div>
  );
}

export function useAdminProductsBootstrap() {
  const dispatch = useAppDispatch();

  return useCallback(() => {
    void dispatch(fetchAdminProducts());
  }, [dispatch]);
}
