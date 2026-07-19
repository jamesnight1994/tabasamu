/**
 * DOMAIN — CART PERSISTENCE
 *
 * ⚠ The SERIALISATION FORMAT is a domain concern; the STORAGE MECHANISM is not.
 *
 *   This file knows how to turn a cart into a string and back, and how to decide
 *   whether a stored cart is still trustworthy. It does NOT know what
 *   `localStorage` is — `window` is banned in this layer by lint, deliberately.
 *   The adapter supplies the storage; the domain supplies the rules. [NN-06]
 *
 * ⚠ WHY A CART IS PERSISTED AT ALL, IN THIS MARKET.
 *
 *   A Nairobi customer on a slow connection will lose the tab. The app will be
 *   backgrounded and killed by Android to reclaim memory. The connection will
 *   drop mid-browse. If the cart dies with the tab, the sale dies with it.
 *
 * ⚠ AND WHY IT STILL CANNOT BE TRUSTED.
 *
 *   A persisted cart carries SNAPSHOTTED prices. Those prices may be days old.
 *   So a restored cart is a DRAFT of an intention, never a binding quote — it is
 *   revalidated against the server before payment, every time, without exception.
 *   See `domain/checkout` → `RevalidationResult`.
 */

import type { CartId, VariantId, BundleId, Money, ISODateTime } from '../shared';
import type { CartLine } from '../pricing';

/* ================================================================== *
 * The stored shape
 * ================================================================== */

/**
 * ⚠ VERSIONED FROM DAY ONE.
 *
 *   The shape of `CartLine` WILL change — a subscription field lands the moment
 *   D-09 is answered. When it does, every returning customer has a stale blob in
 *   their browser. Without a version tag, that blob deserialises into a
 *   half-populated object and the cart silently misbehaves in ways that are
 *   almost impossible to reproduce.
 *
 *   With a version tag, an unknown version is simply DISCARDED. Losing a cart is
 *   a minor annoyance. A corrupt cart that produces a wrong total is a dispute.
 */
export const CART_SCHEMA_VERSION = 1;

export interface StoredCartLine {
  readonly variantId: string;
  readonly quantity: number;
  readonly unitPriceMinor: number;
  readonly currency: string;
  readonly bundleId: string | null;
}

export interface StoredCart {
  readonly version: number;
  readonly cartId: string;
  readonly lines: readonly StoredCartLine[];
  readonly discountCode: string | null;
  readonly zoneId: string | null;
  readonly savedAt: ISODateTime;
}

/**
 * ⚠ A cart older than this is DISCARDED on load, not restored.
 *
 *   Fourteen days is chosen because a kombucha cart is not a wishlist. A
 *   fortnight-old cart of a small-batch perishable product almost certainly
 *   contains prices that have moved and stock that is long gone. Restoring it
 *   creates a confusing wall of "this changed / that sold out" errors, which is
 *   a worse first impression than an empty cart.
 */
export const CART_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

/* ================================================================== *
 * Serialise
 * ================================================================== */

export const serialiseCart = (
  cartId: CartId,
  lines: readonly CartLine[],
  discountCode: string | null,
  zoneId: string | null,
  now: Date = new Date()
): StoredCart => ({
  version: CART_SCHEMA_VERSION,
  cartId,
  lines: lines.map((l) => ({
    variantId: l.variantId,
    quantity: l.quantity,
    unitPriceMinor: l.unitPrice.amount,
    currency: l.unitPrice.currency,
    bundleId: l.bundleId,
  })),
  discountCode,
  zoneId,
  savedAt: now.toISOString(),
});

/* ================================================================== *
 * Deserialise — hostile input
 * ================================================================== */

/**
 * ⚠ THE STORED BLOB IS UNTRUSTED INPUT.
 *
 *   It has been sitting in a browser the user controls. It may have been edited
 *   by hand. It may be from a previous version of the app. It may be truncated
 *   by a storage quota error mid-write.
 *
 *   A negative quantity, a non-integer price, or a NaN would all sail straight
 *   into `calculateTotals` and produce a corrupt — possibly NEGATIVE — order
 *   total. So every field is checked, and a single bad line discards the WHOLE
 *   cart rather than silently dropping one item the customer thought they had.
 */
export type CartRestoreFailure =
  | { kind: 'absent' }
  | { kind: 'malformed'; detail: string }
  | { kind: 'version_mismatch'; found: number; expected: number }
  | { kind: 'expired'; savedAt: ISODateTime };

