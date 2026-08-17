/**
 * DOMAIN — ORDER STATE MACHINE
 *
 * ⚠ THE CENTRAL RULE OF THIS FILE:
 *
 *   An order's status is NEVER assigned. It is TRANSITIONED, and every
 *   transition is checked against an explicit table. An illegal transition is
 *   a BUG, and it fails loudly here rather than silently corrupting an order.
 *
 *   This matters more than usual in this integration. M-PESA callbacks arrive
 *   LATE, arrive TWICE, and sometimes never arrive at all. Without a guard, a
 *   duplicate callback would happily drive `delivered → paid`, and a late
 *   callback would drive `cancelled → paid`. Both are silent data corruption
 *   that surfaces days later as a customer dispute.
 *
 *   So the transition table is the guard, and it is enforced in the domain —
 *   not in a controller, not in a component, and not in the backend developer's
 *   memory. [R-10, R-13, NN-06]
 *
 * ⛔ D-38 — the auto-cancel window for an unpaid order has NOT been supplied.
 *    `payment_expired` therefore EXISTS as a state but NOTHING in this codebase
 *    moves an order into it on a timer. An order will not be auto-cancelled
 *    without an explicit rule from the client.
 */

import type { ISODateTime, OrderId } from '../shared';

/* ================================================================== *
 * The states
 * ================================================================== */

/**
 * ```
 *  draft
 *    │  customer places order
 *    ▼
 *  awaiting_payment ──────────────┐
 *    │  STK push accepted         │ customer abandons / D-38 window
 *    ▼                            ▼
 *  payment_processing        payment_expired
 *    │                            │
 *    ├──▶ paid ──▶ confirmed ──▶ preparing ──▶ ready_for_dispatch
 *    │                                              │
 *    ├──▶ payment_failed  (retryable)               ▼
 *    │                                          dispatched
 *    └──▶ manual_reconciliation ⚠                   │
 *         (NO CALLBACK — we do not know)            ▼
 *                                               delivered
 *
 *  Refunds branch off any settled state:
 *    paid… ──▶ refund_pending ──▶ refunded | partially_refunded
 * ```
 */
export const ORDER_STATUSES = [
  'draft',
  'awaiting_payment',
  'payment_processing',
  'paid',
  'payment_failed',
  'payment_expired',
  /**
   * ⚠ NOT in the original brief, and NOT optional.
   *   M-PESA produced no callback within the window. We do NOT know whether the
   *   customer's money left their account. Collapsing this into `payment_failed`
   *   would tell a customer who HAS paid that they have not. [R-10, F-58]
   */
  'manual_reconciliation',
  'confirmed',
  'preparing',
  'ready_for_dispatch',
  'dispatched',
  'delivered',
  'cancelled',
  'refund_pending',
  'refunded',
  'partially_refunded',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/* ================================================================== *
 * The transition table — THE contract
 * ================================================================== */

/**
 * Permitted transitions. Anything not listed is ILLEGAL and throws.
 *
 * ⚠ Read the terminal states carefully. `delivered`, `refunded` and `cancelled`
 *   have NO outbound transitions. A late or duplicate M-PESA callback arriving
 *   after delivery therefore CANNOT rewrite the order. That is the point.
 */
export const ORDER_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  draft: ['awaiting_payment', 'cancelled'],

  awaiting_payment: ['payment_processing', 'payment_expired', 'cancelled'],

  /** The STK push is out. All three real outcomes are reachable from here. */
  payment_processing: ['paid', 'payment_failed', 'manual_reconciliation', 'cancelled'],

  /** A failed payment is RETRYABLE — the cart is not destroyed. */
  payment_failed: ['awaiting_payment', 'cancelled'],

  payment_expired: ['awaiting_payment', 'cancelled'],

  /**
   * ⚠ The reconciliation state resolves in exactly two directions, and ONLY by
   *   a human or a late callback — never by a timer.
   *     → paid       the money is found (late callback, or ops checks the till)
   *     → payment_failed  the money is confirmed absent
   */
  manual_reconciliation: ['paid', 'payment_failed', 'cancelled'],

  paid: ['confirmed', 'refund_pending', 'cancelled'],

  confirmed: ['preparing', 'refund_pending', 'cancelled'],

  preparing: ['ready_for_dispatch', 'refund_pending', 'cancelled'],

  ready_for_dispatch: ['dispatched', 'refund_pending', 'cancelled'],

  /** Once it is on a boda, it is not cancellable — only refundable. */
  dispatched: ['delivered', 'refund_pending'],

  delivered: ['refund_pending'],

  /**
   * ⚠ D-37 — an M-PESA refund is a MANUAL B2C reversal, not an API call that
   *   settles instantly. It is a TASK WITH A STATE, which is exactly why
   *   `refund_pending` exists as a first-class state rather than an optimistic
   *   flip straight to `refunded`.
   */
  refund_pending: ['refunded', 'partially_refunded', 'paid'],

  /* ---- terminal ---- */
  cancelled: [],
  refunded: [],
  partially_refunded: [],
};

