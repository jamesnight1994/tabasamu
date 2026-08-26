'use client';

import { Plus, Search } from 'lucide-react';
import { Button, Input, Label, TextField } from '@heroui/react';

type AdminProductsToolbarProps = {
  title?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAdd?: () => void;
  addDisabled?: boolean;
};

export function AdminProductsToolbar({
  title = 'Products',
  searchQuery,
  onSearchChange,
  onAdd,
  addDisabled = false,
}: AdminProductsToolbarProps) {
  return (
    <div className="admin-products-toolbar flex shrink-0 items-center justify-between border-b border-zinc-100 bg-white pb-2 pt-1">
      <h2 className="admin-products-toolbar__title pt-2 font-body text-lg font-medium text-zinc-700">
        {title}
      </h2>
      <div className="admin-products-toolbar__actions flex items-center gap-2">
        <TextField aria-label="Search products" className="admin-products-toolbar__search relative w-full max-w-xs">
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
        {onAdd ? (
          <Button
            isIconOnly
            aria-label="Add product"
            variant="primary"
            className="admin-products-toolbar__add"
            isDisabled={addDisabled}
            onPress={onAdd}
          >
            <Plus className="size-5" aria-hidden />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
