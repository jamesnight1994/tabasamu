'use client';

/**
 * M-PESA PAYMENT STATUS
 *
 * ⚠ THE SINGLE MOST IMPORTANT SCREEN IN THE APPLICATION.
 *
 *   This is where a customer sits, holding their phone, having just been asked
 *   for money. Everything the architecture has been protecting comes to a point
 *   here, and there are exactly three things this screen must never do:
 *
 *     1. NEVER claim success on the initiate acknowledgement.
 *        Safaricom returns HTTP 200 the moment it ACCEPTS the push — before the
 *        customer has typed a PIN, and whether or not they ever will. This
 *        screen only ever believes a SERVER-CONFIRMED status.
 *
 *     2. NEVER show "failed" when it means "we do not know".
 *        If the callback never arrives, the money may still have left their
 *        account. Saying "failed" to someone who HAS paid invites them to pay
 *        twice, and it is how you lose a customer permanently.
 *
 *     3. NEVER lose the payment on a page reload.
 *        Nairobi connections drop. The `providerRef` is in the URL, and the
 *        status is fetched from the server — so a reload, a backgrounded tab, or
 *        a dead battery all recover cleanly.
 *
 *   [R-10, F-58, F-60]
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Button } from '../primitives/Button';
import { formatPhoneLocal, type E164Phone } from '../../domain/identity/phone';
import {
  type PaymentStatus as Status,
  PENDING_POLL_INTERVAL_MS,
  PENDING_WINDOW_MS,
} from '../../domain/payment';
import type { PaymentStatusResponse } from '../../domain/payment/contracts';
import { cn } from '../../lib/utils/cn';

/* ================================================================== *
 * View state
 * ================================================================== */

export type PaymentView =
  | { kind: 'awaiting_pin'; elapsedMs: number }
  | { kind: 'succeeded'; transactionRef: string | null }
  | { kind: 'failed'; reason: string | null }
  /** ⚠ NOT a failure. The honest middle. */
  | { kind: 'unknown' };

/**
 * ⚠ THE FUNCTION THAT DECIDES WHAT THE CUSTOMER SEES. Pure, so it is testable
 *   without a browser — and so the `unknown` branch cannot be "simplified away"
 *   by someone tidying a component under deadline.
 */
export const viewFor = (
  status: Status,
  elapsedMs: number,
  transactionRef: string | null,
  failureReason: string | null
): PaymentView => {
  switch (status) {
    case 'succeeded':
      return { kind: 'succeeded', transactionRef };
    case 'failed':
      return { kind: 'failed', reason: failureReason };
    case 'unknown':
      return { kind: 'unknown' };
    case 'initiated':
    case 'pending':
      // ⚠ Timed out with no callback. This is `unknown` — NOT `failed`.
      if (elapsedMs > PENDING_WINDOW_MS) return { kind: 'unknown' };
      return { kind: 'awaiting_pin', elapsedMs };
  }
};

/* ================================================================== *
 * The screen
 * ================================================================== */

export interface PaymentStatusScreenProps {
  providerRef: string;
  phone: E164Phone;
  /** Injected. The component never reaches for an adapter itself. [R-13] */
  fetchStatus(providerRef: string): Promise<PaymentStatusResponse | null>;
  onRetry(): void;
  orderNumber?: string;
}

