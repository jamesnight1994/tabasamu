'use client';

import { usePathname } from 'next/navigation';
import { ADMIN_NAV_ITEMS } from './admin-nav-config';
import { AdminSidebarItem } from './AdminSidebarItem';
import { useAdminShell } from './AdminShellProvider';

function isNavActive(pathname: string, href: string, matchPrefix = true): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard';
  }
  if (matchPrefix) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href;
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, closeSidebar } = useAdminShell();

  return (
    <aside
      className={`admin-shell-sidebar${sidebarOpen ? ' admin-shell-sidebar--open' : ''}`}
      aria-label="Admin navigation"
    >
      <nav className="flex flex-col">
        {ADMIN_NAV_ITEMS.map((item) => (
          <AdminSidebarItem
            key={item.href}
            item={item}
            active={isNavActive(pathname, item.href, item.matchPrefix ?? true)}
            onNavigate={closeSidebar}
          />
        ))}
      </nav>
    </aside>
  );
}
