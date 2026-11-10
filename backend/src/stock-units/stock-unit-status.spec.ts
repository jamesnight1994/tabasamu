import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { StockUnitStatus } from '@prisma/client';
import {
  ALLOWED_TRANSITIONS,
  assertTransition,
  isTransitionAllowed,
} from './stock-unit-status';

describe('stock-unit-status', () => {
  it('allows the documented happy-path and void edges', () => {
    expect(isTransitionAllowed(StockUnitStatus.printed, StockUnitStatus.in_stock)).toBe(true);
    expect(isTransitionAllowed(StockUnitStatus.printed, StockUnitStatus.void)).toBe(true);
    expect(isTransitionAllowed(StockUnitStatus.in_stock, StockUnitStatus.sold)).toBe(true);
    expect(isTransitionAllowed(StockUnitStatus.in_stock, StockUnitStatus.void)).toBe(true);
  });

  it('treats sold and void as terminal', () => {
    expect(ALLOWED_TRANSITIONS[StockUnitStatus.sold]).toEqual([]);
    expect(ALLOWED_TRANSITIONS[StockUnitStatus.void]).toEqual([]);
    expect(isTransitionAllowed(StockUnitStatus.sold, StockUnitStatus.in_stock)).toBe(false);
    expect(isTransitionAllowed(StockUnitStatus.sold, StockUnitStatus.void)).toBe(false);
    expect(isTransitionAllowed(StockUnitStatus.void, StockUnitStatus.printed)).toBe(false);
  });

  it('rejects sold reactivation with ConflictException', () => {
    expect(() =>
      assertTransition(StockUnitStatus.sold, StockUnitStatus.in_stock),
    ).toThrow(ConflictException);
    expect(() => assertTransition(StockUnitStatus.sold, StockUnitStatus.void)).toThrow(
      ConflictException,
    );
  });

  it('rejects void reuse with UnprocessableEntityException', () => {
    expect(() =>
      assertTransition(StockUnitStatus.void, StockUnitStatus.in_stock),
    ).toThrow(UnprocessableEntityException);
  });

  it('rejects fulfill-before-activate', () => {
    expect(() =>
      assertTransition(StockUnitStatus.printed, StockUnitStatus.sold),
    ).toThrow(UnprocessableEntityException);
  });

  it('rejects same-status as conflict', () => {
    expect(() =>
      assertTransition(StockUnitStatus.in_stock, StockUnitStatus.in_stock),
    ).toThrow(ConflictException);
    expect(() => assertTransition(StockUnitStatus.sold, StockUnitStatus.sold)).toThrow(
      ConflictException,
    );
  });

  it('passes allowed transitions without throwing', () => {
    expect(() =>
      assertTransition(StockUnitStatus.printed, StockUnitStatus.in_stock),
    ).not.toThrow();
    expect(() =>
      assertTransition(StockUnitStatus.in_stock, StockUnitStatus.void),
    ).not.toThrow();
  });
});
