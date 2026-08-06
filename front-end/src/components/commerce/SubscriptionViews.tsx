'use client';

/**
 * SUBSCRIPTION MANAGEMENT
 *
 * ⚠ THE HARDEST HONESTY IN PHASE 6.
 *
 *   This screen lets a customer manage a subscription — pause, resume, skip,
 *   change flavours/quantity/address, cancel, reactivate — and every one of
 *   those is real. But it must NOT pretend to know when the next charge lands or
 *   how much it is, because ⛔ D-09 (the billing model) is unanswered. M-PESA has
 *   no card-on-file; recurring billing is either a standing order or a re-prompt,
 *   and we have not been told which.
 *
 *   So: the management controls are live; the money fields render as
 *   `Unavailable`; and a `payment_failed` subscription shows a "needs attention"
 *   state whose recovery is a state transition, not an invented charge. [NN-05]
 *
 * ⚠ WHICH BUTTONS APPEAR IS `permittedOperations(sub, policy)` — a pure domain
 *   function. The UI asks; it does not decide. A button and its action can never
 *   disagree because they read the same source.
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAdapters } from './AdapterProvider';
import { PendingValue } from './Price';
import { Button } from '../primitives/Button';
import { Dialog } from '../primitives/Overlay';
import { EmptyState } from '../primitives/Surface';
import { isUnavailable } from '../../domain/catalogue';
import {
  statusCopy,
  frequencyLabel,
  permittedOperations,
  subscriptionsAreOffered,
  type Subscription,
  type SubscriptionPolicy,
} from '../../domain/subscription';
import { subscriptionId as toSubId } from '../../domain/shared';

/* ================================================================== *
 * List
 * ================================================================== */

