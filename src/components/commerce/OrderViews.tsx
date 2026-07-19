'use client';

/**
 * ORDER HISTORY & DETAIL
 *
 * ⚠ THE M-PESA REFERENCE IS THE HERO OF THE DETAIL PAGE, NOT THE ORDER NUMBER.
 *   In this market a customer contacting support quotes the M-PESA code. It gets
 *   the prominent, monospaced, copyable treatment; the order number is
 *   secondary. [D-33, F-88]
 *
 * ⚠ CANCELLATION IS OFFERED ONLY WHERE THE ORDER STATE PERMITS IT.
 *   A delivered or dispatched order cannot be cancelled — the order state
 *   machine says so, and the UI asks it rather than deciding for itself. Where
 *   cancellation isn't allowed, we offer "request support" instead of a dead
 *   button. [order domain]
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from './SessionProvider';
import { useAdapters } from './AdapterProvider';
import { useCart } from './CartProvider';
import { Button } from '../primitives/Button';
import { Select } from '../primitives/Form';
import { EmptyState } from '../primitives/Surface';
import { formatMoney, customerId as toCustomerId, orderId as toOrderId } from '../../domain/shared';
import { isUnavailable } from '../../domain/catalogue';
import {
  orderStatusCopy,
  isTerminalOrder,
  canTransition,
  type OrderStatus,
} from '../../domain/order';
import type { Order } from '../../ports';

/* ================================================================== *
 * List
 * ================================================================== */

type Filter = 'all' | 'active' | 'delivered' | 'cancelled';

const matchesFilter = (status: OrderStatus, filter: Filter): boolean => {
  if (filter === 'all') return true;
  if (filter === 'delivered') return status === 'delivered';
  if (filter === 'cancelled') return status === 'cancelled' || status === 'refunded' || status === 'partially_refunded';
  // active = everything not terminal
  return !isTerminalOrder(status);
};

