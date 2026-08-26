'use client';

import { useEffect } from 'react';
import { useAdminAuth } from '../AdminAuthProvider';
import {
  AdminProductsManagement,
  useAdminProductsBootstrap,
} from './AdminProductsManagement';

export function AdminProductsPageContent() {
  const { authChecker } = useAdminAuth();
  const bootstrapProducts = useAdminProductsBootstrap();

  useEffect(() => {
    authChecker();
  }, [authChecker]);

  useEffect(() => {
    bootstrapProducts();
  }, [bootstrapProducts]);

  return (
    <div className="flex h-[calc(100vh-4.25rem)] min-h-0 flex-col overflow-hidden bg-white">
      <div className="admin-products-card flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
        <AdminProductsManagement />
      </div>
    </div>
  );
}
