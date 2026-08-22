'use client';

import Link from 'next/link';
import type { AdminNavItem } from './admin-nav-config';

type AdminSidebarItemProps = {
  item: AdminNavItem;
  active: boolean;
  onNavigate?: () => void;
};

export function AdminSidebarItem({ item, active, onNavigate }: AdminSidebarItemProps) {
  const Icon = item.icon;
  const className = [
    'admin-shell-nav-item',
    active ? 'admin-shell-nav-item--active' : '',
    item.disabled ? 'admin-shell-nav-item--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      <Icon size={28} strokeWidth={1.75} aria-hidden />
      <span className="admin-shell-nav-item__label" title={item.tooltip ?? item.label}>
        {item.label}
      </span>
    </>
  );

  if (item.disabled) {
    return (
      <span className={className} aria-disabled="true" title={item.tooltip ?? item.label}>
        {content}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className={className}
      title={item.tooltip ?? item.label}
      onClick={onNavigate}
    >
      {content}
    </Link>
  );
}