export function OrderHistory() {
  const { session } = useSession();
  const { orders } = useAdapters();
  const [all, setAll] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const cid = session ? toCustomerId(session.customerId) : null;
      const list = cid ? await orders.listForCustomer(cid).catch(() => []) : [];
      if (!cancelled) setAll([...list]);
    })();
    return () => {
      cancelled = true;
    };
  }, [orders, session]);

  const filtered = useMemo(() => {
    if (!all) return [];
    const q = query.trim().toLowerCase();
    return all
      .filter((o) => matchesFilter(o.status as OrderStatus, filter))
      .filter(
        (o) =>
          q.length === 0 ||
          o.number.toLowerCase().includes(q) ||
          (o.mpesaReference?.toLowerCase().includes(q) ?? false) ||
          o.lines.some((l) => l.productName.toLowerCase().includes(q))
      );
  }, [all, filter, query]);

  return (
    <div className="space-y-6">
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-charcoal">Your orders</h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by order, M-PESA code or flavour"
          aria-label="Search orders"
          className="min-w-0 flex-1 rounded-sm border border-charcoal/20 bg-charcoal/[0.02] px-3 py-2 text-sm text-charcoal"
        />
        <div className="sm:w-48">
          <Select
            id="order-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            aria-label="Filter orders"
          >
            <option value="all">All orders</option>
            <option value="active">In progress</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled &amp; refunded</option>
          </Select>
        </div>
      </div>

      {all === null ? (
        <div className="space-y-3">
          <div className="h-20 animate-pulse rounded-sm bg-charcoal/5" />
          <div className="h-20 animate-pulse rounded-sm bg-charcoal/5" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={all.length === 0 ? 'No orders yet.' : 'Nothing matches that.'}
          body={all.length === 0 ? 'When you place an order, it will appear here.' : 'Try a different search or filter.'}
          action={
            all.length === 0 ? (
              <Button variant="secondary" asChild>
                <Link href="/shop">See the flavours</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => (
            <li key={o.id}>
              <Link
                href={`/account/orders/${o.id}`}
                className="block rounded-sm border border-charcoal/12 bg-charcoal/[0.02] p-4 transition-colors hover:border-charcoal/25"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-[family-name:var(--font-mono)] text-sm text-charcoal">
                    {o.number}
                  </span>
                  <StatusPill status={o.status as OrderStatus} />
                </div>
                <p className="mt-2 text-sm text-charcoal/70">
                  {o.lines.map((l) => `${l.quantity}× ${l.productName}`).join(', ')}
                </p>
                <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-charcoal/50">
                  {new Date(o.createdAt).toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  const copy = orderStatusCopy(status);
  const cls =
    copy.tone === 'positive'
      ? 'bg-forest/10 text-forest'
      : copy.tone === 'attention'
        ? 'bg-terracotta/10 text-terracotta'
        : 'bg-charcoal/[0.06] text-charcoal/70';
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.12em] ${cls}`}>
      {copy.label}
    </span>
  );
}

/* ================================================================== *
 * Detail
 * ================================================================== */

export function OrderDetail({ orderId }: { orderId: string }) {
  const { orders } = useAdapters();
  const cart = useCart();
  const router = useRouter();
  const params = useSearchParams();  // reorder query flag
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const wantsReorder = params.get('reorder') === '1';

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const o = await orders.byId(toOrderId(orderId)).catch(() => null);
      if (!cancelled) setOrder(o);
    })();
    return () => {
      cancelled = true;
    };
  }, [orders, orderId]);

  const reorder = useCallback(() => {
    if (!order) return;
    // ⚠ Reorder pre-fills the cart from the SNAPSHOTTED lines. Prices are
    //   revalidated at checkout — a reorder is an intention, not a locked quote.
    for (const l of order.lines) {
      if (!isUnavailable(l.unitPrice)) cart.addItem(l.variantId, l.unitPrice, l.quantity);
    }
    router.push('/cart');
  }, [order, cart, router]);

  useEffect(() => {
    if (wantsReorder && order) reorder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsReorder, order]);

  if (order === undefined) {
    return <div className="h-64 animate-pulse rounded-sm bg-charcoal/5" />;
  }
  if (order === null) {
    return (
      <EmptyState
        title="Order not found"
        body="We could not find that order on your account."
        action={
          <Button variant="secondary" asChild>
            <Link href="/account/orders">Back to orders</Link>
          </Button>
        }
      />
    );
  }

  const status = order.status as OrderStatus;
  // ⚠ Cancellable only if the state machine allows a move to 'cancelled'.
  const cancellable = canTransition(status, 'cancelled');

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/account/orders"
          className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.14em] text-charcoal/55 hover:text-terracotta"
        >
          ← Orders
        </Link>
        <div className="mt-2 flex items-baseline justify-between gap-4">
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-charcoal">
            {order.number}
          </h1>
          <StatusPill status={status} />
        </div>
        <p className="mt-1 text-sm text-charcoal/60">
          Placed {new Date(order.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* ⚠ M-PESA reference — the prominent support key. */}
      {order.mpesaReference && (
        <div className="rounded-sm bg-charcoal/[0.04] p-4">
          <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-charcoal/55">
            M-PESA reference
          </p>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-lg tracking-wide text-charcoal">
            {order.mpesaReference}
          </p>
          <p className="mt-1 text-xs text-charcoal/60">Quote this if you contact us about this order.</p>
        </div>
      )}

      {/* Lines */}
      <section>
        <h2 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-charcoal/55">
          Items
        </h2>
        <ul className="mt-3 divide-y divide-charcoal/10">
          {order.lines.map((l, i) => (
            <li key={i} className="flex items-baseline justify-between gap-4 py-3">
              <span className="text-sm text-charcoal">
                {l.quantity}× {l.productName}
                <span className="ml-2 font-[family-name:var(--font-mono)] text-xs text-charcoal/45">
                  {l.sku}
                </span>
              </span>
              <span className="font-[family-name:var(--font-mono)] text-sm tabular-nums text-charcoal">
                {isUnavailable(l.unitPrice)
                  ? '—'
                  : formatMoney({ ...l.unitPrice, amount: l.unitPrice.amount * l.quantity })}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Delivery address */}
      <section>
        <h2 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-charcoal/55">
          Delivered to
        </h2>
        <address className="mt-2 text-sm not-italic leading-relaxed text-charcoal/80">
          {order.deliveryAddress.recipientName}
          <br />
          {order.deliveryAddress.building}, {order.deliveryAddress.estate}
          <br />
          {order.deliveryAddress.landmark}
        </address>
      </section>

      {/* Timeline */}
      <OrderTimeline status={status} />

      {/* Actions */}
      <div className="flex flex-wrap gap-3 border-t border-charcoal/10 pt-6">
        <Button onClick={reorder}>Reorder</Button>
        {cancellable ? (
          <Button variant="secondary" asChild>
            <Link href={`/account/orders/${order.id}?cancel=1`}>Request cancellation</Link>
          </Button>
        ) : (
          <Button variant="secondary" asChild>
            <Link href="/contact">Request support</Link>
          </Button>
        )}
        <Button variant="ghost" disabled title="Invoice download will be available once billing is connected">
          Download invoice
        </Button>
      </div>
      {/* ⛔ Invoice endpoint is a placeholder — billing is not connected. [NN-04] */}
    </div>
  );
}

/* ================================================================== *
 * Timeline — a real sequence, so numbered steps are honest here
 * ================================================================== */

const FLOW: readonly OrderStatus[] = [
  'confirmed',
  'preparing',
  'ready_for_dispatch',
  'dispatched',
  'delivered',
];

function OrderTimeline({ status }: { status: OrderStatus }) {
  // Where are we in the happy path? Terminal-negative states short-circuit.
  const negative = status === 'cancelled' || status === 'payment_failed' || status === 'payment_expired';
  const currentIndex = FLOW.indexOf(status);

  return (
    <section>
      <h2 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-charcoal/55">
        Progress
      </h2>
      {negative ? (
        <p className="mt-3 text-sm text-charcoal/70">{orderStatusCopy(status).body}</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {FLOW.map((step, i) => {
            const done = currentIndex >= 0 && i <= currentIndex;
            const current = i === currentIndex;
            return (
              <li key={step} className="flex items-center gap-3">
                <span
                  className={[
                    'inline-block h-2.5 w-2.5 shrink-0 rounded-full',
                    done ? 'bg-forest' : 'bg-charcoal/20',
                  ].join(' ')}
                  aria-hidden="true"
                />
                <span
                  className={[
                    'text-sm',
                    current ? 'font-medium text-charcoal' : done ? 'text-charcoal/70' : 'text-charcoal/40',
                  ].join(' ')}
                >
                  {orderStatusCopy(step).label}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
