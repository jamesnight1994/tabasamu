import { Suspense } from 'react';
import { AdminLoginForm } from '../../../../components/admin/AdminLoginForm';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}

export const metadata = {
  title: 'Admin Sign In | Tabasamu Sips',
};