/* ================================================================== *
 * Guards
 * ================================================================== */

export const TERMINAL_ORDER_STATUSES: readonly OrderStatus[] = [
  'cancelled',
  'refunded',
  'partially_refunded',
];

export const isTerminalOrder = (s: OrderStatus): boolean =>
  ORDER_TRANSITIONS[s].length === 0;

/** Has the customer's money actually settled? */
export const isSettled = (s: OrderStatus): boolean =>
  (
    [
      'paid',
      'confirmed',
      'preparing',
      'ready_for_dispatch',
      'dispatched',
      'delivered',
      'refund_pending',
      'partially_refunded',
    ] as readonly OrderStatus[]
  ).includes(s);

/**
 * ⚠ Distinct from `isSettled`. This asks: is the order still WAITING on money?
 *   `manual_reconciliation` is neither settled nor unsettled — we do not know.
 */
export const isAwaitingMoney = (s: OrderStatus): boolean =>
  (
    ['awaiting_payment', 'payment_processing', 'payment_failed', 'payment_expired'] as readonly OrderStatus[]
  ).includes(s);

/** ⚠ The honest middle. Neither paid nor failed. Needs a human. */
export const needsReconciliation = (s: OrderStatus): boolean => s === 'manual_reconciliation';

export const canTransition = (from: OrderStatus, to: OrderStatus): boolean =>
  ORDER_TRANSITIONS[from].includes(to);

export class IllegalTransitionError extends Error {
  constructor(
    readonly from: OrderStatus,
    readonly to: OrderStatus
  ) {
    super(
      `Illegal order transition: ${from} → ${to}. ` +
        `Permitted from '${from}': [${ORDER_TRANSITIONS[from].join(', ') || 'none — terminal'}].`
    );
    this.name = 'IllegalTransitionError';
  }
}

/**
 * THE transition function. Total, pure, and loud on misuse.
 *
 * ⚠ IDEMPOTENCY. A transition to the state the order is ALREADY in is a NO-OP,
 *   not an error. This is deliberate and it is load-bearing: M-PESA WILL send
 *   the same callback twice, and the second one must be harmless.
 *
 *   Note what this does NOT do — it does not silently swallow every repeat.
 *   `delivered → delivered` is a no-op. But `delivered → paid` (a genuinely
 *   late duplicate) still THROWS, because that is data corruption, not a retry.
 */
export const transition = (from: OrderStatus, to: OrderStatus): OrderStatus => {
  if (from === to) return from; // idempotent replay — safe
  if (!canTransition(from, to)) throw new IllegalTransitionError(from, to);
  return to;
};

/** Non-throwing variant for adapters processing untrusted webhook payloads. */
export const tryTransition = (
  from: OrderStatus,
  to: OrderStatus
): { ok: true; status: OrderStatus; changed: boolean } | { ok: false; reason: string } => {
  if (from === to) return { ok: true, status: from, changed: false };
  if (!canTransition(from, to)) {
    return { ok: false, reason: `illegal transition ${from} → ${to}` };
  }
  return { ok: true, status: to, changed: true };
};

