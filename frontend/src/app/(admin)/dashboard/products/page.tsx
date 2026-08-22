import { AdminComingSoon } from '../../../../components/admin/shell/AdminComingSoon';

export const metadata = {
  title: 'Products | Tabasamu Admin',
};

export default function AdminProductsPage() {
  return (
    <AdminComingSoon
      title="Products"
      description="Catalogue management — create, edit, and publish products via the Nest admin API. CRUD screens are the next implementation step."
      icon="package"
    />
  );
}
