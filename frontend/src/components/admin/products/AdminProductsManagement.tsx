'use client';

import { Alert } from '@heroui/react';
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../redux/admin/hooks';
import {
  fetchAdminProducts,
  selectPaginatedProductRows,
  selectProductsPaginationMeta,
  setPage,
  setRowsPerPage,
  setSearchQuery,
} from '../../../redux/admin/slices/productsSlice';
import type { AdminProductRow } from '../../../utils/admin/products/products-types';
import { AdminProductsGrid } from './AdminProductsGrid';
import { AdminProductsPagination } from './AdminProductsPagination';
import { AdminProductsToolbar } from './AdminProductsToolbar';

export function AdminProductsManagement() {
  const dispatch = useAppDispatch();
  const rows = useAppSelector(selectPaginatedProductRows);
  const pagination = useAppSelector(selectProductsPaginationMeta);
  const listLoader = useAppSelector((state) => state.adminProducts.listLoader);
  const searchQuery = useAppSelector((state) => state.adminProducts.searchQuery);
  const error = useAppSelector((state) => state.adminProducts.error);

  const handleEdit = useCallback((row: AdminProductRow) => {
    console.info('[admin] edit product stub', row.id);
  }, []);

  const handlePublish = useCallback((row: AdminProductRow) => {
    console.info('[admin] publish product stub', row.id);
  }, []);

  const handleDeactivate = useCallback((row: AdminProductRow) => {
    console.info('[admin] deactivate product stub', row.id);
  }, []);

  return (
    <div className="admin-products-management flex min-h-0 flex-1 flex-col overflow-hidden">
      <AdminProductsToolbar
        searchQuery={searchQuery}
        onSearchChange={(value) => dispatch(setSearchQuery(value))}
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
    </div>
  );
}

export function useAdminProductsBootstrap() {
  const dispatch = useAppDispatch();

  return useCallback(() => {
    void dispatch(fetchAdminProducts());
  }, [dispatch]);
}
