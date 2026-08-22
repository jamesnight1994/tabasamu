'use client';

import { CalendarDays } from 'lucide-react';
import { Avatar } from '@heroui/react';
import { useAppSelector } from '../../../redux/admin/hooks';
import { adminAuthClient } from '../../../lib/admin/auth-client';
import {
  resolveAdminAvatarLabel,
  resolveAdminDisplayName,
} from '../../../lib/admin/admin-user-display';

export function AdminDashboardWelcome() {
  const reduxUser = useAppSelector((s) => s.adminAuth.user) as Record<string, unknown> | null;
  const user = reduxUser ?? (adminAuthClient.getUserDetails() as Record<string, unknown> | null);

  const displayName = resolveAdminDisplayName(user);
  const avatarLabel = resolveAdminAvatarLabel(user);

  return (
    <div className="-mt-3 bg-zinc-900 px-4 pb-16 pt-10">
      <div className="mx-auto mb-5 flex max-w-[calc(88vw-2rem)] items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-md bg-zinc-100">
          <Avatar size="md">
            <Avatar.Fallback className="bg-zinc-700 text-[1.2rem] text-zinc-100">
              {avatarLabel}
            </Avatar.Fallback>
          </Avatar>
        </div>
        <div className="pt-2">
          <h1 className="-mb-2 font-body text-base font-semibold tracking-tight text-zinc-100 md:text-2xl">
            Welcome back{displayName !== 'Admin' ? `, ${displayName}` : ''}!
          </h1>
          <div className="flex items-center gap-2 py-2">
            <CalendarDays className="text-base text-zinc-300" size={16} aria-hidden />
            <span className="font-body text-sm text-zinc-300">
              Manage catalogue, orders, and store operations for Tabasamu Sips.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
