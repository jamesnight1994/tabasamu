'use client';

/**
 * ADMIN DASHBOARD
 *
 * ⚠ NOT A DECORATIVE DASHBOARD. Every tile answers an operational question a
 *   manager asks each morning: what needs fulfilling, what's low on stock, which
 *   payments need review, how are subscriptions holding up. Revenue is shown as
 *   "awaiting confirmation" because it depends on approved prices (D-14) and tax
 *   status (D-16) — a fake KES figure would be worse than the honest gap.
 */

import { useEffect, useState } from 'react';
import { useAdmin } from './AdminProvider';
import { PageHeader, MetricCard, MoneyValue, Notice } from './kit';
import type { DashboardMetrics, ProductPerformanceRow, ActivityEntry } from '../../domain/admin/reporting';

export function AdminDashboard() {
  const admin = useAdmin();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [performance, setPerformance] = useState<readonly ProductPerformanceRow[]>([]);
  const [activity, setActivity] = useState<readonly ActivityEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [m, p, a] = await Promise.all([
        admin.dashboard.metrics(),
        admin.dashboard.productPerformance(),
        admin.dashboard.recentActivity(),
      ]);
      if (cancelled) return;
      setMetrics(m);
      setPerformance(p);
      setActivity(a);
    })();
    return () => { cancelled = true; };
  }, [admin]);

  if (!metrics) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-sm bg-charcoal/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Today at a glance." />

      {/* Revenue — honestly blocked */}
      <section>
        <SectionLabel>Revenue</SectionLabel>
        <Notice tone="blocked">
          Revenue figures need approved prices (D-14) and a confirmed tax status (D-16). Until then
          they show as awaiting confirmation — order and unit counts below are real.
        </Notice>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Today" value={<MoneyValue value={metrics.revenueToday} />} />
          <MetricCard label="Last 7 days" value={<MoneyValue value={metrics.revenue7d} />} />
          <MetricCard label="Last 30 days" value={<MoneyValue value={metrics.revenue30d} />} />
          <MetricCard label="Avg order value" value={<MoneyValue value={metrics.averageOrderValue} />} />
        </div>
      </section>

      {/* Operations */}
      <section>
        <SectionLabel>Operations</SectionLabel>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="To fulfil"
            value={metrics.ordersPendingFulfilment}
            tone={metrics.ordersPendingFulfilment > 0 ? 'attention' : 'neutral'}
            hint="Paid, awaiting dispatch"
          />
          <MetricCard label="Orders today" value={metrics.ordersToday} />
          <MetricCard label="Awaiting payment" value={metrics.ordersPending} />
          <MetricCard
            label="Failed payments"
            value={metrics.failedPayments}
            tone={metrics.failedPayments > 0 ? 'attention' : 'neutral'}
          />
          <MetricCard
            label="Low stock"
            value={metrics.lowStockCount}
            tone={metrics.lowStockCount > 0 ? 'attention' : 'neutral'}
          />
          <MetricCard label="Out of stock" value={metrics.outOfStockCount} tone={metrics.outOfStockCount > 0 ? 'attention' : 'neutral'} />
          <MetricCard label="M-PESA payments" value={metrics.mpesaCount} />
          <MetricCard label="Card payments" value={metrics.cardCount} hint="Disabled (D-35)" />
        </div>
      </section>

      {/* Subscriptions */}
      <section>
        <SectionLabel>Subscriptions</SectionLabel>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Active" value={metrics.subscriptionsActive} tone="positive" />
          <MetricCard label="Paused" value={metrics.subscriptionsPaused} />
          <MetricCard label="Needs attention" value={metrics.subscriptionsPastDue} tone={metrics.subscriptionsPastDue > 0 ? 'attention' : 'neutral'} />
          <MetricCard label="Renewals (7d)" value={metrics.renewalsUpcoming7d} />
        </div>
      </section>

      {/* Product performance + activity */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <SectionLabel>Top products (units)</SectionLabel>
          <ul className="mt-3 space-y-2">
            {performance.map((p) => (
              <li key={p.variantId} className="flex items-center justify-between rounded-sm border border-charcoal/10 bg-charcoal/[0.02] px-3 py-2">
                <span className="text-sm text-charcoal">{p.name}</span>
                <span className="font-[family-name:var(--font-mono)] text-sm text-charcoal/70">{p.unitsSold} units</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <SectionLabel>Recent activity</SectionLabel>
          <ul className="mt-3 space-y-2">
            {activity.map((a, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3 border-b border-charcoal/8 pb-2 text-sm">
                <span className="text-charcoal/80">{a.summary}</span>
                <span className="shrink-0 font-[family-name:var(--font-mono)] text-[11px] text-charcoal/45">
                  {relativeTime(a.at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-charcoal/55">
      {children}
    </h2>
  );
}

function relativeTime(at: number): string {
  const mins = Math.round((Date.now() - at) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}
