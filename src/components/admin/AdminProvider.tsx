'use client';

/**
 * ADMIN PROVIDER
 *
 * ⚠ Provides the admin adapter set AND the current staff member to the admin
 *   tree. Two contexts, one provider: components read `useAdmin()` for adapters
 *   and `useStaff()` for the RBAC subject. The staff member is fetched from the
 *   server on mount — never a client-persisted flag. [rbac.ts]
 */

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import type { AdminAdapters } from '../../ports/admin';
import type { StaffMember, Permission } from '../../domain/admin/rbac';
import { can, canAny } from '../../domain/admin/rbac';
import { getAdminAdapters } from '../../adapters/admin';

const AdminContext = createContext<AdminAdapters | null>(null);
const StaffContext = createContext<{
  staff: StaffMember | null;
  loading: boolean;
  can: (p: Permission) => boolean;
  canAny: (p: readonly Permission[]) => boolean;
  refresh: () => Promise<void>;
} | null>(null);

export const useAdmin = (): AdminAdapters => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside <AdminProvider>.');
  return ctx;
};

export const useStaff = () => {
  const ctx = useContext(StaffContext);
  if (!ctx) throw new Error('useStaff must be used inside <AdminProvider>.');
  return ctx;
};

export function AdminProvider({ children }: { children: ReactNode }) {
  const adapters = useMemo(() => getAdminAdapters(), []);
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useMemo(
    () => async () => {
      const s = await adapters.adminAuth.currentStaff();
      setStaff(s);
    },
    [adapters]
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const s = await adapters.adminAuth.currentStaff();
        if (!cancelled) setStaff(s);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [adapters]);

  const staffValue = useMemo(
    () => ({
      staff,
      loading,
      can: (p: Permission) => can(staff, p),
      canAny: (p: readonly Permission[]) => canAny(staff, p),
      refresh,
    }),
    [staff, loading, refresh]
  );

  return (
    <AdminContext.Provider value={adapters}>
      <StaffContext.Provider value={staffValue}>{children}</StaffContext.Provider>
    </AdminContext.Provider>
  );
}

/**
 * ⚠ THE PERMISSION GATE COMPONENT.
 *   Wraps any action/section that needs a permission. Renders nothing (or a
 *   fallback) when the staff member lacks it. This is the UX layer — the backend
 *   still enforces independently.
 */
export function Gate({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { can: check } = useStaff();
  return <>{check(permission) ? children : fallback}</>;
}