export type CartRestoreResult =
  | { kind: 'restored'; cart: StoredCart }
  | { kind: 'discarded'; reason: CartRestoreFailure };

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isValidLine = (v: unknown): v is StoredCartLine => {
  if (!isPlainObject(v)) return false;
  if (typeof v.variantId !== 'string' || v.variantId.length === 0) return false;

  // ⚠ Integer, positive, and bounded. `Number.isInteger` rejects NaN and Infinity.
  if (!Number.isInteger(v.quantity) || (v.quantity as number) <= 0 || (v.quantity as number) > 99) {
    return false;
  }
  // ⚠ Money is INTEGER MINOR UNITS. A float here is a corrupt cart, not a rounding issue.
  if (!Number.isInteger(v.unitPriceMinor) || (v.unitPriceMinor as number) < 0) return false;
  if (typeof v.currency !== 'string') return false;
  if (v.bundleId !== null && typeof v.bundleId !== 'string') return false;

  return true;
};

export const deserialiseCart = (
  raw: string | null | undefined,
  now: Date = new Date()
): CartRestoreResult => {
  if (raw === null || raw === undefined || raw.trim() === '') {
    return { kind: 'discarded', reason: { kind: 'absent' } };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { kind: 'discarded', reason: { kind: 'malformed', detail: 'not valid JSON' } };
  }

  if (!isPlainObject(parsed)) {
    return { kind: 'discarded', reason: { kind: 'malformed', detail: 'not an object' } };
  }

  // ⚠ Version check BEFORE field access. An old blob may not even have these fields.
  if (parsed.version !== CART_SCHEMA_VERSION) {
    return {
      kind: 'discarded',
      reason: {
        kind: 'version_mismatch',
        found: typeof parsed.version === 'number' ? parsed.version : -1,
        expected: CART_SCHEMA_VERSION,
      },
    };
  }

  if (typeof parsed.cartId !== 'string' || !Array.isArray(parsed.lines)) {
    return { kind: 'discarded', reason: { kind: 'malformed', detail: 'missing cartId or lines' } };
  }

  if (typeof parsed.savedAt !== 'string') {
    return { kind: 'discarded', reason: { kind: 'malformed', detail: 'missing savedAt' } };
  }

  const savedAt = new Date(parsed.savedAt);
  if (Number.isNaN(savedAt.getTime())) {
    return { kind: 'discarded', reason: { kind: 'malformed', detail: 'invalid savedAt' } };
  }

  if (now.getTime() - savedAt.getTime() > CART_MAX_AGE_MS) {
    return { kind: 'discarded', reason: { kind: 'expired', savedAt: parsed.savedAt } };
  }

  // ⚠ ONE bad line discards the WHOLE cart. See the note above — a silently
  //   shortened cart is worse than an empty one, because the customer will not
  //   notice until the box arrives.
  if (!parsed.lines.every(isValidLine)) {
    return { kind: 'discarded', reason: { kind: 'malformed', detail: 'a line failed validation' } };
  }

  const discountCode =
    typeof parsed.discountCode === 'string' ? parsed.discountCode : null;
  const zoneId = typeof parsed.zoneId === 'string' ? parsed.zoneId : null;

  return {
    kind: 'restored',
    cart: {
      version: CART_SCHEMA_VERSION,
      cartId: parsed.cartId,
      lines: parsed.lines as readonly StoredCartLine[],
      discountCode,
      zoneId,
      savedAt: parsed.savedAt,
    },
  };
};

/* ================================================================== *
 * Rehydrate to domain types
 * ================================================================== */

/**
 * ⚠ The restored prices are SNAPSHOTS and may be stale. This function returns
 *   `CartLine[]` for DISPLAY only. It is never a quote. Revalidation against the
 *   server happens before payment, every time. [F-53]
 */
export const toCartLines = (stored: StoredCart): readonly CartLine[] =>
  stored.lines.map((l) => ({
    variantId: l.variantId as VariantId,
    quantity: l.quantity,
    unitPrice: {
      amount: l.unitPriceMinor,
      currency: l.currency as Money['currency'],
      // ⛔ D-16 — VAT status still unknown. Never asserted from a stored blob.
      taxIncluded: null,
    },
    bundleId: (l.bundleId as BundleId | null) ?? null,
  }));

/** The storage key. Namespaced and versioned so a schema bump cannot collide. */
export const CART_STORAGE_KEY = `tabasamu:cart:v${CART_SCHEMA_VERSION}`;

/* ================================================================== *
 * Save for later
 * ================================================================== */

/**
 * ⚠ SCOPE NOTE — "Save for later" was listed in the Phase 5 brief as
 *   "if included in requirements". It is NOT in the Phase 1 feature inventory,
 *   and no client decision authorises it.
 *
 *   The TYPE is defined here so the shape is agreed. NO UI IS BUILT, and nothing
 *   writes to this list. Building an unrequested feature is how scope and
 *   maintenance burden arrive uninvited.
 */
export interface SavedForLater {
  readonly variantId: VariantId;
  readonly savedAt: ISODateTime;
}
