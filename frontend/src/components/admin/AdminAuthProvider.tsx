'use client';

import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch } from '../../redux/admin/hooks';
import { bootstrapAdminSession, logoutStaff } from '../../redux/admin/slices/authSlice';
import { adminAuthClient } from '../../lib/admin/auth-client';
import { AUTH_SESSION_EXPIRED_EVENT } from '../../lib/admin/web-api';
import { ADMIN_ROUTES } from '../../lib/admin/api-paths';

type AdminAuthContextValue = {
  logout: () => Promise<void>;
  authChecker: () => boolean;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    void dispatch(bootstrapAdminSession());

    const onExpired = () => router.replace(ADMIN_ROUTES.login);
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, onExpired);
  }, [dispatch, router]);

  const authChecker = useCallback(() => {
    if (!adminAuthClient.hasSession()) {
      router.replace(`${ADMIN_ROUTES.login}?returnUrl=${encodeURIComponent(pathname)}`);
      return false;
    }
    return true;
  }, [router, pathname]);

  const logout = useCallback(async () => {
    await dispatch(logoutStaff());
    router.push(ADMIN_ROUTES.login);
  }, [dispatch, router]);

  const value = useMemo(() => ({ logout, authChecker }), [logout, authChecker]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
};
