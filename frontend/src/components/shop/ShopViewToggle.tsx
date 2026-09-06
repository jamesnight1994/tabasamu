'use client';

import { LayoutGrid, List } from 'lucide-react';
import { SHOP_PAGE } from '../../content/shop';
import { cn } from '../../lib/utils/cn';

export type ShopViewMode = 'grid' | 'list';

type ShopViewToggleProps = Readonly<{
  view: ShopViewMode;
  onChange: (view: ShopViewMode) => void;
}>;

const TOGGLE_BTN = cn(
  'inline-flex size-10 items-center justify-center rounded-[--radius-sm]',
  'text-[--color-ink-muted] transition-colors duration-[--duration-fast]',
  'hover:bg-[--color-surface] hover:text-[--color-ink]',
  'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2'
);

export function ShopViewToggle({ view, onChange }: ShopViewToggleProps) {
  return (
    <div
      className="shop-view-toggle inline-flex items-center gap-0.5"
      role="group"
      aria-label="Listing layout"
    >
      <button
        type="button"
        aria-pressed={view === 'grid'}
        aria-label={SHOP_PAGE.catalogue.viewGridLabel}
        className={TOGGLE_BTN}
        onClick={() => onChange('grid')}
      >
        <LayoutGrid className="size-[1.125rem]" aria-hidden strokeWidth={1.75} />
      </button>
      <button
        type="button"
        aria-pressed={view === 'list'}
        aria-label={SHOP_PAGE.catalogue.viewListLabel}
        className={TOGGLE_BTN}
        onClick={() => onChange('list')}
      >
        <List className="size-[1.125rem]" aria-hidden strokeWidth={1.75} />
      </button>
    </div>
  );
}
