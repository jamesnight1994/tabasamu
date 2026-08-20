import { AdminReduxProvider } from '../../components/admin/AdminReduxProvider';
import { AdminUiProvider } from '../../components/admin/AdminUiProvider';

export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminReduxProvider>
      <AdminUiProvider>{children}</AdminUiProvider>
    </AdminReduxProvider>
  );
}
