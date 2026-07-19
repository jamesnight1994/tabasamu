/**
 * STOCK MOVEMENT
 *
 * ⚠ EVERY STOCK CHANGE IS A MOVEMENT WITH A REASON. NOTHING IS A SILENT EDIT.
 *
 *   The naive inventory admin lets someone type a new "on hand" number over the
 *   old one. That destroys the one thing inventory needs: an explanation. Where
 *   did 40 bottles go? This model never overwrites a quantity — it appends a
 *   MOVEMENT (a delta, a reason code, an actor, a timestamp), and the current
 *   level is the sum of movements. That is how you answer "why is the count
 *   wrong?" — you read the history.
 *
 * ⚠ RESERVED and DAMAGED are distinct from on-hand.
 *   Reserved stock is committed to unpaid orders (it exists but can't be sold
 *   again). Damaged stock is written off. Conflating either with on-hand is how
 *   an oversell happens. The movement `kind` keeps them separate.
 */

import { type Result, Ok, Err, type VariantId } from '../shared';

/* ================================================================== *
 * Reason codes — WHY stock moved
 * ================================================================== */

/**
 * ⚠ A CONTROLLED VOCABULARY, not a free-text box. Free text can't be reported
 *   on ("how much did we lose to damage this month?"). Reason codes can.
 */
export const STOCK_REASON_CODES = [
  'received',        // a delivery / production batch arrived (+)
  'sold',            // an order was fulfilled (−)
  'reserved',        // committed to an order awaiting payment (moves to reserved)
  'released',        // a reservation freed (payment failed / order cancelled)
  'damaged',         // written off — breakage, spoilage (−)
  'expired',         // written off — past shelf life (−) ⛔ needs D-30 (shelf life)
  'recount',         // a physical count correction (± to match reality)
  'returned',        // a customer return added back (+)
  'transfer',        // moved between locations (± , future multi-location)
] as const;

export type StockReasonCode = (typeof STOCK_REASON_CODES)[number];

export const reasonLabel = (code: StockReasonCode): string =>
  ({
    received: 'Received (new stock)',
    sold: 'Sold',
    reserved: 'Reserved for order',
    released: 'Reservation released',
    damaged: 'Damaged / written off',
    expired: 'Expired / written off',
    recount: 'Physical recount',
    returned: 'Customer return',
    transfer: 'Location transfer',
  })[code];

/** Which pool a reason code affects. */
export const reasonAffects = (code: StockReasonCode): 'on_hand' | 'reserved' | 'damaged' =>
  code === 'reserved' || code === 'released'
    ? 'reserved'
    : code === 'damaged' || code === 'expired'
      ? 'damaged'
      : 'on_hand';

/* ================================================================== *
 * A movement
 * ================================================================== */

export interface StockMovement {
  readonly id: string;
  readonly variantId: VariantId;
  /** Signed. +12 received, −3 damaged. Never absolute. */
  readonly delta: number;
  readonly reason: StockReasonCode;
  /** Free-text elaboration on the reason code — optional, not a substitute. */
  readonly note: string;
  readonly actorId: string;
  readonly actorName: string;
  readonly at: number;
  /** The on-hand level AFTER this movement — snapshotted for fast history reads. */
  readonly balanceAfter: number;
}

/* ================================================================== *
 * Applying an adjustment — pure, validated
 * ================================================================== */

export interface AdjustmentInput {
  readonly variantId: VariantId;
  readonly delta: number;
  readonly reason: StockReasonCode;
  readonly note: string;
}

export type AdjustmentError =
  | { kind: 'zero_delta' }
  | { kind: 'would_go_negative'; current: number; delta: number }
  | { kind: 'note_required_for_recount' };

/**
 * ⚠ VALIDATES BEFORE IT MUTATES.
 *   - a zero delta is a no-op mistake → rejected
 *   - a recount with no note is un-auditable → rejected (why did the count change?)
 *   - driving on-hand negative is impossible in the real world → rejected
 */
export const validateAdjustment = (
  input: AdjustmentInput,
  currentOnHand: number
): Result<AdjustmentInput, AdjustmentError> => {
  if (input.delta === 0) return Err({ kind: 'zero_delta' });
  if (input.reason === 'recount' && input.note.trim().length === 0) {
    return Err({ kind: 'note_required_for_recount' });
  }
  // On-hand and damaged reductions cannot exceed what exists.
  if (reasonAffects(input.reason) !== 'reserved' && currentOnHand + input.delta < 0) {
    return Err({ kind: 'would_go_negative', current: currentOnHand, delta: input.delta });
  }
  return Ok(input);
};

export const adjustmentErrorMessage = (e: AdjustmentError): string => {
  switch (e.kind) {
    case 'zero_delta':
      return 'Enter a non-zero change.';
    case 'would_go_negative':
      return `That would take stock below zero (currently ${e.current}). Check the number.`;
    case 'note_required_for_recount':
      return 'A recount needs a note explaining what changed.';
  }
};

/** Fold a movement history into a current on-hand level. The source of truth. */
export const onHandFromMovements = (movements: readonly StockMovement[]): number =>
  movements
    .filter((m) => reasonAffects(m.reason) === 'on_hand')
    .reduce((sum, m) => sum + m.delta, 0);
