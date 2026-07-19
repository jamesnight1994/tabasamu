import { describe, it, expect } from 'vitest';
import {
  money,
  fromMajor,
  zero,
  add,
  subtract,
  multiply,
  percentOf,
  sum,
  clampZero,
  formatMoney,
  MoneyError,
  variantId,
} from '../../src/domain/shared';
import {
  normalisePhone,
  isValidPhone,
  formatPhoneLocal,
  formatPhoneInternational,
} from '../../src/domain/identity/phone';
import {
  calculateTotals,
  validateDiscount,
  addLine,
  updateLineQuantity,
  removeLine,
  totalItemCount,
  lineTotal,
  MAX_LINE_QUANTITY,
  type CartLine,
  type Discount,
} from '../../src/domain/pricing';
import {
  resolveOutcome,
  isFailure,
  isIndeterminate,
  hasExceededWindow,
  outcomeCopy,
  PENDING_WINDOW_MS,
  type Payment,
} from '../../src/domain/payment';
import { isUnavailable, stockStatus, availableStock, unavailable } from '../../src/domain/catalogue';

/* ================================================================== *
 * MONEY — integer arithmetic. A float here becomes a customer dispute.
 * ================================================================== */

describe('Money', () => {
  it('rejects non-integer minor units', () => {
    expect(() => money(10.5)).toThrow(MoneyError);
  });

  it('converts major units correctly', () => {
    expect(fromMajor(550).amount).toBe(55000);
    expect(fromMajor(0.01).amount).toBe(1);
  });

  it('adds and subtracts without float drift', () => {
    // The classic: 0.1 + 0.2 !== 0.3 in floats. In minor units it is exact.
    const a = fromMajor(0.1);
    const b = fromMajor(0.2);
    expect(add(a, b).amount).toBe(30);
    expect(formatMoney(add(a, b))).toBe('KES 0.30');
  });

  it('never drifts across a long summation', () => {
    const items = Array.from({ length: 1000 }, () => fromMajor(0.07));
    expect(sum(items).amount).toBe(7000); // exactly KES 70.00
  });

  it('rounds percentages half-up, deterministically', () => {
    // 10% of KES 5.55 = 55.5 minor units → 56
    expect(percentOf(fromMajor(5.55), 10).amount).toBe(56);
  });

  it('refuses to mix currencies', () => {
    const kes = money(100, 'KES');
    const other = { ...kes, currency: 'USD' as never };
    expect(() => add(kes, other)).toThrow(MoneyError);
  });

  it('clamps negatives to zero', () => {
    expect(clampZero(money(-500)).amount).toBe(0);
    expect(clampZero(money(500)).amount).toBe(500);
  });

  it('multiplies by a quantity exactly', () => {
    expect(multiply(fromMajor(550), 3).amount).toBe(165000);
  });

  it('formats without cents when whole', () => {
    expect(formatMoney(fromMajor(550))).toBe('KES 550');
    expect(formatMoney(fromMajor(1550.5))).toBe('KES 1,550.50');
  });

  it('subtract is the inverse of add', () => {
    const a = fromMajor(123.45);
    const b = fromMajor(67.89);
    expect(subtract(add(a, b), b).amount).toBe(a.amount);
  });

  it('an empty sum is zero, not NaN', () => {
    expect(sum([]).amount).toBe(0);
    expect(zero().amount).toBe(0);
  });
});

/* ================================================================== *
 * PHONE — the M-PESA-critical function.
 *
 * A wrongly-normalised number sends the STK push to the wrong handset,
 * or to nobody. Every shape a real Kenyan customer types is tested.
 * ================================================================== */

