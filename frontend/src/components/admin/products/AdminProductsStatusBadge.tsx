'use client';

import { Archive, CheckCircle2, Clock3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AdminProductStatus } from '../../../utils/admin/products/products-types';

const STATUS_STYLES: Record<
  AdminProductStatus,
  { label: string; className: string; icon: LucideIcon; iconClassName: string }
> = {
  draft: {
    label: 'Draft',
    className: 'bg-amber-100 text-amber-800',
    icon: Clock3,
    iconClassName: 'text-amber-800',
  },
  active: {
    label: 'Active',
    className: 'bg-emerald-100 text-emerald-800',
    icon: CheckCircle2,
    iconClassName: 'text-emerald-800',
  },
  archived: {
    label: 'Archived',
    className: 'bg-zinc-200 text-zinc-700',
    icon: Archive,
    iconClassName: 'text-zinc-700',
  },
};

type AdminProductsStatusBadgeProps = {
  status: AdminProductStatus;
};

export function AdminProductsStatusBadge({ status }: AdminProductsStatusBadgeProps) {
  const config = STATUS_STYLES[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${config.className}`}
    >
      <Icon className={`size-3 shrink-0 ${config.iconClassName}`} aria-hidden />
      {config.label}
    </span>
  );
}