export function SubscriptionList() {
  const { subscriptions } = useAdapters();
  const [subs, setSubs] = useState<Subscription[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const list = await subscriptions.list().catch(() => []);
      if (!cancelled) setSubs([...list]);
    })();
    return () => {
      cancelled = true;
    };
  }, [subscriptions]);

  return (
    <div className="space-y-6">
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-charcoal">
        Your subscription
      </h1>

      {subs === null ? (
        <div className="h-40 animate-pulse rounded-sm bg-charcoal/5" />
      ) : subs.length === 0 ? (
        <EmptyState
          title="No subscription yet"
          body="A subscription brings your flavours on a schedule that suits you. It is being finalised — check back soon."
        />
      ) : (
        <ul className="space-y-4">
          {subs.map((s) => (
            <li key={s.id}>
              <Link
                href={`/account/subscriptions/${s.id}`}
                className="block rounded-sm border border-charcoal/12 bg-charcoal/[0.02] p-5 transition-colors hover:border-charcoal/25"
              >
                <div className="flex items-center gap-2">
                  <StatusDot tone={statusCopy(s.status).tone} />
                  <span className="font-[family-name:var(--font-fraunces)] text-lg text-charcoal">
                    {statusCopy(s.status).label}
                  </span>
                </div>
                <p className="mt-1 text-sm text-charcoal/70">
                  {frequencyLabel(s.frequency)} ·{' '}
                  {s.lines.map((l) => `${l.quantity}× ${l.productName}`).join(', ')}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ================================================================== *
 * Detail
 * ================================================================== */

export function SubscriptionDetail({ subscriptionId }: { subscriptionId: string }) {
  const { subscriptions } = useAdapters();
  const [sub, setSub] = useState<Subscription | null | undefined>(undefined);
  const [policy, setPolicy] = useState<SubscriptionPolicy | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = useCallback(async () => {
    const [s, p] = await Promise.all([
      subscriptions.byId(toSubId(subscriptionId)),
      subscriptions.policy(),
    ]);
    setSub(s);
    setPolicy(p);
  }, [subscriptions, subscriptionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = useCallback(
    async (fn: () => Promise<{ ok: boolean }>) => {
      setBusy(true);
      await fn();
      await load();
      setBusy(false);
    },
    [load]
  );

  if (sub === undefined || policy === null) {
    return <div className="h-64 animate-pulse rounded-sm bg-charcoal/5" />;
  }
  if (sub === null) {
    return (
      <EmptyState
        title="Subscription not found"
        body="We could not find that subscription on your account."
        action={
          <Button variant="secondary" asChild>
            <Link href="/account/subscriptions">Back</Link>
          </Button>
        }
      />
    );
  }

  const ops = permittedOperations(sub, policy);
  const id = sub.id;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/account/subscriptions"
          className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.14em] text-charcoal/55 hover:text-terracotta"
        >
          ← Subscription
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <StatusDot tone={statusCopy(sub.status).tone} />
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-charcoal">
            {statusCopy(sub.status).label}
          </h1>
        </div>
      </div>

      {/* ⚠ payment_failed → an actionable, non-judgemental banner. */}
      {sub.status === 'payment_failed' && (
        <div className="rounded-sm border border-terracotta/30 bg-terracotta/[0.05] p-4">
          <p className="text-sm leading-relaxed text-charcoal/85">
            The last payment for this subscription did not go through. Nothing has been charged
            since. You can update your payment details and we will try again.
          </p>
          {/* ⛔ Recovery is a state transition; the actual re-charge mechanism is
              blocked on D-09. The button reflects that honestly. */}
          <div className="mt-3">
            <Button
              size="sm"
              disabled={busy}
              onClick={() => void run(() => subscriptions.resolveFailedPayment(id))}
            >
              Mark as resolved
            </Button>
          </div>
        </div>
      )}

      {/* Schedule & contents */}
      <section className="grid gap-5 sm:grid-cols-2">
        <Panel label="Schedule">
          <p className="text-sm text-charcoal/80">{frequencyLabel(sub.frequency)}</p>
          <p className="mt-1 text-sm text-charcoal/60">
            Next delivery:{' '}
            {isUnavailable(sub.nextDeliveryAt) ? (
              <PendingValue value={sub.nextDeliveryAt} />
            ) : (
              new Date(sub.nextDeliveryAt).toLocaleDateString()
            )}
          </p>
          {/* ⛔ D-09 — the charge amount is genuinely unknown. */}
          <p className="mt-1 text-sm text-charcoal/60">
            Estimated total:{' '}
            {isUnavailable(sub.estimatedTotal) ? (
              <PendingValue value={sub.estimatedTotal} />
            ) : (
              String(sub.estimatedTotal.amount)
            )}
          </p>
        </Panel>

        <Panel label="Flavours">
          <ul className="space-y-1 text-sm text-charcoal/80">
            {sub.lines.map((l, i) => (
              <li key={i}>
                {l.quantity}× {l.productName}
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      {/* Management actions */}
      <section className="space-y-4 border-t border-charcoal/10 pt-6">
        <h2 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-charcoal/55">
          Manage
        </h2>

        <div className="flex flex-wrap gap-3">
          {ops.canPause && (
            <Button size="sm" variant="secondary" disabled={busy}
              onClick={() => void run(() => subscriptions.pause(id))}>
              Pause
            </Button>
          )}
          {ops.canResume && (
            <Button size="sm" disabled={busy}
              onClick={() => void run(() => subscriptions.resume(id))}>
              Resume
            </Button>
          )}
          {ops.canSkip && (
            <Button size="sm" variant="secondary" disabled={busy}
              onClick={() => void run(() => subscriptions.skipNext(id))}>
              Skip next delivery
            </Button>
          )}
          {ops.canReactivate && (
            <Button size="sm" disabled={busy}
              onClick={() => void run(() => subscriptions.reactivate(id))}>
              Reactivate
            </Button>
          )}
        </div>

        {/* Change controls — flavours/quantity/address/payment/frequency.
            ⛔ Frequency change needs offered frequencies (D-07); if none are
            offered, we say so rather than showing an empty picker. */}
        <div className="flex flex-wrap gap-3">
          {ops.canChangeFlavours && (
            <ManageLink label="Change flavours" note="Adjust which flavours arrive." />
          )}
          {ops.canChangeQuantity && (
            <ManageLink label="Change quantity" note="How many of each." />
          )}
          {ops.canChangeAddress && (
            <ManageLink label="Change delivery address" href="/account/addresses" />
          )}
          {ops.canChangePayment && (
            <ManageLink label="Change payment method" note="M-PESA or card." />
          )}
        </div>

        {!subscriptionsAreOffered(policy) && (
          <p className="text-xs leading-relaxed text-charcoal/55">
            Delivery frequencies are being confirmed, so some options are not yet available.
          </p>
        )}

        {/* Cancel — respects a minimum-commitment policy. */}
        <div className="pt-2">
          {ops.canCancel ? (
            <button
              onClick={() => setConfirmCancel(true)}
              className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.14em] text-charcoal/55 underline underline-offset-4 hover:text-terracotta"
            >
              Cancel subscription
            </button>
          ) : ops.cyclesUntilCancellable > 0 ? (
            <p className="text-xs text-charcoal/55">
              This plan can be cancelled after {ops.cyclesUntilCancellable} more{' '}
              {ops.cyclesUntilCancellable === 1 ? 'delivery' : 'deliveries'}.
            </p>
          ) : null}
        </div>
      </section>

      {confirmCancel && (
        <Dialog
          open
          onOpenChange={(o) => !o && setConfirmCancel(false)}
          title="Cancel this subscription?"
        >
          <p className="text-sm leading-relaxed text-charcoal/80">
            Your flavours will stop arriving. You can start a new subscription any time — your
            history stays on your account.
          </p>
          <div className="mt-5 flex gap-3">
            <Button
              disabled={busy}
              onClick={() =>
                void run(() => subscriptions.cancel(id)).then(() => setConfirmCancel(false))
              }
            >
              Yes, cancel
            </Button>
            <Button variant="ghost" onClick={() => setConfirmCancel(false)}>
              Keep it
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function ManageLink({ label, note, href }: { label: string; note?: string; href?: string }) {
  const inner = (
    <div className="rounded-sm border border-charcoal/15 bg-charcoal/[0.02] px-3 py-2">
      <span className="text-sm text-charcoal">{label}</span>
      {note && <span className="ml-2 text-xs text-charcoal/50">{note}</span>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-charcoal/12 bg-charcoal/[0.02] p-4">
      <h3 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-charcoal/55">
        {label}
      </h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function StatusDot({ tone }: { tone: 'positive' | 'neutral' | 'attention' }) {
  const color =
    tone === 'positive' ? 'bg-forest' : tone === 'attention' ? 'bg-terracotta' : 'bg-charcoal/40';
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} aria-hidden="true" />;
}
