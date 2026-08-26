import { AdminReduxProvider } from '../../components/admin/AdminReduxProvider';
import { AdminUiProvider } from '../../components/admin/AdminUiProvider';
import { AdminAuthProvider } from '../../components/admin/AdminAuthProvider';
import { AdminShell } from '../../components/admin/shell/AdminShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminReduxProvider>
      <AdminUiProvider>
        <AdminAuthProvider>
          <AdminShell>{children}</AdminShell>
        </AdminAuthProvider>
      </AdminUiProvider>
    </AdminReduxProvider>
  );
}
