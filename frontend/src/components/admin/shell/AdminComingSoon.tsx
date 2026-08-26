'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Settings, ShoppingCart, type LucideIcon } from 'lucide-react';
import { Button, Card } from '@heroui/react';
import { useAdminAuth } from '../AdminAuthProvider';

export type AdminComingSoonIcon = 'package' | 'orders' | 'settings';

const COMING_SOON_ICONS: Record<AdminComingSoonIcon, LucideIcon> = {
  package: Package,
  orders: ShoppingCart,
  settings: Settings,
};

type AdminComingSoonProps = {
  title: string;
  description: string;
  icon: AdminComingSoonIcon;
  backHref?: string;
  backLabel?: string;
};

export function AdminComingSoon({
  title,
  description,
  icon,
  backHref = '/dashboard',
  backLabel = 'Back to dashboard',
}: AdminComingSoonProps) {
  const router = useRouter();
  const { authChecker } = useAdminAuth();
  const Icon = COMING_SOON_ICONS[icon];

  useEffect(() => {
    authChecker();
  }, [authChecker]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Card className="border border-default-200 shadow-sm">
        <Card.Header className="flex flex-col items-center gap-4 pb-2 pt-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-teal-800">
            <Icon size={32} strokeWidth={1.75} aria-hidden />
          </div>
          <div className="space-y-2">
            <Card.Title className="text-2xl font-semibold">{title}</Card.Title>
            <Card.Description className="max-w-md text-base">{description}</Card.Description>
          </div>
        </Card.Header>
        <Card.Content className="flex justify-center pb-8 pt-2">
          <Button variant="secondary" onPress={() => router.push(backHref)}>
            {backLabel}
          </Button>
        </Card.Content>
      </Card>
    </div>
  );
}