/* ================================================================== *
 * The audit trail
 * ================================================================== */

/**
 * Append-only. NEVER mutated, NEVER deleted.
 *
 * ⚠ This is what lets customer care answer "what happened to my order?" — and,
 *   critically, "did my money go through?". In a market where the customer's
 *   proof of payment is an SMS on their handset, an order without a history is
 *   an order you cannot defend. [R-21, F-89]
 */
export interface OrderEvent {
  readonly id: string;
  readonly orderId: OrderId;
  readonly from: OrderStatus | null;
  readonly to: OrderStatus;
  /** 'customer' | 'webhook:mpesa' | 'webhook:card' | 'ops:<user>' | 'system' */
  readonly actor: string;
  readonly reason: string | null;
  /** Set for webhook-driven transitions. Duplicate keys must be a no-op. */
  readonly idempotencyKey: string | null;
  readonly at: ISODateTime;
}

/* ================================================================== *
 * Customer-facing copy
 * ================================================================== */

/**
 * Written in-voice: no exclamation marks, no jokes, no urgency, and
 * non-judgemental on failure. [Brand Book §07, P-07]
 *
 * ⚠ Note `manual_reconciliation`. It does not say "your payment failed" and it
 *   does not say "your payment succeeded". It says, honestly, that we have not
 *   heard back — and it tells them NOT to pay twice.
 */
export const orderStatusCopy = (
  s: OrderStatus
): { label: string; body: string; tone: 'neutral' | 'positive' | 'attention' } => {
  switch (s) {
    case 'draft':
      return { label: 'Not yet placed', body: 'Your box is still here.', tone: 'neutral' };
    case 'awaiting_payment':
      return {
        label: 'Awaiting payment',
        body: 'We are waiting for payment to begin.',
        tone: 'neutral',
      };
    case 'payment_processing':
      return {
        label: 'Check your phone',
        body: 'We have sent a payment request to your handset. Enter your M-PESA PIN to confirm.',
        tone: 'attention',
      };
    case 'paid':
      return { label: 'Payment received', body: 'Thank you. We have your order.', tone: 'positive' };
    case 'payment_failed':
      return {
        label: 'Payment did not go through',
        body: 'Nothing has been charged. Your box is still here, exactly as you left it.',
        tone: 'attention',
      };
    case 'payment_expired':
      return {
        label: 'The payment request expired',
        body: 'Nothing has been charged. You can try again whenever you are ready.',
        tone: 'attention',
      };
    case 'manual_reconciliation':
      return {
        label: 'We have not heard back yet',
        body: 'M-PESA has not confirmed this payment to us. Do not pay again. If the money left your account, we will find it and confirm by SMS.',
        tone: 'attention',
      };
    case 'confirmed':
      return { label: 'Confirmed', body: 'Your order is with the kitchen.', tone: 'positive' };
    case 'preparing':
      return { label: 'Being packed', body: 'We are packing your box.', tone: 'positive' };
    case 'ready_for_dispatch':
      return { label: 'Ready to leave', body: 'Your box is packed and waiting for the rider.', tone: 'positive' };
    case 'dispatched':
      return { label: 'On its way', body: 'The rider will call the number on this order.', tone: 'positive' };
    case 'delivered':
      return { label: 'Delivered', body: 'Your box has arrived.', tone: 'positive' };
    case 'cancelled':
      return { label: 'Cancelled', body: 'This order was cancelled.', tone: 'neutral' };
    case 'refund_pending':
      /** ⚠ D-37 — deliberately does NOT promise a timeframe. No SLA has been supplied. */
      return {
        label: 'Refund in progress',
        body: 'We are returning your money. We will confirm by SMS when it is sent.',
        tone: 'neutral',
      };
    case 'refunded':
      return { label: 'Refunded', body: 'Your money has been returned.', tone: 'neutral' };
    case 'partially_refunded':
      return {
        label: 'Partly refunded',
        body: 'Part of your money has been returned.',
        tone: 'neutral',
      };
  }
};
