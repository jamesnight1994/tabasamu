import { UnprocessableEntityException } from '@nestjs/common';
import { StockUnitStatus } from '@prisma/client';
import {
  assertTransition,
  canTransition,
  isTerminal,
  STOCK_UNIT_TRANSITIONS,
} from './stock-unit-status';

describe('stock-unit status machine', () => {
  it('allows the happy path printed → in_stock → sold', () => {
    expect(
      canTransition(StockUnitStatus.printed, StockUnitStatus.in_stock),
    ).toBe(true);
    expect(canTransition(StockUnitStatus.in_stock, StockUnitStatus.sold)).toBe(
      true,
    );
  });

  it('allows void from printed and in_stock', () => {
    expect(canTransition(StockUnitStatus.printed, StockUnitStatus.void)).toBe(
      true,
    );
    expect(canTransition(StockUnitStatus.in_stock, StockUnitStatus.void)).toBe(
      true,
    );
  });

  it('forbids skipping activation (printed → sold)', () => {
    expect(canTransition(StockUnitStatus.printed, StockUnitStatus.sold)).toBe(
      false,
    );
  });

  it('treats sold and void as terminal', () => {
    expect(isTerminal(StockUnitStatus.sold)).toBe(true);
    expect(isTerminal(StockUnitStatus.void)).toBe(true);
    expect(STOCK_UNIT_TRANSITIONS[StockUnitStatus.sold]).toHaveLength(0);
    expect(STOCK_UNIT_TRANSITIONS[StockUnitStatus.void]).toHaveLength(0);
  });

  it('never reactivates a sold unit', () => {
    expect(canTransition(StockUnitStatus.sold, StockUnitStatus.in_stock)).toBe(
      false,
    );
    expect(canTransition(StockUnitStatus.void, StockUnitStatus.in_stock)).toBe(
      false,
    );
  });

  it('assertTransition throws 422 with a machine-readable payload on illegal moves', () => {
    expect(() =>
      assertTransition(StockUnitStatus.sold, StockUnitStatus.in_stock),
    ).toThrow(UnprocessableEntityException);

    try {
      assertTransition(StockUnitStatus.printed, StockUnitStatus.sold);
      fail('expected throw');
    } catch (e) {
      const res = (e as UnprocessableEntityException).getResponse() as {
        from: string;
        to: string;
        allowedFrom: string[];
      };
      expect(res.from).toBe('printed');
      expect(res.to).toBe('sold');
      expect(res.allowedFrom).toEqual(['in_stock', 'void']);
    }
  });

  it('assertTransition is a no-op on legal moves', () => {
    expect(() =>
      assertTransition(StockUnitStatus.printed, StockUnitStatus.in_stock),
    ).not.toThrow();
  });
});