export function PaymentStatusScreen({
  providerRef,
  phone,
  fetchStatus,
  onRetry,
  orderNumber,
}: PaymentStatusScreenProps) {
  const [status, setStatus] = useState<Status>('pending');
  const [txRef, setTxRef] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const started = useRef(Date.now());
  const stopped = useRef(false);

  /**
   * ⚠ POLLING IS THE FALLBACK, NOT THE MECHANISM.
   *
   *   The TRUTH arrives at the backend by callback. Polling exists because the
   *   customer's browser cannot receive that callback — and because a websocket
   *   dies the moment their connection blips, which on a Nairobi mobile network
   *   is often.
   *
   *   So we ASK the server, repeatedly, and the server answers from what the
   *   callback told it. The client is never the authority. [R-10]
   */
  const poll = useCallback(async () => {
    if (stopped.current) return;

    try {
      const r = await fetchStatus(providerRef);
      if (!r || stopped.current) return;

      setStatus(r.status);
      setTxRef(r.transactionRef);
      setReason(r.failureReason);

      // Stop polling once the server has given us a terminal answer.
      if (r.status === 'succeeded' || r.status === 'failed' || r.status === 'unknown') {
        stopped.current = true;
      }
    } catch {
      /**
       * ⚠ A FAILED POLL IS NOT A FAILED PAYMENT.
       *
       *   The customer's connection dropped. That tells us NOTHING about whether
       *   Safaricom took their money. We keep polling and we keep the screen in
       *   its pending state. Converting a network error into "payment failed"
       *   here would be the same lie the whole architecture exists to prevent.
       */
    }
  }, [providerRef, fetchStatus]);

  useEffect(() => {
    stopped.current = false;
    void poll();

    const tick = setInterval(() => {
      setElapsed(Date.now() - started.current);
    }, 1000);

    const pollTimer = setInterval(() => {
      void poll();
    }, PENDING_POLL_INTERVAL_MS);

    return () => {
      stopped.current = true;
      clearInterval(tick);
      clearInterval(pollTimer);
    };
  }, [poll]);

  const view = viewFor(status, elapsed, txRef, reason);

  /* ---------------- awaiting PIN ---------------- */

  if (view.kind === 'awaiting_pin') {
    const secondsLeft = Math.max(0, Math.ceil((PENDING_WINDOW_MS - view.elapsedMs) / 1000));

    return (
      <Panel tone="neutral">
        {/* ⚠ aria-live: a screen-reader user must be told the outcome without
            having to hunt for it. This region updates in place. */}
        <div aria-live="polite" aria-atomic="true">
          <Heading>Check your phone</Heading>

          <p className="mt-3 text-base leading-relaxed text-charcoal/80">
            We have sent a payment request to{' '}
            <span className="font-[family-name:var(--font-mono)] text-charcoal">
              {formatPhoneLocal(phone)}
            </span>
            . Enter your M-PESA PIN to confirm.
          </p>

          {/**
           * ⚠ NO SPINNER-AND-PRAY. The customer is told, explicitly, that this
           *   page updates itself — so they do not reload, and do not pay twice.
           */}
          <p className="mt-4 text-sm leading-relaxed text-charcoal/65">
            This page will update on its own. Do not close it, and do not pay
            again.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <Pulse />
            <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.16em] tabular-nums text-charcoal/55">
              Waiting — {secondsLeft}s
            </span>
          </div>
        </div>
      </Panel>
    );
  }

  /* ---------------- succeeded ---------------- */

  if (view.kind === 'succeeded') {
    return (
      <Panel tone="positive">
        <div aria-live="polite" aria-atomic="true">
          <Heading>Payment received</Heading>
          <p className="mt-3 text-base leading-relaxed text-charcoal/80">
            Thank you. We will confirm your delivery by SMS.
          </p>

          {/**
           * ⚠ THE M-PESA CODE IS SURFACED, PROMINENTLY. [D-33, R-21, F-88]
           *
           *   In this market the customer quotes the M-PESA receipt, not an order
           *   number, when they contact support. It is the PRIMARY SUPPORT KEY.
           *   Hiding it costs the care team every single conversation.
           *
           *   Rendered in JetBrains Mono because it will be read aloud,
           *   transcribed, and compared character by character.
           */}
          {view.transactionRef && (
            <dl className="mt-6 rounded-sm bg-charcoal/[0.04] p-4">
              <dt className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-charcoal/55">
                M-PESA reference
              </dt>
              <dd className="mt-1 font-[family-name:var(--font-mono)] text-lg tracking-wide text-charcoal">
                {view.transactionRef}
              </dd>
              <p className="mt-2 text-xs leading-relaxed text-charcoal/60">
                Keep this. Quote it if you need to contact us about this order.
              </p>
            </dl>
          )}

          {orderNumber && (
            <p className="mt-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.14em] text-charcoal/55">
              Order {orderNumber}
            </p>
          )}

          <div className="mt-8">
            <Button asChild>
              <Link href="/shop">Back to the shop</Link>
            </Button>
          </div>
        </div>
      </Panel>
    );
  }

  /* ---------------- failed ---------------- */

  if (view.kind === 'failed') {
    return (
      <Panel tone="attention">
        <div aria-live="assertive" aria-atomic="true">
          <Heading>The payment did not go through</Heading>

          {/**
           * ⚠ NON-JUDGEMENTAL, AND EXPLICIT ABOUT THE MONEY.
           *
           *   "Nothing has been charged" is the sentence the customer needs
           *   first. Their immediate fear is that they have paid and got
           *   nothing — and until that fear is answered they will not read
           *   anything else on the page. [Brand Book §07]
           */}
          <p className="mt-3 text-base leading-relaxed text-charcoal/80">
            Nothing has been charged. Your box is still here, exactly as you left
            it.
          </p>

          {reason && (
            <p className="mt-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.14em] text-charcoal/55">
              {reason}
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={onRetry}>Try again</Button>
            <Button variant="secondary" asChild>
              <Link href="/cart">Back to your box</Link>
            </Button>
          </div>
        </div>
      </Panel>
    );
  }

  /* ---------------- unknown ---------------- */

  /**
   * ⚠ THE STATE EVERY OTHER IMPLEMENTATION GETS WRONG.
   *
   *   We do not know. Safaricom has not told us. The money may or may not have
   *   left this person's account, and we will not pretend otherwise in either
   *   direction.
   *
   *   Note what this screen does NOT have: a "Try again" button. Offering a
   *   retry here is actively dangerous — it invites a customer who has ALREADY
   *   PAID to pay a second time. The single most important instruction on the
   *   page is DO NOT PAY AGAIN. [R-10, F-60]
   */
  return (
    <Panel tone="attention">
      <div aria-live="assertive" aria-atomic="true">
        <Heading>We have not heard back yet</Heading>

        <p className="mt-3 text-base leading-relaxed text-charcoal/80">
          M-PESA has not confirmed this payment to us.
        </p>

        <p className="mt-4 text-base font-medium leading-relaxed text-charcoal">
          Do not pay again.
        </p>

        <p className="mt-3 text-base leading-relaxed text-charcoal/80">
          If the money left your account, we will find it and confirm by SMS. If
          it did not, nothing has been charged.
        </p>

        {orderNumber && (
          <dl className="mt-6 rounded-sm bg-charcoal/[0.04] p-4">
            <dt className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-charcoal/55">
              Order
            </dt>
            <dd className="mt-1 font-[family-name:var(--font-mono)] text-base text-charcoal">
              {orderNumber}
            </dd>
            <p className="mt-2 text-xs leading-relaxed text-charcoal/60">
              Quote this, or your M-PESA message, if you contact us.
            </p>
          </dl>
        )}

        {/* ⚠ NO RETRY BUTTON. Deliberately. See the note above. */}
        <div className="mt-8">
          <Button variant="secondary" asChild>
            <Link href="/shop">Back to the shop</Link>
          </Button>
        </div>
      </div>
    </Panel>
  );
}

/* ================================================================== *
 * Chrome
 * ================================================================== */

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-[family-name:var(--font-fraunces)] text-2xl leading-tight text-charcoal sm:text-3xl">
      {children}
    </h1>
  );
}

function Panel({
  tone,
  children,
}: {
  tone: 'neutral' | 'positive' | 'attention';
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        'mx-auto max-w-xl rounded-sm border p-6 sm:p-8',
        tone === 'positive' && 'border-forest/25 bg-forest/[0.04]',
        tone === 'attention' && 'border-terracotta/30 bg-terracotta/[0.04]',
        tone === 'neutral' && 'border-charcoal/15 bg-cream'
      )}
    >
      {children}
    </section>
  );
}

/** A calm pulse. ⚠ Not a countdown bar — that manufactures urgency. [P-07] */
function Pulse() {
  return (
    <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-terracotta/50" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-terracotta" />
    </span>
  );
}
