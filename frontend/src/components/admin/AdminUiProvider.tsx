'use client';

import { Toast } from '@heroui/react';
import '../../styles/admin/admin-auth.css';
import '../../styles/admin/admin-shell.css';
import '../../styles/admin/admin-dashboard.css';

export function AdminUiProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* Toast region must be a sibling — wrapping page content inside Provider
          prevents SSR/hydration from rendering children (blank login screen). */}
      <Toast.Provider placement="top end" width={360} maxVisibleToasts={3} />
    </>
  );
}
