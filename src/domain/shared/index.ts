/**
 * DOMAIN — SHARED PRIMITIVES
 *
 * ZERO React. ZERO HTTP. ZERO framework imports. Pure TypeScript.
 * Enforced by the `boundaries` ESLint rule — a violation fails the build. [NN-06, R-13]
 */

/* ---------------- branded ids ---------------- */

declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };

export type ProductId = Brand<string, 'ProductId'>;
export type VariantId = Brand<string, 'VariantId'>;
export type CartId = Brand<string, 'CartId'>;
export type OrderId = Brand<string, 'OrderId'>;
export type CustomerId = Brand<string, 'CustomerId'>;
export type AddressId = Brand<string, 'AddressId'>;
export type ZoneId = Brand<string, 'ZoneId'>;
export type PaymentId = Brand<string, 'PaymentId'>;
export type BatchId = Brand<string, 'BatchId'>;
export type BundleId = Brand<string, 'BundleId'>;
export type EventId = Brand<string, 'EventId'>;
export type SubscriptionId = Brand<string, 'SubscriptionId'>;
export type ReservationId = Brand<string, 'ReservationId'>;

export const productId = (s: string) => s as ProductId;
export const variantId = (s: string) => s as VariantId;
export const cartId = (s: string) => s as CartId;
export const orderId = (s: string) => s as OrderId;
export const customerId = (s: string) => s as CustomerId;
export const addressId = (s: string) => s as AddressId;
export const subscriptionId = (s: string) => s as SubscriptionId;
export const zoneId = (s: string) => s as ZoneId;
export const paymentId = (s: string) => s as PaymentId;

export type ISODate = string; // YYYY-MM-DD
export type ISODateTime = string; // RFC3339

/* ---------------- Result ---------------- */

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const Ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const Err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export const isOk = <T, E>(r: Result<T, E>): r is { ok: true; value: T } => r.ok;
export const isErr = <T, E>(r: Result<T, E>): r is { ok: false; error: E } => !r.ok;

export const unwrapOr = <T, E>(r: Result<T, E>, fallback: T): T => (r.ok ? r.value : fallback);

/* ---------------- Money ---------------- */

export type Currency = 'KES';

/**
 * Money is stored in MINOR UNITS as an INTEGER (KES cents).
 *
 * Never a float. `0.1 + 0.2 !== 0.3`, and a rounding drift in a cart total
 * is a defect that surfaces as a customer dispute. All arithmetic is integer
 * arithmetic; rounding happens once, explicitly, at the point of division.
 */
export interface Money {
  readonly amount: number; // integer, minor units
  readonly currency: Currency;
  /** ⛔ D-16 — VAT status unknown. No tax logic is written until confirmed. */
  readonly taxIncluded: boolean | null;
}

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoneyError';
  }
}

export const money = (
  minorUnits: number,
  currency: Currency = 'KES',
  taxIncluded: boolean | null = null
): Money => {
  if (!Number.isInteger(minorUnits)) {
    throw new MoneyError(`Money must be an integer in minor units, received ${minorUnits}`);
  }
  return { amount: minorUnits, currency, taxIncluded };
};

/** Convenience for fixtures: KES 450.00 → fromMajor(450) */
export const fromMajor = (major: number, currency: Currency = 'KES'): Money =>
  money(Math.round(major * 100), currency);

export const zero = (currency: Currency = 'KES'): Money => money(0, currency);

const assertSame = (a: Money, b: Money): void => {
  if (a.currency !== b.currency) {
    throw new MoneyError(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
};

export const add = (a: Money, b: Money): Money => {
  assertSame(a, b);
  return money(a.amount + b.amount, a.currency, a.taxIncluded);
};

export const subtract = (a: Money, b: Money): Money => {
  assertSame(a, b);
  return money(a.amount - b.amount, a.currency, a.taxIncluded);
};

export const multiply = (m: Money, factor: number): Money =>
  money(Math.round(m.amount * factor), m.currency, m.taxIncluded);

/** Percentage OFF. `percentOf(m, 10)` = the 10% discount amount, rounded half-up. */
export const percentOf = (m: Money, percent: number): Money =>
  money(Math.round((m.amount * percent) / 100), m.currency, m.taxIncluded);

export const sum = (items: readonly Money[], currency: Currency = 'KES'): Money =>
  items.reduce((acc, m) => add(acc, m), zero(currency));

export const isZero = (m: Money): boolean => m.amount === 0;
export const isNegative = (m: Money): boolean => m.amount < 0;
export const gte = (a: Money, b: Money): boolean => (assertSame(a, b), a.amount >= b.amount);
export const gt = (a: Money, b: Money): boolean => (assertSame(a, b), a.amount > b.amount);

/** Never let a total go negative — clamp at zero. */
export const clampZero = (m: Money): Money =>
  m.amount < 0 ? money(0, m.currency, m.taxIncluded) : m;

/**
 * Display formatting.
 * ⛔ D-15 — the client has not chosen between `KES 500` / `Ksh 500` / `KSh 500.00`.
 * `KES 500` is used as a PLACEHOLDER and is centralised here precisely so
 * that the decision is a one-line change, not a find-and-replace.
 */
export const formatMoney = (m: Money): string => {
  const major = m.amount / 100;
  const hasCents = m.amount % 100 !== 0;
  const formatted = major.toLocaleString('en-KE', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${m.currency} ${formatted}`;
};
