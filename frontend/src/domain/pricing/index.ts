/**
 * DOMAIN — PRICING
 *
 * "All pricing, cart maths, delivery-fee rules and phone normalisation live
 *  here as pure functions. This is the single most important boundary in the
 *  codebase." — Phase 1, R-13 / NN-06
 *
 * ZERO React. ZERO HTTP. Every function here is deterministic and unit-tested
 * independently of any UI.
 *
 * ⛔ D-16 — VAT status unknown. NO TAX LOGIC IS WRITTEN. `tax` is `Unavailable`,
 *    not `zero()`. Rendering KES 0.00 tax would be an invented claim about the
 *    trading entity's VAT registration.
 */

import {
  type Money,
  type Result,
  type VariantId,
  type BundleId,
  Ok,
  Err,
  add,
  subtract,
  multiply,
  percentOf,
  clampZero,
  zero,
  gte,
  sum,
} from '../shared';
import { type Pending, type Unavailable, isUnavailable, unavailable } from '../catalogue';

/* ------------------------------------------------------------------ *
 * Lines
 * ------------------------------------------------------------------ */

export interface CartLine {
  readonly variantId: VariantId;
  readonly quantity: number;
  /** SNAPSHOTTED when added. A later price change must not rewrite the cart. */
  readonly unitPrice: Money;
  readonly bundleId: BundleId | null;
}

export const lineTotal = (line: CartLine): Money => multiply(line.unitPrice, line.quantity);

/* ------------------------------------------------------------------ *
 * Discounts — a coupon field and a cart line item. Never a banner,
 * never a countdown, never a badge. [P-07, binding]
 * ------------------------------------------------------------------ */

export type DiscountType = 'percent' | 'fixed' | 'free_delivery';

export interface Discount {
  readonly code: string;
  readonly type: DiscountType;
  readonly value: number; // percent (0-100) | minor units (fixed)
  readonly expiresAt: string | null;
  readonly minimumSpend: Money | null;
  /** ⛔ D-18 — can a coupon stack with the subscriber discount? */
  readonly stackable: boolean;
}

export type DiscountError =
  | { kind: 'not_found' }
  | { kind: 'expired' }
  | { kind: 'below_minimum'; minimum: Money }
  | { kind: 'empty_cart' };

export const discountErrorMessage = (e: DiscountError): string => {
  switch (e.kind) {
    case 'not_found':
      return 'That code is not recognised.';
    case 'expired':
      return 'That code has expired.';
    case 'below_minimum':
      return 'That code needs a larger order.';
    case 'empty_cart':
      return 'Add something to your box first.';
  }
};

/* ------------------------------------------------------------------ *
 * Delivery — ⛔ D-21/22/23. Zones, fees and lead times NOT supplied.
 * ------------------------------------------------------------------ */

export interface DeliveryQuote {
  readonly fee: Money;
  readonly leadTime: string;
}

/* ------------------------------------------------------------------ *
 * Totals
 * ------------------------------------------------------------------ */

export interface Totals {
  readonly subtotal: Money;
  readonly discount: Money;
  /** `Unavailable` until a zone is chosen — the fee is knowable BEFORE the cart. [P-03] */
  readonly delivery: Pending<Money>;
  /** ⛔ D-16 — ALWAYS `Unavailable` until the client confirms VAT status. */
  readonly tax: Unavailable;
  /** `Unavailable` while any component of it is unknown. We never show a fake total. */
  readonly total: Pending<Money>;
}

export interface CalculateTotalsInput {
  readonly lines: readonly CartLine[];
  readonly discount: Discount | null;
  readonly deliveryQuote: DeliveryQuote | null;
  /** ⛔ D-25 — free-delivery threshold not supplied. `null` = no threshold rule exists. */
  readonly freeDeliveryThreshold: Money | null;
}

const TAX_BLOCKED: Unavailable = unavailable(
  'D-16',
  'VAT registration status not confirmed. No tax is calculated or displayed.'
);

/**
 * THE core function. Pure. Integer arithmetic throughout.
 *
 * Order of operations is deliberate and must not be changed casually:
 *   1. subtotal   = Σ line totals
 *   2. discount   = applied to the SUBTOTAL only (never to delivery)
 *   3. delivery   = zone fee, waived if a free-delivery threshold is met
 *                   (measured against the DISCOUNTED subtotal)
 *   4. tax        = ⛔ not calculated (D-16)
 *   5. total      = (subtotal − discount) + delivery
 *
 * A `free_delivery` coupon zeroes the fee rather than reducing the subtotal.
 */
