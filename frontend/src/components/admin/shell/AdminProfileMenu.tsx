'use client';

import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';
import { Avatar, Button, Dropdown } from '@heroui/react';
import { useAppSelector } from '../../../redux/admin/hooks';
import { adminAuthClient } from '../../../lib/admin/auth-client';
import {
  resolveAdminAvatarLabel,
  resolveAdminDisplayName,
  resolveAdminEmail,
} from '../../../lib/admin/admin-user-display';
import { useAdminAuth } from '../AdminAuthProvider';

export function AdminProfileMenu() {
  const router = useRouter();
  const { logout } = useAdminAuth();
  const reduxUser = useAppSelector((s) => s.adminAuth.user) as Record<string, unknown> | null;
  const user = reduxUser ?? (adminAuthClient.getUserDetails() as Record<string, unknown> | null);

  const displayName = resolveAdminDisplayName(user);
  const email = resolveAdminEmail(user);
  const avatarLabel = resolveAdminAvatarLabel(user);

  return (
    <Dropdown>
      <Dropdown.Trigger>
        <Button
          isIconOnly
          aria-label="Open profile menu"
          className="admin-shell-profile-trigger size-12 min-h-12 min-w-12 rounded-full p-0"
          variant="secondary"
        >
          <User size={28} aria-hidden className="size-5" />
        </Button>
      </Dropdown.Trigger>
      <Dropdown.Popover className="w-72 p-0">
        <div className="flex items-center gap-3 border-b border-default-200 px-4 py-3">
          <Avatar size="md">
            <Avatar.Fallback className="bg-zinc-700 text-zinc-100">{avatarLabel}</Avatar.Fallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
            <p className="truncate text-xs text-muted">{email || '—'}</p>
          </div>
        </div>
        <Dropdown.Menu
          onAction={(key) => {
            if (key === 'profile') {
              router.push('/admin/profile');
              return;
            }
            if (key === 'sign-out') {
              void logout();
            }
          }}
        >
          <Dropdown.Item id="profile" textValue="Profile">
            Profile
          </Dropdown.Item>
          <Dropdown.Item id="sign-out" textValue="Sign out">
            Sign out
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
