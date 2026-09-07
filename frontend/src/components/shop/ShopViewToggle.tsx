'use client';

/**
 * SHOP VIEW TOGGLE
 *
 * Segmented control in the PrimeReact SelectButton pattern:
 * shared outer shell, joined option edges, selected fill, cursor-pointer
 * on options that can be chosen.
 */

import { LayoutGrid, List } from 'lucide-react';
import { SHOP_PAGE } from '../../content/shop';
import { cn } from '../../lib/utils/cn';

export type ShopViewMode = 'grid' | 'list';

type ShopViewToggleProps = Readonly<{
  view: ShopViewMode;
  onChange: (view: ShopViewMode) => void;
}>;

const OPTIONS = [
  {
    value: 'grid' as const,
    label: SHOP_PAGE.catalogue.viewGridLabel,
    Icon: LayoutGrid,
  },
  {
    value: 'list' as const,
    label: SHOP_PAGE.catalogue.viewListLabel,
    Icon: List,
  },
];

export function ShopViewToggle({ view, onChange }: ShopViewToggleProps) {
  return (
    <div
      className="shop-view-toggle"
      role="group"
      aria-label="Listing layout"
    >
      {OPTIONS.map(({ value, label, Icon }, index) => {
        const selected = view === value;
        const isLast = index === OPTIONS.length - 1;

        return (
          <button
            key={value}
            type="button"
            aria-pressed={selected}
            aria-label={label}
            className={cn(
              'shop-view-toggle__option',
              isLast && 'shop-view-toggle__option--last',
              selected
                ? 'shop-view-toggle__option--selected'
                : 'shop-view-toggle__option--idle'
            )}
            onClick={() => {
              if (!selected) onChange(value);
            }}
          >
            <Icon className="size-[1.125rem]" aria-hidden strokeWidth={1.75} />
          </button>
        );
      })}
    </div>
  );
}
