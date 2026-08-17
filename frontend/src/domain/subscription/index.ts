/**
 * SUBSCRIPTION DOMAIN
 *
 * ⚠ THE MANAGEMENT MACHINE IS REAL. THE BILLING MACHINE IS BLOCKED.
 *
 *   This is the exact line the brief demands we hold. A customer can, in the UI:
 *   change flavours, change quantity, change address, skip, pause, resume, cancel,
 *   reactivate — all of that is lifecycle management and it is fully modelled and
 *   tested here.
 *
 *   What is NOT modelled is WHEN AND HOW MONEY MOVES, because ⛔ D-09 is
 *   unanswered and it is *the* unanswered question of the payments architecture:
 *
 *     M-PESA has no card-on-file. There is no "charge the saved card each month".
 *     A recurring charge is either a standing order the customer sets up at
 *     Safaricom, or a re-prompt (a fresh STK push) each cycle that the customer
 *     must approve. These are completely different flows with different failure
 *     modes, and choosing between them is a business decision, not ours to guess.
 *
 *   So: `nextChargeAt`, the billing amount, and the failed-payment RECOVERY flow
 *   are typed as blocked (`Pending`), and the state machine has a
 *   `payment_failed` state that routes to a recovery the backend defines — but
 *   this domain invents no charging rule, no retry schedule, and no dunning
 *   sequence. [NN-04, NN-05, D-09]
 */

import {
  type Result,
  Ok,
  Err,
  type SubscriptionId,
  type VariantId,
  type AddressId,
  type Money,
} from '../shared';
import { type Pending, unavailable } from '../catalogue';

/* ================================================================== *
 * Frequency & policy — ALL configurable, nothing hardcoded
 * ================================================================== */

/**
 * ⛔ D-07 — the offered frequencies are unknown. This type can express any of
 *   them; the actual set offered is CONFIG the client supplies, not a constant
 *   baked in here. The default config below is EMPTY, so nothing is offered
 *   until a decision arrives.
 */
export type FrequencyUnit = 'week' | 'fortnight' | 'month';

export interface Frequency {
  readonly unit: FrequencyUnit;
  /** Every N units. "every 2 weeks" = { unit:'week', interval:2 }. */
  readonly interval: number;
}

export const frequencyLabel = (f: Frequency): string => {
  const base = f.unit === 'fortnight' ? 'fortnight' : f.unit;
  if (f.interval === 1) return `Every ${base}`;
  return `Every ${f.interval} ${base}s`;
};

/**
 * ⚠ WHAT A CUSTOMER IS ALLOWED TO DO IS CONFIGURABLE.
 *   "Can they pause?" "Is there a minimum number of cycles before cancel?"
 *   "How many times can they skip in a row?" — all business policy, all
 *   unconfirmed. The engine reads this; it does not hardcode a single answer.
 */
export interface SubscriptionPolicy {
  readonly offeredFrequencies: readonly Frequency[]; // ⛔ D-07 — empty by default
  readonly allowPause: boolean;
  readonly allowSkip: boolean;
  readonly allowFlavourChange: boolean;
  readonly allowQuantityChange: boolean;
  /** Minimum committed cycles before cancellation is permitted. 0 = no commitment. */
  readonly minCyclesBeforeCancel: number;
  /** ⛔ D-08 — subscriber discount. `Unavailable` until decided; never a guessed %. */
  readonly subscriberDiscount: Pending<{ readonly percent: number }>;
}

/** ⛔ Nothing offered, nothing discounted, everything permitted-in-principle. */
export const DEFAULT_SUBSCRIPTION_POLICY: SubscriptionPolicy = {
  offeredFrequencies: [], // ⛔ D-07
  allowPause: true,
  allowSkip: true,
  allowFlavourChange: true,
  allowQuantityChange: true,
  minCyclesBeforeCancel: 0,
  subscriberDiscount: unavailable('D-08', 'Subscriber discount percentage not decided.'),
};

export const subscriptionsAreOffered = (policy: SubscriptionPolicy): boolean =>
  policy.offeredFrequencies.length > 0;

/* ================================================================== *
 * State machine
 * ================================================================== */

/**
 * The lifecycle. Note `payment_failed` — a first-class state, not an error
 * swept under `active`. A subscription whose cycle charge failed is neither
 * healthy nor cancelled; it needs recovery, and the customer must SEE that.
 */
