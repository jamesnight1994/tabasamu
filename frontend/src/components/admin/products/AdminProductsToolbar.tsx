'use client';

import { Search } from 'lucide-react';
import { Input, Label, TextField } from '@heroui/react';

type AdminProductsToolbarProps = {
  title?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
};

export function AdminProductsToolbar({
  title = 'Products',
  searchQuery,
  onSearchChange,
}: AdminProductsToolbarProps) {
  return (
    <div className="admin-products-toolbar flex shrink-0 items-center justify-between border-b border-zinc-100 bg-white pb-2 pt-1">
      <h2 className="admin-products-toolbar__title pt-2 font-body text-lg font-medium text-zinc-700">
        {title}
      </h2>
      <TextField aria-label="Search products" className="relative w-full max-w-xs">
        <Label className="sr-only">Search products</Label>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-zinc-400"
          aria-hidden
        />
        <Input
          className="h-10 pl-9"
          placeholder="Search..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </TextField>
    </div>
  );
}
