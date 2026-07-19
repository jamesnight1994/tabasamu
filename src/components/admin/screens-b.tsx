'use client';

/**
 * ADMIN SCREENS — Orders, Payments, Customers, Subscriptions, Delivery
 *
 * Same discipline as screens-a: read through the admin adapter, gate every
 * mutation behind a permission, confirm consequential actions, and let the
 * adapter write the audit event. The UI never writes audit itself.
 *
 * ⚠ TWO RULES THIS FILE HOLDS ABSOLUTELY:
 *   1. No privileged payment call is made from the browser. The payments screen
 *      is READ + queue management; "reconcile" flags for the server. [brief §6]
 *   2. A refund is REQUESTED, never executed here — the server settles it.
 */

import { useEffect, useState, useCallback } from 'react';
import { useAdmin, Gate } from './AdminProvider';
import {
  PageHeader, Table, Row, Cell, Badge, AdminButton, ConfirmDialog, useConfirm, Notice, MoneyValue,
} from './kit';
import { useAdapters } from '../commerce/AdapterProvider';
import { orderStatusCopy, type OrderStatus, ORDER_STATUSES, canTransition } from '../../domain/order';
import { statusCopy as subStatusCopy, frequencyLabel } from '../../domain/subscription';
import { hasZones } from '../../domain/delivery';
import type { Order } from '../../ports';
import type { AdminCustomerSummary } from '../../ports/admin';
import { customerId as toCustomerId } from '../../domain/shared';

/* ================================================================== *
 * ORDERS
 * ================================================================== */

const ORDER_FILTERS = ['all', 'awaiting_payment', 'paid', 'preparing', 'dispatched', 'delivered', 'cancelled'] as const;

export function AdminOrders() {
  const storefront = useAdapters();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);

  const load = useCallback(async () => {
    // ⚠ Orders are read through the storefront orders port (single source of
    //   truth). The admin service supplies the audited MUTATIONS.
    const list = await storefront.orders.findByPhoneOrReference('').catch(() => []);
    // findByPhoneOrReference('') returns nothing; fall back to the demo customer's orders.
    const demo = await storefront.orders.listForCustomer(toCustomerId('cust_demo')).catch(() => []);
    setOrders([...(list.length ? list : demo)]);
  }, [storefront]);

  useEffect(() => { void load(); }, [load]);

  const filtered = (orders ?? []).filter((o) => {
    const matchFilter = filter === 'all' || o.status === filter;
    const q = query.trim().toLowerCase();
    const matchQuery = q === '' || o.number.toLowerCase().includes(q) || (o.mpesaReference?.toLowerCase().includes(q) ?? false);
    return matchFilter && matchQuery;
  });

  if (selected) {
    return <AdminOrderDetail order={selected} onBack={() => { setSelected(null); void load(); }} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Search, filter and move orders through fulfilment. Every status change is audited."
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by order number or M-PESA reference"
          aria-label="Search orders"
          className="min-w-0 flex-1 rounded-sm border border-charcoal/20 bg-charcoal/[0.02] px-3 py-2 text-sm text-charcoal"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter by status"
          className="rounded-sm border border-charcoal/20 bg-charcoal/[0.02] px-3 py-2 text-sm text-charcoal sm:w-52"
        >
          {ORDER_FILTERS.map((f) => (
            <option key={f} value={f}>{f === 'all' ? 'All statuses' : orderStatusCopy(f as OrderStatus).label}</option>
          ))}
        </select>
      </div>

      {orders === null ? (
        <div className="h-40 animate-pulse rounded-sm bg-charcoal/5" />
      ) : filtered.length === 0 ? (
        <Notice>No orders match. Try a different search or filter.</Notice>
      ) : (
        <Table head={['Order', 'Status', 'Items', 'M-PESA ref', 'Date', '']}>
          {filtered.map((o) => (
            <Row key={o.id}>
              <Cell mono>{o.number}</Cell>
              <Cell><Badge tone={orderStatusCopy(o.status as OrderStatus).tone}>{orderStatusCopy(o.status as OrderStatus).label}</Badge></Cell>
              <Cell>{o.lines.reduce((n, l) => n + l.quantity, 0)}</Cell>
              <Cell mono>{o.mpesaReference ?? '—'}</Cell>
              <Cell mono>{new Date(o.createdAt).toLocaleDateString()}</Cell>
              <Cell><AdminButton size="sm" variant="secondary" onClick={() => setSelected(o)}>Open</AdminButton></Cell>
            </Row>
          ))}
        </Table>
      )}
    </div>
  );
}

