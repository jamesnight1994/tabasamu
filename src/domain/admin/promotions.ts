/**
 * PROMOTIONS (ADMIN)
 *
 * The admin-side promotion model. Richer than the storefront `Discount` (which
 * only needs code/type/value to apply a coupon at checkout) — this carries the
 * operational fields staff manage: restrictions, limits, date range, usage.
 *
 * ⚠ THE STOREFRONT AND ADMIN MODELS ARE DELIBERATELY DIFFERENT.
 *   A shopper's cart needs "is this code valid, and what does it take off?".
 *   An admin needs "who can use it, how many times, until when, and how often
 *   has it been used?". Forcing one shape to serve both bloats the checkout with
 *   fields it never reads. The admin model PROJECTS DOWN to the storefront
 *   `Discount` when a coupon is applied. [pricing domain]
 *
 * ⚠ LIMITS ARE ENFORCED SERVER-SIDE. The client can show "3 of 100 used", but a
 *   usage limit that matters (one per customer, 100 total) MUST be enforced at
 *   redemption on the backend — a client check is racy and bypassable.
 */

import { type Result, Ok, Err, type Money } from '../shared';

/* ================================================================== *
 * Types
 * ================================================================== */

export type PromotionType =
  | 'percentage'      // N% off
  | 'fixed'           // fixed amount off (minor units)
  | 'free_delivery';  // waive the delivery fee ⛔ (needs delivery config — D-22)

export interface Promotion {
  readonly id: string;
  readonly code: string;
  readonly type: PromotionType;
  /** percent (0–100) for percentage; minor units for fixed; ignored for free_delivery. */
  readonly value: number;

  // Restrictions — all optional; absence means "no restriction".
  /** Only applies to these variant ids. Empty = all products. */
  readonly productRestriction: readonly string[];
  /** Only these customers may use it. Empty = anyone. */
  readonly customerRestriction: readonly string[];
  readonly minimumSpend: Money | null;

  // Window — either bound may be null (open-ended).
  readonly startsAt: number | null;
  readonly endsAt: number | null;

  // Limits.
  /** Total redemptions allowed across everyone. null = unlimited. */
  readonly usageLimit: number | null;
  /** Redemptions allowed per customer. null = unlimited. */
  readonly perCustomerLimit: number | null;

  // State.
  readonly active: boolean;
  readonly timesUsed: number;
  readonly createdAt: number;
}

/* ================================================================== *
 * Status — derived from state + window + usage
 * ================================================================== */

export type PromotionStatus =
  | 'scheduled'   // active, but startsAt is in the future
  | 'live'        // active and within window and under limit
  | 'paused'      // manually deactivated
  | 'expired'     // past endsAt
  | 'exhausted';  // usage limit reached

export const promotionStatus = (p: Promotion, now: number = Date.now()): PromotionStatus => {
  if (!p.active) return 'paused';
  if (p.usageLimit !== null && p.timesUsed >= p.usageLimit) return 'exhausted';
  if (p.endsAt !== null && now > p.endsAt) return 'expired';
  if (p.startsAt !== null && now < p.startsAt) return 'scheduled';
  return 'live';
};

export const promotionStatusCopy = (
  s: PromotionStatus
): { label: string; tone: 'positive' | 'neutral' | 'attention' } =>
  ({
    scheduled: { label: 'Scheduled', tone: 'neutral' as const },
    live: { label: 'Live', tone: 'positive' as const },
    paused: { label: 'Paused', tone: 'neutral' as const },
    expired: { label: 'Expired', tone: 'neutral' as const },
    exhausted: { label: 'Fully used', tone: 'attention' as const },
  })[s];

/* ================================================================== *
 * Validation — creating / editing a promotion
 * ================================================================== */

export interface PromotionInput {
  readonly code: string;
  readonly type: PromotionType;
  readonly value: number;
  readonly productRestriction: readonly string[];
  readonly customerRestriction: readonly string[];
  readonly minimumSpend: Money | null;
  readonly startsAt: number | null;
  readonly endsAt: number | null;
  readonly usageLimit: number | null;
  readonly perCustomerLimit: number | null;
  readonly active: boolean;
}

export type PromotionFieldError =
  | { field: 'code'; message: string }
  | { field: 'value'; message: string }
  | { field: 'endsAt'; message: string }
  | { field: 'usageLimit'; message: string };

export const validatePromotion = (
  input: PromotionInput
): Result<PromotionInput, readonly PromotionFieldError[]> => {
  const errors: PromotionFieldError[] = [];

  const code = input.code.trim();
  if (code.length < 3) errors.push({ field: 'code', message: 'Codes are at least 3 characters.' });
  if (/\s/.test(code)) errors.push({ field: 'code', message: 'Codes cannot contain spaces.' });

  if (input.type === 'percentage') {
    if (input.value <= 0 || input.value > 100) {
      errors.push({ field: 'value', message: 'A percentage is between 1 and 100.' });
    }
  } else if (input.type === 'fixed') {
    if (input.value <= 0) errors.push({ field: 'value', message: 'A fixed discount must be more than zero.' });
  }

  // A window that ends before it starts is a mistake.
  if (input.startsAt !== null && input.endsAt !== null && input.endsAt <= input.startsAt) {
    errors.push({ field: 'endsAt', message: 'The end must be after the start.' });
  }

  if (input.usageLimit !== null && input.usageLimit < 1) {
    errors.push({ field: 'usageLimit', message: 'A usage limit must be at least 1, or leave it empty.' });
  }

  if (errors.length > 0) return Err(errors);
  return Ok({ ...input, code: code.toUpperCase() });
};

export const promotionValueLabel = (p: Pick<Promotion, 'type' | 'value'>): string => {
  switch (p.type) {
    case 'percentage':
      return `${p.value}% off`;
    case 'fixed':
      // ⛔ D-14 — currency formatting handled by the shared formatter elsewhere;
      //    here we describe the shape, not an approved price.
      return `Fixed amount off`;
    case 'free_delivery':
      return 'Free delivery';
  }
};

export const usageSummary = (p: Promotion): string => {
  if (p.usageLimit === null) return `${p.timesUsed} used`;
  return `${p.timesUsed} of ${p.usageLimit} used`;
};