describe('normalisePhone', () => {
  const VALID = [
    ['0712345678', '254712345678'],
    ['0112345678', '254112345678'],
    ['+254712345678', '254712345678'],
    ['254712345678', '254712345678'],
    ['712345678', '254712345678'],
    ['0712 345 678', '254712345678'],
    ['0712-345-678', '254712345678'],
    ['(0712) 345678', '254712345678'],
    ['+254 712 345 678', '254712345678'],
    ['  0712345678  ', '254712345678'],
    ['00254712345678', '254712345678'],
  ] as const;

  it.each(VALID)('normalises %s → %s', (input, expected) => {
    const r = normalisePhone(input);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(expected);
  });

  it('rejects an empty string', () => {
    const r = normalisePhone('');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('empty');
  });

  it('rejects a too-short number', () => {
    const r = normalisePhone('071234');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('wrong_length');
  });

  it('rejects a too-long number', () => {
    const r = normalisePhone('07123456789999');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('wrong_length');
  });

  it('rejects a non-mobile prefix', () => {
    // 020 is a Nairobi landline — it cannot receive an STK push.
    const r = normalisePhone('0201234567');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('invalid_prefix');
  });

  /**
   * ⚠ THE HIGHEST-CONSEQUENCE TEST IN THE SUITE.
   *
   * A foreign number must be rejected AS FOREIGN — not coerced, and not merely
   * rejected by accident via a length check. If a non-Kenyan number were ever
   * mangled into a valid-looking `2547XXXXXXXX`, the site would send an M-PESA
   * STK push to a stranger's handset.
   */
  const FOREIGN = [
    ['+447911123456', 'UK'],
    ['+12125551234', 'USA'],
    ['+919876543210', 'India'],
    ['+27821234567', 'South Africa'],
    ['+255712345678', 'Tanzania'], // ⚠ neighbouring, and starts with 255 — close to 254
    ['+256712345678', 'Uganda'], // ⚠ neighbouring, 256
    ['00447911123456', 'UK via 00 prefix'],
  ] as const;

  it.each(FOREIGN)('rejects %s (%s) as NOT KENYAN', (input) => {
    const r = normalisePhone(input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('not_kenyan');
  });

  it('⚠ never coerces a foreign number into a valid Kenyan MSISDN', () => {
    // The failure mode this guards against: a foreign number silently becoming
    // a well-formed 2547XXXXXXXX and receiving a real payment prompt.
    for (const [input] of FOREIGN) {
      const r = normalisePhone(input);
      if (r.ok) {
        throw new Error(`${input} was coerced to ${r.value} — this would STK-push a stranger.`);
      }
    }
  });

  it('is idempotent', () => {
    const once = normalisePhone('0712345678');
    expect(once.ok).toBe(true);
    if (once.ok) {
      const twice = normalisePhone(once.value);
      expect(twice.ok).toBe(true);
      if (twice.ok) expect(twice.value).toBe(once.value);
    }
  });

  it('formats for display in local and international form', () => {
    const r = normalisePhone('0712345678');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(formatPhoneLocal(r.value)).toBe('0712 345 678');
      expect(formatPhoneInternational(r.value)).toBe('+254 712 345 678');
    }
  });

  it('isValidPhone agrees with normalisePhone', () => {
    expect(isValidPhone('0712345678')).toBe(true);
    expect(isValidPhone('nonsense')).toBe(false);
  });
});

/* ================================================================== *
 * PRICING
 * ================================================================== */

const LINE = (qty: number, priceMajor: number): CartLine => ({
  variantId: variantId('var_test'),
  quantity: qty,
  unitPrice: fromMajor(priceMajor),
  bundleId: null,
});