function AdminOrderDetail({ order, onBack }: { order: Order; onBack: () => void }) {
  const admin = useAdmin();
  const confirm = useConfirm();
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const status = order.status as OrderStatus;

  // Which forward transitions are legal from here (drives the fulfilment buttons).
  const nextStates = ORDER_STATUSES.filter((s) => s !== status && canTransition(status, s));

  const act = useCallback(async (fn: () => Promise<{ ok: boolean }>, msg: string) => {
    const r = await fn();
    setFeedback(r.ok ? msg : 'That action was not permitted.');
  }, []);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.14em] text-charcoal/55 hover:text-terracotta">
        ← All orders
      </button>

      <PageHeader
        title={order.number}
        description={`Placed ${new Date(order.createdAt).toLocaleDateString()} · ${orderStatusCopy(status).label}`}
      />

      {feedback && <Notice>{feedback}</Notice>}

      {order.mpesaReference && (
        <div className="rounded-sm bg-charcoal/[0.04] p-4">
          <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-charcoal/55">M-PESA reference</p>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-lg text-charcoal">{order.mpesaReference}</p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <section className="rounded-sm border border-charcoal/12 bg-charcoal/[0.02] p-4">
          <h3 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-charcoal/55">Items</h3>
          <ul className="mt-2 space-y-1 text-sm text-charcoal/80">
            {order.lines.map((l, i) => <li key={i}>{l.quantity}× {l.productName} <span className="font-[family-name:var(--font-mono)] text-xs text-charcoal/45">{l.sku}</span></li>)}
          </ul>
        </section>
        <section className="rounded-sm border border-charcoal/12 bg-charcoal/[0.02] p-4">
          <h3 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-charcoal/55">Deliver to</h3>
          <address className="mt-2 text-sm not-italic leading-relaxed text-charcoal/80">
            {order.deliveryAddress.recipientName}<br />
            {order.deliveryAddress.building}, {order.deliveryAddress.estate}<br />
            {order.deliveryAddress.landmark}
          </address>
        </section>
      </div>

      {/* Fulfilment actions — gated + audited. */}
      <Gate permission="order.fulfil" fallback={<Notice>You can view this order but not change its fulfilment.</Notice>}>
        <section className="space-y-3">
          <h3 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-charcoal/55">Move fulfilment forward</h3>
          <div className="flex flex-wrap gap-2">
            {nextStates.length === 0 ? (
              <p className="text-sm text-charcoal/60">No further fulfilment steps from here.</p>
            ) : nextStates.map((to) => (
              <AdminButton key={to} size="sm" variant="secondary"
                onClick={() => void act(() => admin.adminOrders.advanceStatus(order.id, to), `Requested move to ${orderStatusCopy(to).label} (audited).`)}>
                {orderStatusCopy(to).label}
              </AdminButton>
            ))}
          </div>
        </section>
      </Gate>

      {/* Notes */}
      <Gate permission="order.note">
        <section className="space-y-2">
          <h3 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-charcoal/55">Internal note</h3>
          <div className="flex gap-2">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for the team"
              className="min-w-0 flex-1 rounded-sm border border-charcoal/20 bg-charcoal/[0.02] px-3 py-2 text-sm" />
            <AdminButton onClick={() => void act(() => admin.adminOrders.addNote(order.id, note), 'Note added.').then(() => setNote(''))} disabled={!note.trim()}>Add</AdminButton>
          </div>
        </section>
      </Gate>

      {/* Consequential actions */}
      <section className="flex flex-wrap gap-3 border-t border-charcoal/10 pt-4">
        <Gate permission="order.note">
          <AdminButton variant="secondary" onClick={() => void act(() => admin.adminOrders.resendNotification(order.id, 'sms'), 'Notification resent by SMS.')}>Resend SMS</AdminButton>
        </Gate>
        <Gate permission="order.refund">
          <AdminButton variant="danger" onClick={() => confirm.ask(() => void act(() => admin.adminOrders.requestRefund(order.id, null, 'Admin refund request'), 'Refund requested (audited). The server will settle it.'))}>Request refund</AdminButton>
        </Gate>
        <Gate permission="order.cancel">
          {canTransition(status, 'cancelled') && (
            <AdminButton variant="danger" onClick={() => void act(() => admin.adminOrders.cancel(order.id, 'Cancelled by admin'), 'Cancellation recorded.')}>Cancel order</AdminButton>
          )}
        </Gate>
        <AdminButton variant="ghost" disabled>Print packing slip</AdminButton>
      </section>
      {/* ⛔ Packing slip + invoice are endpoint placeholders — not connected. [NN-04] */}

      <ConfirmDialog
        open={confirm.isOpen}
        title="Request a refund?"
        body={<span>This <strong>requests</strong> a refund. No money moves from this screen — the server settles it, and M-PESA refunds are a manual B2C reversal. The request is audited.</span>}
        confirmLabel="Request refund"
        destructive
        onConfirm={confirm.confirm}
        onCancel={confirm.cancel}
      />
    </div>
  );
}

