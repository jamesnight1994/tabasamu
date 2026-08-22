'use client';

import { Table } from '@heroui/react';
import { ADMIN_PRODUCTS_GRID_COLUMNS } from '../../../utils/admin/products/products-grid-config';
import type { AdminProductRow } from '../../../utils/admin/products/products-types';
import { AdminProductsEmptyState } from './AdminProductsEmptyState';
import { AdminProductsRowActions } from './AdminProductsRowActions';
import { AdminProductsTableCell } from './AdminProductsTableCell';
import { AdminProductsTableSkeleton } from './AdminProductsTableSkeleton';

const DATA_COLUMNS = ADMIN_PRODUCTS_GRID_COLUMNS.filter(
  (column) => column.type !== 'actions',
);

type AdminProductsGridProps = {
  rows: AdminProductRow[];
  loading: boolean;
  hasSearchQuery: boolean;
  onEdit: (row: AdminProductRow) => void;
  onPublish: (row: AdminProductRow) => void;
  onDeactivate: (row: AdminProductRow) => void;
};

export function AdminProductsGrid({
  rows,
  loading,
  hasSearchQuery,
  onEdit,
  onPublish,
  onDeactivate,
}: AdminProductsGridProps) {
  if (loading) {
    return <AdminProductsTableSkeleton columns={DATA_COLUMNS.length + 1} rows={6} />;
  }

  if (!rows.length) {
    return <AdminProductsEmptyState hasSearchQuery={hasSearchQuery} />;
  }

  return (
    <div className="admin-products-grid flex min-h-0 flex-1 flex-col overflow-hidden">
      <Table aria-label="Products" className="admin-products-table min-h-0 flex-1" variant="secondary">
        <Table.ScrollContainer className="min-h-0 flex-1">
          <Table.Content>
            <Table.Header>
              {DATA_COLUMNS.map((column) => (
                <Table.Column
                  key={column.id}
                  id={column.id}
                  isRowHeader={column.id === 'name'}
                  className={`admin-products-table__column${
                    column.id === 'name' ? ' admin-products-table__column--first' : ''
                  }`}
                >
                  {column.label}
                </Table.Column>
              ))}
              <Table.Column
                id="actions"
                aria-label="Actions"
                className="admin-products-table__column admin-products-table__column--actions"
              />
            </Table.Header>
            <Table.Body items={rows}>
              {(row) => (
                <Table.Row id={row.id} className="admin-products-table__row">
                  {DATA_COLUMNS.map((column) => (
                    <Table.Cell
                      key={column.id}
                      className={`admin-products-table__cell${
                        column.id === 'name' ? ' admin-products-table__cell--first' : ''
                      }`}
                    >
                      <AdminProductsTableCell column={column} row={row} />
                    </Table.Cell>
                  ))}
                  <Table.Cell className="admin-products-table__cell admin-products-table__cell--actions">
                    <AdminProductsRowActions
                      row={row}
                      onEdit={onEdit}
                      onPublish={onPublish}
                      onDeactivate={onDeactivate}
                    />
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
}