export const calculateTotals = (input: CalculateTotalsInput): Totals => {
  const { lines, discount, deliveryQuote, freeDeliveryThreshold } = input;

  const subtotal = sum(lines.map(lineTotal));

  // ---- 2. discount ----
  let discountAmount = zero();
  let deliveryWaivedByCoupon = false;

  if (discount) {
    switch (discount.type) {
      case 'percent':
        discountAmount = percentOf(subtotal, discount.value);
        break;
      case 'fixed':
        discountAmount = { ...subtotal, amount: Math.min(discount.value, subtotal.amount) };
        break;
      case 'free_delivery':
        deliveryWaivedByCoupon = true;
        break;
    }
  }
  // A discount can never exceed the subtotal.
  if (discountAmount.amount > subtotal.amount) discountAmount = subtotal;

  const discountedSubtotal = clampZero(subtract(subtotal, discountAmount));

  // ---- 3. delivery ----
  let delivery: Pending<Money>;
  if (deliveryQuote === null) {
    // No zone chosen yet. We do NOT show zero — we show "not yet known".
    delivery = unavailable('zone', 'Choose a delivery area to see the fee.');
  } else if (deliveryWaivedByCoupon) {
    delivery = zero();
  } else if (freeDeliveryThreshold && gte(discountedSubtotal, freeDeliveryThreshold)) {
    delivery = zero();
  } else {
    delivery = deliveryQuote.fee;
  }

  // ---- 5. total ----
  const total: Pending<Money> = isUnavailable(delivery)
    ? unavailable('zone', 'The total is not final until a delivery area is chosen.')
    : add(discountedSubtotal, delivery);

  return {
    subtotal,
    discount: discountAmount,
    delivery,
    tax: TAX_BLOCKED, // ⛔ D-16
    total,
  };
};

/* ------------------------------------------------------------------ *
 * Discount validation
 * ------------------------------------------------------------------ */

export const validateDiscount = (
  discount: Discount | undefined,
  lines: readonly CartLine[],
  now: Date = new Date()
): Result<Discount, DiscountError> => {
  if (!discount) return Err({ kind: 'not_found' });
  if (lines.length === 0) return Err({ kind: 'empty_cart' });

  if (discount.expiresAt && new Date(discount.expiresAt).getTime() < now.getTime()) {
    return Err({ kind: 'expired' });
  }

  if (discount.minimumSpend) {
    const subtotal = sum(lines.map(lineTotal));
    if (!gte(subtotal, discount.minimumSpend)) {
      return Err({ kind: 'below_minimum', minimum: discount.minimumSpend });
    }
  }

  return Ok(discount);
};

/* ------------------------------------------------------------------ *
 * Cart line mutation — pure. Returns a NEW array, never mutates.
 * ------------------------------------------------------------------ */

export const MAX_LINE_QUANTITY = 99;

export const addLine = (lines: readonly CartLine[], incoming: CartLine): readonly CartLine[] => {
  const i = lines.findIndex(
    (l) => l.variantId === incoming.variantId && l.bundleId === incoming.bundleId
  );
  if (i === -1) return [...lines, incoming];

  const merged: CartLine = {
    ...lines[i],
    quantity: Math.min(lines[i].quantity + incoming.quantity, MAX_LINE_QUANTITY),
  };
  return lines.map((l, idx) => (idx === i ? merged : l));
};

export const updateLineQuantity = (
  lines: readonly CartLine[],
  variantId: VariantId,
  quantity: number
): readonly CartLine[] => {
  if (quantity <= 0) return removeLine(lines, variantId);
  const clamped = Math.min(quantity, MAX_LINE_QUANTITY);
  return lines.map((l) => (l.variantId === variantId ? { ...l, quantity: clamped } : l));
};

export const removeLine = (
  lines: readonly CartLine[],
  variantId: VariantId
): readonly CartLine[] => lines.filter((l) => l.variantId !== variantId);

export const totalItemCount = (lines: readonly CartLine[]): number =>
  lines.reduce((n, l) => n + l.quantity, 0);