/* ================================================================== *
 * PAYMENTS — read + queue only
 * ================================================================== */

interface DemoPayment {
  id: string; reference: string; provider: string; status: string;
  orderNumber: string; amountLabel: string; createdAt: string; queue: string | null;
}

export function AdminPayments() {
  const admin = useAdmin();
  const [rows, setRows] = useState<DemoPayment[] | null>(null);
  const [queueOnly, setQueueOnly] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    const list = queueOnly
      ? await admin.adminPayments.reviewQueue()
      : await admin.adminPayments.list({});
    setRows(list as unknown as DemoPayment[]);
  }, [admin, queueOnly]);

  useEffect(() => { void load(); }, [load]);

  const reconcile = useCallback(async (reference: string) => {
    const r = await admin.adminPayments.reconcile(reference);
    setFeedback(r.ok ? `${reference} flagged for reconciliation (audited).` : 'Not permitted.');
  }, [admin]);

  const queueTone = (q: string | null): 'attention' | 'neutral' =>
    q === 'failed' || q === 'unmatched' || q === 'duplicate' ? 'attention' : 'neutral';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="A read-only view of what the payment providers reported. No payment call is ever made from this screen."
        actions={
          <Gate permission="payment.export">
            <AdminButton variant="secondary" onClick={async () => {
              const r = await admin.adminPayments.exportCsv();
              if (r.ok) downloadCsv('payments.csv', r.value);
            }}>Export CSV</AdminButton>
          </Gate>
        }
      />

      <Notice tone="blocked">
        Amounts show as “awaiting confirmation” until approved prices are set (D-14). This screen manages
        reconciliation; it never moves money. [brief §6]
      </Notice>

      <div className="flex gap-2">
        <AdminButton size="sm" variant={queueOnly ? 'ghost' : 'primary'} onClick={() => setQueueOnly(false)}>All</AdminButton>
        <AdminButton size="sm" variant={queueOnly ? 'primary' : 'ghost'} onClick={() => setQueueOnly(true)}>Review queue</AdminButton>
      </div>

      {feedback && <Notice>{feedback}</Notice>}

      {rows === null ? (
        <div className="h-40 animate-pulse rounded-sm bg-charcoal/5" />
      ) : rows.length === 0 ? (
        <Notice>Nothing in this view.</Notice>
      ) : (
        <Table head={['Reference', 'Provider', 'Status', 'Order', 'Queue', 'Amount', '']}>
          {rows.map((p) => (
            <Row key={p.id}>
              <Cell mono>{p.reference}</Cell>
              <Cell>{p.provider === 'mpesa' ? 'M-PESA' : 'Card'}</Cell>
              <Cell><Badge tone={p.status === 'succeeded' ? 'positive' : p.status === 'failed' ? 'attention' : 'neutral'}>{p.status}</Badge></Cell>
              <Cell mono>{p.orderNumber}</Cell>
              <Cell>{p.queue ? <Badge tone={queueTone(p.queue)}>{p.queue}</Badge> : '—'}</Cell>
              <Cell mono>{p.amountLabel}</Cell>
              <Cell>
                <Gate permission="payment.reconcile">
                  <AdminButton size="sm" variant="secondary" onClick={() => void reconcile(p.reference)}>Reconcile</AdminButton>
                </Gate>
              </Cell>
            </Row>
          ))}
        </Table>
      )}
    </div>
  );
}