describe('calculateTotals', () => {
  it('sums line totals into a subtotal', () => {
    const t = calculateTotals({
      lines: [LINE(2, 550), LINE(1, 650)],
      discount: null,
      deliveryQuote: null,
      freeDeliveryThreshold: null,
    });
    expect(t.subtotal.amount).toBe(175000); // 2*550 + 650 = 1750.00
  });

  it('⛔ NEVER calculates tax — D-16 is unresolved', () => {
    const t = calculateTotals({
      lines: [LINE(1, 550)],
      discount: null,
      deliveryQuote: null,
      freeDeliveryThreshold: null,
    });
    // ⚠ Tax is Unavailable, NOT zero(). Rendering "VAT: KES 0.00" would be an
    //   invented claim about the trading entity's VAT registration.
    expect(isUnavailable(t.tax)).toBe(true);
    expect(t.tax.blockedBy).toBe('D-16');
  });

  it('⛔ marks delivery AND total unavailable until a zone is chosen', () => {
    const t = calculateTotals({
      lines: [LINE(1, 550)],
      discount: null,
      deliveryQuote: null, // no zone yet
      freeDeliveryThreshold: null,
    });
    expect(isUnavailable(t.delivery)).toBe(true);
    // ⚠ We do NOT show a total that excludes an unknown delivery fee.
    //   A number that will change is worse than an honest absence. [P-03]
    expect(isUnavailable(t.total)).toBe(true);
  });

  it('produces a real total once a zone is chosen', () => {
    const t = calculateTotals({
      lines: [LINE(2, 550)],
      discount: null,
      deliveryQuote: { fee: fromMajor(200), leadTime: 'Same day' },
      freeDeliveryThreshold: null,
    });
    expect(isUnavailable(t.total)).toBe(false);
    if (!isUnavailable(t.total)) expect(t.total.amount).toBe(130000); // 1100 + 200
  });

  it('applies a percent discount to the subtotal only, never to delivery', () => {
    const discount: Discount = {
      code: 'TEST10',
      type: 'percent',
      value: 10,
      expiresAt: null,
      minimumSpend: null,
      stackable: false,
    };
    const t = calculateTotals({
      lines: [LINE(2, 550)], // 1100.00
      discount,
      deliveryQuote: { fee: fromMajor(200), leadTime: 'Same day' },
      freeDeliveryThreshold: null,
    });
    expect(t.discount.amount).toBe(11000); // 10% of 1100 = 110.00
    if (!isUnavailable(t.total)) {
      expect(t.total.amount).toBe(119000); // (1100 - 110) + 200 = 1190.00
    }
  });

  it('never lets a discount exceed the subtotal', () => {
    const discount: Discount = {
      code: 'HUGE',
      type: 'fixed',
      value: 999999,
      expiresAt: null,
      minimumSpend: null,
      stackable: false,
    };
    const t = calculateTotals({
      lines: [LINE(1, 550)],
      discount,
      deliveryQuote: { fee: fromMajor(200), leadTime: 'Same day' },
      freeDeliveryThreshold: null,
    });
    expect(t.discount.amount).toBe(55000); // capped at the subtotal
    if (!isUnavailable(t.total)) {
      expect(t.total.amount).toBe(20000); // 0 + delivery. NEVER negative.
    }
  });

  it('a free_delivery coupon zeroes the fee, not the subtotal', () => {
    const discount: Discount = {
      code: 'FREEDEL',
      type: 'free_delivery',
      value: 0,
      expiresAt: null,
      minimumSpend: null,
      stackable: false,
    };
    const t = calculateTotals({
      lines: [LINE(1, 550)],
      discount,
      deliveryQuote: { fee: fromMajor(200), leadTime: 'Same day' },
      freeDeliveryThreshold: null,
    });
    expect(t.discount.amount).toBe(0);
    if (!isUnavailable(t.delivery)) expect(t.delivery.amount).toBe(0);
    if (!isUnavailable(t.total)) expect(t.total.amount).toBe(55000);
  });

  it('waives delivery at a free-delivery threshold', () => {
    const t = calculateTotals({
      lines: [LINE(4, 550)], // 2200.00
      discount: null,
      deliveryQuote: { fee: fromMajor(200), leadTime: 'Same day' },
      freeDeliveryThreshold: fromMajor(2000),
    });
    if (!isUnavailable(t.delivery)) expect(t.delivery.amount).toBe(0);
  });

  it('measures the threshold against the DISCOUNTED subtotal', () => {
    // 2200 gross, 20% off = 1760 net, which is BELOW the 2000 threshold.
    // The fee must therefore still apply.
    const discount: Discount = {
      code: 'TWENTY',
      type: 'percent',
      value: 20,
      expiresAt: null,
      minimumSpend: null,
      stackable: false,
    };
    const t = calculateTotals({
      lines: [LINE(4, 550)],
      discount,
      deliveryQuote: { fee: fromMajor(200), leadTime: 'Same day' },
      freeDeliveryThreshold: fromMajor(2000),
    });
    if (!isUnavailable(t.delivery)) expect(t.delivery.amount).toBe(20000);
  });

  it('an empty cart totals zero without throwing', () => {
    const t = calculateTotals({
      lines: [],
      discount: null,
      deliveryQuote: null,
      freeDeliveryThreshold: null,
    });
    expect(t.subtotal.amount).toBe(0);
  });
});

