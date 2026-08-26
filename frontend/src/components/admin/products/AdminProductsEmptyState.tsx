'use client';

import { Package } from 'lucide-react';

type AdminProductsEmptyStateProps = {
  hasSearchQuery?: boolean;
};

export function AdminProductsEmptyState({ hasSearchQuery = false }: AdminProductsEmptyStateProps) {
  return (
    <div className="flex min-h-[16rem] flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <Package className="mb-4 size-16 text-zinc-300" aria-hidden />
      <p className="font-body text-lg text-zinc-500">
        {hasSearchQuery ? 'No products match your search' : 'No products yet'}
      </p>
      <p className="mt-2 font-body text-sm text-zinc-400">
        {hasSearchQuery
          ? 'Try a different search term or clear the filter.'
          : 'Use + to add your first product.'}
      </p>
    </div>
  );
}
