import { UnprocessableEntityException } from '@nestjs/common';
import { StockUnitStatus } from '@prisma/client';

/**
 * Serialized stock-unit status machine (QR per bottle) — see #19/#20.
 *
 *   printed ──▶ in_stock ──▶ sold        (happy path)
 *   printed ──▶ void                     (never activated)
 *   in_stock ─▶ void                     (pulled after activation)
 *
 * `sold` and `void` are terminal: a sold unit is never reactivated — a
 * customer return gets a brand-new code (#24). This map is the single source
 * of truth for every lifecycle transition; the sibling endpoints
 * (activate #22, fulfill #23, void #24) must gate on it rather than mutating
 * `status` directly.
 */
export const STOCK_UNIT_TRANSITIONS: Readonly<
  Record<StockUnitStatus, readonly StockUnitStatus[]>
> = {
  [StockUnitStatus.printed]: [StockUnitStatus.in_stock, StockUnitStatus.void],
  [StockUnitStatus.in_stock]: [StockUnitStatus.sold, StockUnitStatus.void],
  [StockUnitStatus.sold]: [],
  [StockUnitStatus.void]: [],
};

/** Terminal statuses that can never transition again. */
export const TERMINAL_STOCK_UNIT_STATUSES: readonly StockUnitStatus[] = [
  StockUnitStatus.sold,
  StockUnitStatus.void,
];

/** Statuses that count towards a variant's sellable `stockOnHand`. */
export const STOCK_COUNTING_STATUSES: readonly StockUnitStatus[] = [
  StockUnitStatus.in_stock,
];

export function canTransition(
  from: StockUnitStatus,
  to: StockUnitStatus,
): boolean {
  return STOCK_UNIT_TRANSITIONS[from].includes(to);
}

export function isTerminal(status: StockUnitStatus): boolean {
  return TERMINAL_STOCK_UNIT_STATUSES.includes(status);
}

/**
 * Throw a 422 with a machine-readable payload when a transition is illegal.
 * Shared by the sibling transition endpoints so error shapes stay consistent.
 */
export function assertTransition(
  from: StockUnitStatus,
  to: StockUnitStatus,
): void {
  if (!canTransition(from, to)) {
    throw new UnprocessableEntityException({
      message: `Illegal stock-unit transition: ${from} → ${to}`,
      from,
      to,
      allowedFrom: STOCK_UNIT_TRANSITIONS[from],
    });
  }
}
