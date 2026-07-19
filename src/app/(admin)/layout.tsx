'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminProvider, useStaff } from '../../components/admin/AdminProvider';
import { AdapterProvider } from '../../components/commerce/AdapterProvider';
import { getAdapters } from '../../adapters';
import { roleLabel } from '../../domain/admin/rbac';
import type { Permission } from '../../domain/admin/rbac';
import { NoIndex } from '../../components/seo/NoIndex';
import { Logo } from '../../components/primitives/Logo';

/**
 * ADMIN LAYOUT
 *
 * ⚠ THE NAV IS PERMISSION-FILTERED. A staff member only sees sections they can
 *   act in. This is not security (the backend enforces) — it is not showing
 *   people doors they can't open. The route guard holds render until the server
 *   confirms who is acting.
 *
 * ⚠ VISUALLY DISTINCT FROM THE STOREFRONT. This is an operational tool, not the
 *   brand surface — denser, calmer, charcoal-forward. It still uses the brand
 *   tokens (never off-palette), but it does not pretend to be the shopfront.
 *
 * ⚠ TWO PROVIDERS. `AdminProvider` supplies the admin services + the RBAC
 *   subject; `AdapterProvider` supplies the STOREFRONT read ports (orders,
 *   products, subscriptions) that several admin screens read from as the single
 *   source of truth. Admin mutations still go through the admin services, which
 *   audit and permission-check.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const adapters = useMemo(() => getAdapters(), []);
  return (
    <AdapterProvider adapters={adapters}>
      <NoIndex />
      <AdminProvider>
        <Guarded>{children}</Guarded>
      </AdminProvider>
    </AdapterProvider>
  );
}

interface NavItem {
  href: string;
  label: string;
  perms: readonly Permission[];
}

const NAV: readonly NavItem[] = [
  { href: '/admin', label: 'Dashboard', perms: ['dashboard.view'] },
  { href: '/admin/orders', label: 'Orders', perms: ['order.view'] },
  { href: '/admin/products', label: 'Products', perms: ['product.view'] },
  { href: '/admin/inventory', label: 'Inventory', perms: ['inventory.view'] },
  { href: '/admin/payments', label: 'Payments', perms: ['payment.view'] },
  { href: '/admin/customers', label: 'Customers', perms: ['customer.view'] },
  { href: '/admin/subscriptions', label: 'Subscriptions', perms: ['subscription.view'] },
  { href: '/admin/promotions', label: 'Promotions', perms: ['promotion.view'] },
  { href: '/admin/delivery', label: 'Delivery', perms: ['delivery.view'] },
  { href: '/admin/content', label: 'Content', perms: ['content.view'] },
  { href: '/admin/reports', label: 'Reports', perms: ['report.view'] },
  { href: '/admin/audit', label: 'Audit log', perms: ['audit.view'] },
  { href: '/admin/staff', label: 'Staff', perms: ['staff.view'] },
  { href: '/admin/settings', label: 'Settings', perms: ['settings.view'] },
];

function Guarded({ children }: { children: React.ReactNode }) {
  const { staff, loading, canAny } = useStaff();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-charcoal/[0.03]">
        <div className="h-8 w-8 animate-pulse rounded-full bg-charcoal/20" />
        <span className="sr-only">Loading the admin area…</span>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-charcoal/[0.03] px-5 text-center">
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl text-charcoal">
          Staff sign-in required
        </h1>
        <p className="max-w-sm text-sm text-charcoal/70">
          This area is for Tabasamu Sips staff. Sign in with your staff account to continue.
        </p>
        <Link
          href="/admin/signin"
          className="rounded-sm bg-charcoal px-4 py-2 text-sm text-cream hover:bg-charcoal/90"
        >
          Staff sign in
        </Link>
      </div>
    );
  }

  const visible = NAV.filter((item) => canAny(item.perms));

  return (
    <div className="min-h-screen bg-charcoal/[0.03] text-charcoal">
      <div className="mx-auto flex max-w-[1400px] flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="border-b border-charcoal/10 lg:min-h-screen lg:w-56 lg:shrink-0 lg:border-b-0 lg:border-r">
          <div className="px-4 py-4">
            <Link
              href="/admin"
              aria-label="Tabasamu Sips admin — dashboard"
              className="inline-flex items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-forest focus-visible:outline-offset-2"
            >
              {/* Approved coloured monogram on the light admin sidebar. The
                  brand name is NOT typed as a wordmark; "Admin" is a plain
                  functional descriptor, not part of the logo. */}
              <Logo variant="monogram" width={28} decorative clearSpace={0} />
              <span className="font-[family-name:var(--font-fraunces)] text-base text-forest">
                Admin
              </span>
            </Link>
            <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-charcoal/45">
              {roleLabel(staff.role)}
            </p>
          </div>
          <nav aria-label="Admin" className="px-2 pb-4">
            <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
              {visible.map((item) => {
                const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
                return (
                  <li key={item.href} className="shrink-0">
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={[
                        'block whitespace-nowrap rounded-sm px-3 py-1.5 text-sm transition-colors',
                        active ? 'bg-charcoal/[0.08] font-medium text-charcoal' : 'text-charcoal/65 hover:bg-charcoal/[0.04]',
                      ].join(' ')}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 px-5 py-6 lg:px-8 lg:py-8">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-charcoal/45">
              {staff.name}
            </span>
            <Link href="/" className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-charcoal/45 hover:text-terracotta">
              View store →
            </Link>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