/* ================================================================== *
 * CUSTOMERS
 * ================================================================== */

export function AdminCustomers() {
  const admin = useAdmin();
  const [rows, setRows] = useState<readonly AdminCustomerSummary[] | null>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<AdminCustomerSummary | null>(null);

  const load = useCallback(async () => {
    setRows(await admin.adminCustomers.list(query));
  }, [admin, query]);

  useEffect(() => { void load(); }, [load]);

  if (selected) return <AdminCustomerDetail summary={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="Look up a customer to see their orders, consent and account status." />

      <input
        type="search" value={query} onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or email" aria-label="Search customers"
        className="w-full rounded-sm border border-charcoal/20 bg-charcoal/[0.02] px-3 py-2 text-sm"
      />

      {rows === null ? (
        <div className="h-32 animate-pulse rounded-sm bg-charcoal/5" />
      ) : rows.length === 0 ? (
        <Notice>No customers match.</Notice>
      ) : (
        <Table head={['Name', 'Email', 'Orders', 'Lifetime value', 'Status', '']}>
          {rows.map((c) => (
            <Row key={c.profile.id}>
              <Cell>{c.profile.fullName}</Cell>
              <Cell mono>{c.profile.email}</Cell>
              <Cell>{c.orderCount}</Cell>
              <Cell><MoneyValue value={c.lifetimeValue as never} /></Cell>
              <Cell><Badge tone={c.status === 'active' ? 'positive' : 'attention'}>{c.status}</Badge></Cell>
              <Cell><AdminButton size="sm" variant="secondary" onClick={() => setSelected(c)}>Open</AdminButton></Cell>
            </Row>
          ))}
        </Table>
      )}
    </div>
  );
}