describe('validateDiscount', () => {
  const base: Discount = {
    code: 'X',
    type: 'percent',
    value: 10,
    expiresAt: null,
    minimumSpend: null,
    stackable: false,
  };

  it('rejects an unknown code', () => {
    const r = validateDiscount(undefined, [LINE(1, 550)]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('not_found');
  });

  it('rejects an expired code', () => {
    const r = validateDiscount({ ...base, expiresAt: '2020-01-01T00:00:00Z' }, [LINE(1, 550)]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('expired');
  });

  it('rejects a code on an empty cart', () => {
    const r = validateDiscount(base, []);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('empty_cart');
  });

  it('rejects below the minimum spend', () => {
    const r = validateDiscount({ ...base, minimumSpend: fromMajor(2000) }, [LINE(1, 550)]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('below_minimum');
  });

  it('accepts a valid code', () => {
    expect(validateDiscount(base, [LINE(1, 550)]).ok).toBe(true);
  });
});

describe('cart line mutation', () => {
  it('merges a duplicate variant rather than adding a second line', () => {
    const lines = addLine([LINE(1, 550)], LINE(2, 550));
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(3);
  });

  it('clamps a merged quantity to the maximum', () => {
    const lines = addLine([LINE(98, 550)], LINE(5, 550));
    expect(lines[0].quantity).toBe(MAX_LINE_QUANTITY);
  });

  it('removes a line when its quantity drops to zero', () => {
    const lines = updateLineQuantity([LINE(2, 550)], variantId('var_test'), 0);
    expect(lines).toHaveLength(0);
  });

  it('is immutable — the original array is never mutated', () => {
    const original = [LINE(1, 550)];
    const next = addLine(original, LINE(1, 550));
    expect(original[0].quantity).toBe(1);
    expect(next[0].quantity).toBe(2);
    expect(next).not.toBe(original);
  });

  it('counts items across lines', () => {
    expect(totalItemCount([LINE(2, 550), LINE(3, 650)])).toBe(5);
  });

  it('computes a line total', () => {
    expect(lineTotal(LINE(3, 550)).amount).toBe(165000);
  });

  it('removes the right line', () => {
    expect(removeLine([LINE(1, 550)], variantId('var_test'))).toHaveLength(0);
  });
});

/* ================================================================== *
 * PAYMENT — THE THREE-STATE MODEL.
 *
 * ⚠ These are the most important tests in the suite. `unknown` must NEVER
 *   be collapsed into `failed`. Guessing about whether a customer's money
 *   left their account is how you destroy trust in this market.
 * ================================================================== */

const payment = (over: Partial<Payment> = {}): Payment => ({
  id: 'pay_1' as Payment['id'],
  orderId: 'ord_1' as Payment['orderId'],
  provider: 'mpesa',
  amount: fromMajor(550),
  status: 'pending',
  providerRef: 'ws_CO_123',
  transactionRef: null,
  failureReason: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...over,
});

describe('payment outcome', () => {
  it('reports a success with its M-PESA receipt', () => {
    const o = resolveOutcome(payment({ status: 'succeeded', transactionRef: 'SGH4KL9M2X' }));
    expect(o.kind).toBe('succeeded');
    if (o.kind === 'succeeded') expect(o.transactionRef).toBe('SGH4KL9M2X');
  });

  it('reports a genuine failure', () => {
    const o = resolveOutcome(payment({ status: 'failed', failureReason: 'Cancelled' }));
    expect(o.kind).toBe('failed');
  });

  it('stays PENDING inside the window', () => {
    const o = resolveOutcome(payment({ createdAt: new Date().toISOString() }));
    expect(o.kind).toBe('pending');
  });

  it('⚠ becomes UNKNOWN — never FAILED — when the callback never arrives', () => {
    // THE CENTRAL TEST OF THIS FILE.
    const stale = new Date(Date.now() - PENDING_WINDOW_MS - 1000).toISOString();
    const o = resolveOutcome(payment({ status: 'pending', createdAt: stale }));

    expect(o.kind).toBe('unknown');
    expect(o.kind).not.toBe('failed'); // ⚠ NEVER.
  });

  it('⚠ isFailure() is FALSE for an unknown payment', () => {
    // If this ever returns true, a customer whose money DID leave their account
    // will be told the payment failed, and may pay twice.
    expect(isFailure('unknown')).toBe(false);
    expect(isIndeterminate('unknown')).toBe(true);
    expect(isFailure('failed')).toBe(true);
  });

  it('detects the window boundary', () => {
    const old = new Date(Date.now() - PENDING_WINDOW_MS - 1).toISOString();
    const fresh = new Date().toISOString();
    expect(hasExceededWindow(payment({ createdAt: old }))).toBe(true);
    expect(hasExceededWindow(payment({ createdAt: fresh }))).toBe(false);
  });

  it('the unknown-state copy tells the customer NOT to pay again', () => {
    const copy = outcomeCopy({ kind: 'unknown' });
    expect(copy.body.toLowerCase()).toContain('do not pay again');
    // It must NOT offer a retry button — that is how you get a double charge.
    expect(copy.retry).toBe(false);
  });

  it('failure copy is non-judgemental and confirms nothing was charged', () => {
    const copy = outcomeCopy({ kind: 'failed', reason: null });
    expect(copy.body.toLowerCase()).toContain('nothing has been charged');
    expect(copy.retry).toBe(true);
    // Brand voice §07: no exclamation marks anywhere.
    expect(copy.heading).not.toContain('!');
    expect(copy.body).not.toContain('!');
  });
});

/* ================================================================== *
 * CATALOGUE
 * ================================================================== */

describe('stock', () => {
  const inv = (onHand: number, reserved = 0) => ({
    variantId: variantId('v'),
    onHand,
    reserved,
    available: onHand - reserved,
    lowStockThreshold: unavailable('D-27', 'not supplied'),
    policy: 'deny' as const,
    nextBatch: null,
  });

  it('computes available as onHand minus reserved', () => {
    expect(availableStock({ onHand: 10, reserved: 3 })).toBe(7);
  });

  it('never reports negative availability', () => {
    expect(availableStock({ onHand: 2, reserved: 5 })).toBe(0);
  });

  it('reports out_of_stock at zero', () => {
    expect(stockStatus(inv(0)).kind).toBe('out_of_stock');
  });

  it('⛔ cannot claim "low stock" without a client-supplied threshold (D-27)', () => {
    // We will not invent "Only 2 left" — that is urgency architecture built on
    // a number nobody approved. [P-07, D-27]
    expect(stockStatus(inv(1)).kind).toBe('in_stock');
  });

  it('prefers a next-batch date over a dead-end out-of-stock', () => {
    const s = stockStatus({
      ...inv(0),
      nextBatch: {
        id: 'b1',
        variantId: variantId('v'),
        bottlingDate: '2026-08-02',
        quantity: 40,
        batchNumber: 'B-0472',
      },
    });
    expect(s.kind).toBe('next_batch');
  });
});

describe('Unavailable', () => {
  it('carries the blocking decision so a gap is always traceable', () => {
    const u = unavailable('D-14', 'No approved price.');
    expect(isUnavailable(u)).toBe(true);
    expect(u.blockedBy).toBe('D-14');
  });

  it('does not treat a real value as unavailable', () => {
    expect(isUnavailable('a real string')).toBe(false);
    expect(isUnavailable(fromMajor(550))).toBe(false);
  });
});
