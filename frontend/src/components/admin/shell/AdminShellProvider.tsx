'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type AdminShellContextValue = {
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
};

const AdminShellContext = createContext<AdminShellContextValue | null>(null);

export function AdminShellProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((open) => !open), []);

  const value = useMemo(
    () => ({ sidebarOpen, openSidebar, closeSidebar, toggleSidebar }),
    [sidebarOpen, openSidebar, closeSidebar, toggleSidebar],
  );

  return <AdminShellContext.Provider value={value}>{children}</AdminShellContext.Provider>;
}

export function useAdminShell() {
  const ctx = useContext(AdminShellContext);
  if (!ctx) {
    throw new Error('useAdminShell must be used within AdminShellProvider');
  }
  return ctx;
}