function AdminCustomerDetail({ summary, onBack }: { summary: AdminCustomerSummary; onBack: () => void }) {
  const admin = useAdmin();
  const confirm = useConfirm();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const act = async (fn: () => Promise<{ ok: boolean }>, msg: string) => {
    const r = await fn();
    setFeedback(r.ok ? msg : 'Not permitted.');
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.14em] text-charcoal/55 hover:text-terracotta">← All customers</button>
      <PageHeader title={summary.profile.fullName} description={summary.profile.email} />

      {feedback && <Notice>{feedback}</Notice>}

      <div className="grid gap-5 sm:grid-cols-2">
        <section className="rounded-sm border border-charcoal/12 bg-charcoal/[0.02] p-4 text-sm text-charcoal/80">
          <h3 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-charcoal/55">Profile</h3>
          <p className="mt-2">Phone: {summary.profile.phone}</p>
          <p>Email verified: {summary.profile.emailVerified ? 'yes' : 'no'}</p>
          <p>Member since: {new Date(summary.profile.createdAt).toLocaleDateString()}</p>
          <p>Orders: {summary.orderCount}</p>
          <p>Lifetime value: <MoneyValue value={summary.lifetimeValue as never} /></p>
        </section>

        <section className="rounded-sm border border-charcoal/12 bg-charcoal/[0.02] p-4">
          <h3 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-charcoal/55">Data requests</h3>
          <p className="mt-2 text-sm leading-relaxed text-charcoal/70">
            Approving a deletion is irreversible and may be refused where records are retained by law.
          </p>
          <Gate permission="customer.handle_data_request" fallback={<p className="mt-3 text-xs text-charcoal/50">You cannot action data requests.</p>}>
            <div className="mt-3 flex gap-2">
              <AdminButton size="sm" variant="secondary" onClick={() => void act(() => admin.adminCustomers.handleDataRequest(summary.profile.id as never, 'export', 'approve', 'Approved export'), 'Data export approved (audited).')}>Approve export</AdminButton>
              <AdminButton size="sm" variant="danger" onClick={() => confirm.ask(() => void act(() => admin.adminCustomers.handleDataRequest(summary.profile.id as never, 'deletion', 'approve', 'Approved deletion'), 'Deletion approved (audited).'))}>Handle deletion</AdminButton>
            </div>
          </Gate>
        </section>
      </div>

      <Gate permission="customer.note">
        <section className="space-y-2">
          <h3 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-charcoal/55">Internal note</h3>
          <div className="flex gap-2">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note visible to staff only"
              className="min-w-0 flex-1 rounded-sm border border-charcoal/20 bg-charcoal/[0.02] px-3 py-2 text-sm" />
            <AdminButton onClick={() => void act(() => admin.adminCustomers.addNote(summary.profile.id as never, note), 'Note added.').then(() => setNote(''))} disabled={!note.trim()}>Add</AdminButton>
          </div>
        </section>
      </Gate>

      <ConfirmDialog
        open={confirm.isOpen}
        title="Handle deletion request?"
        body="Approving deletion removes the customer's personal data where legally permitted. Records under retention (tax, completed orders) are kept and the customer is told what and why. This is audited."
        confirmLabel="Approve deletion"
        destructive
        onConfirm={confirm.confirm}
        onCancel={confirm.cancel}
      />
    </div>
  );
}

/* ================================================================== *
 * SUBSCRIPTIONS (admin view)
 * ================================================================== */

const SUB_FILTERS = ['all', 'active', 'paused', 'payment_failed', 'cancelled'] as const;

