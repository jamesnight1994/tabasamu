'use client';

import { Check, X } from 'lucide-react';

type AdminProductsSubscribeBadgeProps = {
  enabled: boolean;
};

export function AdminProductsSubscribeBadge({ enabled }: AdminProductsSubscribeBadgeProps) {
  if (enabled) {
    return (
      <span className="inline-flex w-fit items-center gap-1 rounded-lg bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-800">
        <Check className="size-3 shrink-0 text-sky-800" aria-hidden />
        Yes
      </span>
    );
  }

  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-600">
      <X className="size-3 shrink-0 text-zinc-600" aria-hidden />
      No
    </span>
  );
}
