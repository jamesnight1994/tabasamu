import {
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react';

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  tooltip?: string;
  disabled?: boolean;
  matchPrefix?: boolean;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    tooltip: 'Store overview',
    matchPrefix: false,
  },
  {
    label: 'Products',
    href: '/dashboard/products',
    icon: Package,
    tooltip: 'Catalogue management',
  },
  {
    label: 'Orders',
    href: '/dashboard/orders',
    icon: ShoppingCart,
    tooltip: 'Order fulfilment',
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    tooltip: 'Admin settings',
  },
];