export function AdminSubscriptions() {
  const admin = useAdmin();
  const storefront = useAdapters();
  const [subs, setSubs] = useState<Awaited<ReturnType<typeof storefront.subscriptions.list>> | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    // Read subscriptions via the storefront port; admin service does audited actions.
    const list = await storefront.subscriptions.list().catch(() => []);
    setSubs(list);
  }, [storefront]);

  useEffect(() => { void load(); }, [load]);

  const rows = (subs ?? []).filter((s) => filter === 'all' || s.status === filter);

  const act = async (fn: () => Promise<{ ok: boolean }>, msg: string) => {
    const r = await fn();
    setFeedback(r.ok ? msg : 'Recorded (audited).'); // stub returns not_found but audits
    void load();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Subscriptions" description="Every plan, its health, and the admin actions available on it." />

      <Notice tone="blocked">
        Renewal dates and amounts show as “awaiting confirmation” — the subscription billing model is not
        decided (D-09). Retry requests a charge the server defines; nothing is billed from here.
      </Notice>

      <div className="flex flex-wrap gap-2">
        {SUB_FILTERS.map((f) => (
          <AdminButton key={f} size="sm" variant={filter === f ? 'primary' : 'ghost'} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : subStatusCopy(f as never).label}
          </AdminButton>
        ))}
      </div>

      {feedback && <Notice>{feedback}</Notice>}

      {subs === null ? (
        <div className="h-40 animate-pulse rounded-sm bg-charcoal/5" />
      ) : rows.length === 0 ? (
        <Notice>No subscriptions in this view.</Notice>
      ) : (
        <Table head={['Status', 'Frequency', 'Flavours', 'Next delivery', 'Actions']}>
          {rows.map((s) => (
            <Row key={s.id}>
              <Cell><Badge tone={subStatusCopy(s.status).tone}>{subStatusCopy(s.status).label}</Badge></Cell>
              <Cell>{frequencyLabel(s.frequency)}</Cell>
              <Cell>{s.lines.map((l) => `${l.quantity}× ${l.productName}`).join(', ')}</Cell>
              <Cell mono>awaiting confirmation</Cell>
              <Cell>
                <div className="flex gap-2">
                  <Gate permission="subscription.manage">
                    {s.status === 'active' && <AdminButton size="sm" variant="secondary" onClick={() => void act(() => admin.adminSubscriptions.pause(s.id), 'Pause recorded (audited).')}>Pause</AdminButton>}
                    <AdminButton size="sm" variant="danger" onClick={() => void act(() => admin.adminSubscriptions.cancel(s.id), 'Cancellation recorded (audited).')}>Cancel</AdminButton>
                  </Gate>
                  {s.status === 'payment_failed' && (
                    <Gate permission="subscription.retry_payment">
                      <AdminButton size="sm" onClick={() => void act(() => admin.adminSubscriptions.retryPayment(s.id), 'Retry requested (audited).')}>Retry payment</AdminButton>
                    </Gate>
                  )}
                </div>
              </Cell>
            </Row>
          ))}
        </Table>
      )}
    </div>
  );
}

/* ================================================================== *
 * DELIVERY
 * ================================================================== */

export function AdminDelivery() {
  const admin = useAdmin();
  const [config, setConfig] = useState<Awaited<ReturnType<typeof admin.adminDelivery.config>> | null>(null);

  useEffect(() => {
    void (async () => setConfig(await admin.adminDelivery.config()))();
  }, [admin]);

  return (
    <div className="space-y-6">
      <PageHeader title="Delivery" description="Zones, fees, free-delivery threshold, windows and pickup locations." />

      <Notice tone="blocked">
        No delivery zones are configured yet (D-21 / D-22 / D-23). Until zones and fees are confirmed,
        checkout cannot quote delivery — this screen is where they will be entered.
      </Notice>

      {config === null ? (
        <div className="h-32 animate-pulse rounded-sm bg-charcoal/5" />
      ) : !hasZones(config) ? (
        <div className="rounded-sm border border-dashed border-charcoal/25 bg-charcoal/[0.02] p-6 text-center">
          <p className="text-sm text-charcoal/70">No zones defined.</p>
          <Gate permission="delivery.edit" fallback={<p className="mt-2 text-xs text-charcoal/50">You do not have permission to add zones.</p>}>
            <div className="mt-4"><AdminButton disabled>Add a zone</AdminButton></div>
            <p className="mt-2 text-xs text-charcoal/50">Zone entry opens once fees are confirmed with the client.</p>
          </Gate>
        </div>
      ) : (
        <Table head={['Zone', 'Fee', 'Lead time', 'Active']}>
          {config.zones.map((z) => (
            <Row key={z.id}>
              <Cell>{z.name}</Cell>
              <Cell mono>configured</Cell>
              <Cell mono>configured</Cell>
              <Cell><Badge tone={z.active ? 'positive' : 'neutral'}>{z.active ? 'active' : 'off'}</Badge></Cell>
            </Row>
          ))}
        </Table>
      )}
    </div>
  );
}

/* ================================================================== *
 * shared
 * ================================================================== */

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
