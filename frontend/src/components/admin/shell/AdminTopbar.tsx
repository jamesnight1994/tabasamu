'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@heroui/react';
import { Logo } from '../../primitives/Logo';
import { AdminProfileMenu } from './AdminProfileMenu';
import { useAdminShell } from './AdminShellProvider';

export function AdminTopbar() {
  const { toggleSidebar } = useAdminShell();

  return (
    <header className="admin-shell-topbar">
      <div className="flex items-center gap-2">
        <Button
          aria-label="Toggle navigation menu"
          className="admin-shell-topbar-menu-button ml-1 md:hidden"
          variant="ghost"
          onPress={toggleSidebar}
        >
          <Menu size={22} aria-hidden />
        </Button>
        <Link
          href="/dashboard"
          aria-label="Tabasamu Admin — dashboard"
          className="flex items-center gap-2 px-2 no-underline"
          style={{ color: 'var(--admin-topnav-fg, #f8fafc)' }}
        >
          <span className="lg:hidden">
            <Logo variant="monogram" tone="dark" width={40} priority decorative clearSpace={0} />
          </span>
          <span className="hidden lg:block">
            <Logo variant="full" width={160} priority decorative clearSpace={0} />
          </span>
        </Link>
      </div>
      <div className="flex items-center pr-2">
        <AdminProfileMenu />
      </div>
    </header>
  );
}
