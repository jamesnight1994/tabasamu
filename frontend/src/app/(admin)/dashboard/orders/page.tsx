import { AdminComingSoon } from '../../../../components/admin/shell/AdminComingSoon';

export const metadata = {
  title: 'Orders | Tabasamu Admin',
};

export default function AdminOrdersPage() {
  return (
    <AdminComingSoon
      title="Orders"
      description="Order fulfilment and status tracking will live here once the orders API is available in Nest or Medusa."
      icon="orders"
    />
  );
}
