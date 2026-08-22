'use client';

import { Minus } from 'lucide-react';
import type { AdminProductsGridColumn } from '../../../utils/admin/products/products-types';
import type { AdminProductRow } from '../../../utils/admin/products/products-types';
import { AdminProductsStatusBadge } from './AdminProductsStatusBadge';
import { AdminProductsSubscribeBadge } from './AdminProductsSubscribeBadge';

type AdminProductsTableCellProps = {
  column: AdminProductsGridColumn;
  row: AdminProductRow;
};

function EmptyValue() {
  return <Minus className="size-4 text-zinc-300" aria-hidden />;
}

export function AdminProductsTableCell({ column, row }: AdminProductsTableCellProps) {
  if (column.id === 'actions') {
    return null;
  }

  const value = row[column.id as keyof AdminProductRow];

  if (column.type === 'status' && typeof value === 'string') {
    return <AdminProductsStatusBadge status={value as AdminProductRow['status']} />;
  }

  if (column.type === 'boolean') {
    return <AdminProductsSubscribeBadge enabled={Boolean(value)} />;
  }

  if (column.type === 'pending') {
    const pending = value === 'Pending';
    return (
      <span
        className={`font-body text-sm ${
          pending ? 'text-amber-700' : 'text-zinc-700'
        }`}
      >
        {String(value ?? '—')}
      </span>
    );
  }

  if (column.type === 'number') {
    return (
      <span className="font-body text-sm tabular-nums text-zinc-700">
        {typeof value === 'number' ? value : '—'}
      </span>
    );
  }

  if (value == null || value === '') {
    return (
      <div className="flex items-center">
        <EmptyValue />
      </div>
    );
  }

  return (
    <span className="block font-body text-sm text-zinc-700">
      {String(value)}
    </span>
  );
}
