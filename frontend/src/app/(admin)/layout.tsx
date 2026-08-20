import { AdminReduxProvider } from '../../components/admin/AdminReduxProvider';
import { AdminUiProvider } from '../../components/admin/AdminUiProvider';
import { AdminAuthProvider } from '../../components/admin/AdminAuthProvider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminReduxProvider>
      <AdminUiProvider>
        <AdminAuthProvider>{children}</AdminAuthProvider>
      </AdminUiProvider>
    </AdminReduxProvider>
  );
}
