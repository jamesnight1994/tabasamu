import { AdminComingSoon } from '../../../../components/admin/shell/AdminComingSoon';

export const metadata = {
  title: 'Settings | Tabasamu Admin',
};

export default function AdminSettingsPage() {
  return (
    <AdminComingSoon
      title="Settings"
      description="Store configuration, admin preferences, and integration settings will be added in a later phase."
      icon="settings"
    />
  );
}
