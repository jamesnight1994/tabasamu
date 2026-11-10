import {
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { StockUnitStatus } from '@prisma/client';

/** Allowed edges. `sold` and `void` are terminal — returns get a new code. */
export const ALLOWED_TRANSITIONS: Readonly<
  Record<StockUnitStatus, readonly StockUnitStatus[]>
> = {
  [StockUnitStatus.printed]: [StockUnitStatus.in_stock, StockUnitStatus.void],
  [StockUnitStatus.in_stock]: [StockUnitStatus.sold, StockUnitStatus.void],
  [StockUnitStatus.sold]: [],
  [StockUnitStatus.void]: [],
};

export function isTransitionAllowed(
  from: StockUnitStatus,
  to: StockUnitStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/**
 * Gate every status change. Same-status / terminal conflicts → 409;
 * other illegal edges → 422.
 */
export function assertTransition(
  from: StockUnitStatus,
  to: StockUnitStatus,
): void {
  if (from === to) {
    if (from === StockUnitStatus.in_stock) {
      throw new ConflictException(
        'This bottle is already activated and in stock.',
      );
    }
    if (from === StockUnitStatus.sold) {
      throw new ConflictException('This bottle is already marked sold.');
    }
    if (from === StockUnitStatus.void) {
      throw new ConflictException('This code has already been voided.');
    }
    throw new ConflictException(`This bottle is already ${from}.`);
  }

  if (isTransitionAllowed(from, to)) {
    return;
  }

  if (from === StockUnitStatus.sold) {
    throw new ConflictException(
      'This bottle is already marked sold. Returns require a new code — sold units cannot be reactivated.',
    );
  }
  if (from === StockUnitStatus.void) {
    throw new UnprocessableEntityException(
      'This code has been voided. Print a new label.',
    );
  }
  if (from === StockUnitStatus.printed && to === StockUnitStatus.sold) {
    throw new UnprocessableEntityException(
      'This label was never activated. Bind a SKU before fulfilling.',
    );
  }

  throw new UnprocessableEntityException(
    `Illegal status transition: ${from} → ${to}. Allowed from ${from}: ${
      ALLOWED_TRANSITIONS[from].join(', ') || 'none (terminal)'
    }.`,
  );
}
