'use client';

import { useEffect } from 'react';
import { useAppSelector } from '../../../redux/admin/hooks';
import { useAdminAuth } from '../../../components/admin/AdminAuthProvider';

export default function DashboardPage() {
  const { authChecker, logout } = useAdminAuth();
  const user = useAppSelector((s) => s.adminAuth.user);

  useEffect(() => {
    authChecker();
  }, [authChecker]);

  const displayEmail =
    user && typeof user === 'object' && 'email' in user
      ? (user as { email: string }).email
      : null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-h2 text-charcoal">Dashboard</h1>
        <button
          type="button"
          onClick={() => void logout()}
          className="text-small font-medium text-forest underline"
        >
          Sign out
        </button>
      </div>
      <p className="mt-4 text-body text-charcoal/70">
        Welcome{displayEmail ? `, ${displayEmail}` : ''}.
      </p>
    </div>
  );
}
