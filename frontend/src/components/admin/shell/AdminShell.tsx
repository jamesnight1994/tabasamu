'use client';

import { getAdminShellThemeStyle } from '../../../lib/admin/admin-shell-theme';
import { AdminShellProvider, useAdminShell } from './AdminShellProvider';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

function AdminShellFrame({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, closeSidebar } = useAdminShell();

  return (
    <div className="admin-shell-root" style={getAdminShellThemeStyle()}>
      <AdminTopbar />
      {sidebarOpen ? (
        <button
          type="button"
          className="admin-shell-backdrop md:hidden"
          aria-label="Close navigation menu"
          onClick={closeSidebar}
        />
      ) : null}
      <AdminSidebar />
      <main className="admin-shell-main">{children}</main>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminShellProvider>
      <AdminShellFrame>{children}</AdminShellFrame>
    </AdminShellProvider>
  );
}
