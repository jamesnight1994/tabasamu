'use client';

/**
 * ACCOUNT DASHBOARD
 *
 * The overview: who you are, your most recent order, your subscription, and the
 * two actions people actually come here for — reorder and manage the sub.
 * Everything is a summary that links deeper; nothing heavy is done on this page.
 *
 * ⚠ EVERY NUMBER THAT DEPENDS ON A BLOCKED DECISION RENDERS AS `Unavailable`.
 *   The subscription's next-delivery date and total are `Pending` (D-09), so
 *   they show the awaiting-confirmation marker, never an invented date. [NN-05]
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from './SessionProvider';
import { useAdapters } from './AdapterProvider';
import { PendingValue } from './Price';
import { Button } from '../primitives/Button';
import { customerId as toCustomerId } from '../../domain/shared';
import { isUnavailable } from '../../domain/catalogue';
import { statusCopy, frequencyLabel, type Subscription } from '../../domain/subscription';
import { orderStatusCopy, type OrderStatus } from '../../domain/order';
import type { Order } from '../../ports';

export function AccountDashboard() {
  const { session } = useSession();
  const { orders, subscriptions } = useAdapters();
  const [recentOrder, setRecentOrder] = useState<Order | null>(null);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const cid = session ? toCustomerId(session.customerId) : null;
      const [ords, subs] = await Promise.all([
        cid ? orders.listForCustomer(cid).catch(() => []) : Promise.resolve([]),
        subscriptions.list().catch(() => []),
      ]);
      if (cancelled) return;
      setRecentOrder(ords[0] ?? null);
      setSub(subs.find((s) => s.status === 'active' || s.status === 'payment_failed') ?? subs[0] ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [orders, subscriptions, session]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-charcoal">
          {greeting()}, {session?.displayName}
        </h1>
        {session && !session.emailVerified && (
          <div className="mt-4 rounded-sm border border-muted-gold/40 bg-muted-gold/[0.08] p-3">
            <p className="text-sm text-charcoal/80">
              Your email is not verified yet.{' '}
              <Link href="/verify" className="underline underline-offset-4 hover:text-terracotta">
                Verify it
              </Link>{' '}
              to unlock everything.
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <RecentOrderCard order={recentOrder} loading={loading} />
        <SubscriptionCard sub={sub} loading={loading} />
      </div>
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function RecentOrderCard({ order, loading }: { order: Order | null; loading: boolean }) {
  return (
    <section className="rounded-sm border border-charcoal/12 bg-charcoal/[0.02] p-5">
      <h2 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-charcoal/55">
        Recent order
      </h2>
      {loading ? (
        <div className="mt-4 h-16 animate-pulse rounded-sm bg-charcoal/5" />
      ) : order ? (
        <div className="mt-3">
          <p className="font-[family-name:var(--font-fraunces)] text-lg text-charcoal">
            {order.number}
          </p>
          <p className="mt-1 text-sm text-charcoal/70">
            {order.lines.length} {order.lines.length === 1 ? 'item' : 'items'} ·{' '}
            {orderStatusCopy(order.status as OrderStatus).label}
          </p>
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="secondary" asChild>
              <Link href={`/account/orders/${order.id}`}>View</Link>
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <Link href={`/account/orders/${order.id}?reorder=1`}>Reorder</Link>
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-charcoal/60">No orders yet.</p>
      )}
    </section>
  );
}

function SubscriptionCard({ sub, loading }: { sub: Subscription | null; loading: boolean }) {
  return (
    <section className="rounded-sm border border-charcoal/12 bg-charcoal/[0.02] p-5">
      <h2 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-charcoal/55">
        Subscription
      </h2>
      {loading ? (
        <div className="mt-4 h-16 animate-pulse rounded-sm bg-charcoal/5" />
      ) : sub ? (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <StatusDot tone={statusCopy(sub.status).tone} />
            <p className="font-[family-name:var(--font-fraunces)] text-lg text-charcoal">
              {statusCopy(sub.status).label}
            </p>
          </div>
          <p className="mt-1 text-sm text-charcoal/70">{frequencyLabel(sub.frequency)}</p>
          <p className="mt-1 text-sm text-charcoal/60">
            Next delivery:{' '}
            {isUnavailable(sub.nextDeliveryAt) ? (
              <PendingValue value={sub.nextDeliveryAt} />
            ) : (
              new Date(sub.nextDeliveryAt).toLocaleDateString()
            )}
          </p>
          <div className="mt-4">
            <Button size="sm" variant="secondary" asChild>
              <Link href={`/account/subscriptions/${sub.id}`}>Manage</Link>
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-charcoal/60">No active subscription.</p>
      )}
    </section>
  );
}

function StatusDot({ tone }: { tone: 'positive' | 'neutral' | 'attention' }) {
  const color =
    tone === 'positive' ? 'bg-forest' : tone === 'attention' ? 'bg-terracotta' : 'bg-charcoal/40';
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} aria-hidden="true" />;
}