export const SUBSCRIPTION_STATUSES = [
  'active',
  'paused',
  'payment_failed', // ⛔ recovery flow defined by backend (D-09)
  'cancelled',
  'expired',
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/**
 * ⚠ TERMINAL vs RECOVERABLE.
 *   `cancelled` and `expired` are terminal — reactivation creates a NEW
 *   subscription, it does not resurrect the old one (so history stays honest).
 *   `paused` and `payment_failed` are recoverable in place.
 */
const TRANSITIONS: Record<SubscriptionStatus, readonly SubscriptionStatus[]> = {
  active: ['paused', 'payment_failed', 'cancelled', 'expired'],
  paused: ['active', 'cancelled', 'expired'],
  payment_failed: ['active', 'cancelled', 'expired'], // active = recovered
  cancelled: [], // terminal — reactivate = new subscription
  expired: [], // terminal
};

export const canTransition = (
  from: SubscriptionStatus,
  to: SubscriptionStatus
): boolean => from === to || TRANSITIONS[from].includes(to);

export const isTerminalSubscription = (s: SubscriptionStatus): boolean =>
  TRANSITIONS[s].length === 0;

export class IllegalSubscriptionTransition extends Error {
  constructor(
    readonly from: SubscriptionStatus,
    readonly to: SubscriptionStatus
  ) {
    super(`Cannot move a subscription from ${from} to ${to}.`);
    this.name = 'IllegalSubscriptionTransition';
  }
}

/* ================================================================== *
 * The subscription itself
 * ================================================================== */

export interface SubscriptionLine {
  readonly variantId: VariantId;
  readonly quantity: number;
  /** Snapshotted display copy so history renders even if a flavour is retired. */
  readonly productName: string;
}

export interface Subscription {
  readonly id: SubscriptionId;
  readonly status: SubscriptionStatus;
  readonly frequency: Frequency;
  readonly lines: readonly SubscriptionLine[];
  readonly deliveryAddressId: AddressId;
  readonly paymentMethod: 'mpesa' | 'card';

  /**
   * ⛔ D-09 — WHEN the next charge happens, and HOW MUCH, is blocked.
   *   `Pending` because the billing model (per-delivery vs up-front, standing
   *   order vs re-prompt) is undecided. We show the next DELIVERY date if the
   *   backend supplies it, but never invent a charge date or amount.
   */
  readonly nextDeliveryAt: Pending<number>; // epoch ms, or Unavailable
  readonly estimatedTotal: Pending<Money>;

  /** How many cycles have been fulfilled — drives minCyclesBeforeCancel. */
  readonly completedCycles: number;
  readonly createdAt: number;
}

/* ================================================================== *
 * Permitted operations — computed from state + policy
 * ================================================================== */

/**
 * ⚠ THE UI ASKS THIS, IT DOES NOT DECIDE IT.
 *   Whether the "Pause" button shows is a function of (current status, policy),
 *   computed once here, so the button and the action can never disagree.
 */
export interface PermittedOperations {
  readonly canPause: boolean;
  readonly canResume: boolean;
  readonly canSkip: boolean;
  readonly canChangeFlavours: boolean;
  readonly canChangeQuantity: boolean;
  readonly canChangeAddress: boolean;
  readonly canChangePayment: boolean;
  readonly canCancel: boolean;
  readonly canReactivate: boolean;
  /** If cancel is blocked by a minimum commitment, how many cycles remain. */
  readonly cyclesUntilCancellable: number;
}

export const permittedOperations = (
  sub: Subscription,
  policy: SubscriptionPolicy
): PermittedOperations => {
  const active = sub.status === 'active';
  const paused = sub.status === 'paused';
  const failed = sub.status === 'payment_failed';
  const terminal = isTerminalSubscription(sub.status);

  const cyclesLeft = Math.max(0, policy.minCyclesBeforeCancel - sub.completedCycles);
  const commitmentMet = cyclesLeft === 0;

  return {
    canPause: active && policy.allowPause,
    canResume: paused,
    canSkip: active && policy.allowSkip,
    canChangeFlavours: (active || paused) && policy.allowFlavourChange,
    canChangeQuantity: (active || paused) && policy.allowQuantityChange,
    canChangeAddress: active || paused || failed,
    canChangePayment: active || paused || failed,
    // ⚠ Cancellation respects a minimum commitment if the policy sets one.
    canCancel: (active || paused || failed) && commitmentMet,
    // Reactivation is offered on terminal subs, but creates a NEW subscription.
    canReactivate: terminal,
    cyclesUntilCancellable: cyclesLeft,
  };
};

/* ================================================================== *
 * Operations (pure state transitions; NO billing)
 * ================================================================== */

export type SubscriptionOpError =
  | { kind: 'not_permitted'; reason: string }
  | { kind: 'illegal_transition'; from: SubscriptionStatus; to: SubscriptionStatus }
  | { kind: 'blocked'; blockedBy: string };

const guard = (
  ok: boolean,
  reason: string
): Result<true, SubscriptionOpError> =>
  ok ? Ok(true) : Err({ kind: 'not_permitted', reason });

export const pause = (
  sub: Subscription,
  policy: SubscriptionPolicy
): Result<Subscription, SubscriptionOpError> => {
  const g = guard(permittedOperations(sub, policy).canPause, 'Pausing is not available.');
  if (!g.ok) return g;
  return Ok({ ...sub, status: 'paused' });
};

export const resume = (
  sub: Subscription,
  policy: SubscriptionPolicy
): Result<Subscription, SubscriptionOpError> => {
  const g = guard(permittedOperations(sub, policy).canResume, 'This subscription is not paused.');
  if (!g.ok) return g;
  return Ok({ ...sub, status: 'active' });
};

export const cancel = (
  sub: Subscription,
  policy: SubscriptionPolicy
): Result<Subscription, SubscriptionOpError> => {
  const ops = permittedOperations(sub, policy);
  if (!ops.canCancel) {
    if (ops.cyclesUntilCancellable > 0) {
      return Err({
        kind: 'not_permitted',
        reason: `This plan can be cancelled after ${ops.cyclesUntilCancellable} more ${
          ops.cyclesUntilCancellable === 1 ? 'delivery' : 'deliveries'
        }.`,
      });
    }
    return Err({ kind: 'not_permitted', reason: 'Cancellation is not available.' });
  }
  return Ok({ ...sub, status: 'cancelled' });
};

export const changeFlavours = (
  sub: Subscription,
  policy: SubscriptionPolicy,
  lines: readonly SubscriptionLine[]
): Result<Subscription, SubscriptionOpError> => {
  const g = guard(
    permittedOperations(sub, policy).canChangeFlavours,
    'Changing flavours is not available.'
  );
  if (!g.ok) return g;
  if (lines.length === 0)
    return Err({ kind: 'not_permitted', reason: 'A subscription needs at least one flavour.' });
  return Ok({ ...sub, lines });
};

export const changeFrequency = (
  sub: Subscription,
  policy: SubscriptionPolicy,
  frequency: Frequency
): Result<Subscription, SubscriptionOpError> => {
  // ⛔ Only among the OFFERED frequencies (D-07). An unoffered frequency is
  //    not selectable — the UI can't build a button for it either.
  const offered = policy.offeredFrequencies.some(
    (f) => f.unit === frequency.unit && f.interval === frequency.interval
  );
  if (!offered)
    return Err({ kind: 'blocked', blockedBy: 'D-07' });
  return Ok({ ...sub, frequency });
};

export const changeAddress = (
  sub: Subscription,
  policy: SubscriptionPolicy,
  addressId: AddressId
): Result<Subscription, SubscriptionOpError> => {
  const g = guard(
    permittedOperations(sub, policy).canChangeAddress,
    'Changing the address is not available.'
  );
  if (!g.ok) return g;
  return Ok({ ...sub, deliveryAddressId: addressId });
};

/**
 * ⛔ FAILED-PAYMENT RECOVERY IS BLOCKED ON D-09.
 *   We can MOVE a subscription to `active` once the backend confirms recovery,
 *   but HOW recovery happens — a fresh STK push? a standing order retry? a
 *   dunning email? — depends entirely on the billing model, which is undecided.
 *   This function only performs the STATE transition on confirmed recovery; it
 *   triggers no charge, because there is no defined charge to trigger.
 */
export const markRecovered = (
  sub: Subscription
): Result<Subscription, SubscriptionOpError> => {
  if (sub.status !== 'payment_failed')
    return Err({ kind: 'not_permitted', reason: 'This subscription has no failed payment.' });
  return Ok({ ...sub, status: 'active' });
};

export const statusCopy = (s: SubscriptionStatus): { label: string; tone: 'positive' | 'neutral' | 'attention' } => {
  switch (s) {
    case 'active':
      return { label: 'Active', tone: 'positive' };
    case 'paused':
      return { label: 'Paused', tone: 'neutral' };
    case 'payment_failed':
      // ⚠ Non-judgemental, actionable. Not "PAYMENT FAILED" in red caps.
      return { label: 'Needs attention', tone: 'attention' };
    case 'cancelled':
      return { label: 'Cancelled', tone: 'neutral' };
    case 'expired':
      return { label: 'Ended', tone: 'neutral' };
  }
};

export const subscriptionOpErrorMessage = (e: SubscriptionOpError): string => {
  switch (e.kind) {
    case 'not_permitted':
      return e.reason;
    case 'illegal_transition':
      return `That change is not possible from the current state.`;
    case 'blocked':
      return `This option is being finalised.`; // ⛔ e.g. D-07/D-09
  }
};
