/**
 * DOMAIN — DELIVERY
 *
 * ⛔ D-21 (zones), D-22 (fees), D-23 (lead times), D-24 (outside Nairobi),
 *    D-25 (free-delivery threshold), D-26 (pickup) ARE ALL UNANSWERED.
 *
 * ⚠ THEREFORE: this file contains the RULE ENGINE, and ZERO Nairobi zone data.
 *
 *   This is the distinction that matters. It is trivial — and wrong — to type
 *   out "Westlands, KES 200, same-day" and ship a site that quotes a fee the
 *   business never agreed to. A customer who is charged a fee we invented is a
 *   customer we have lied to, and an ops team that must honour a lead time they
 *   never set is an ops team we have sabotaged. [NN-05]
 *
 *   So the engine is complete and fully tested against FIXTURE zones, and the
 *   real zones arrive as CONFIGURATION — a single object the client fills in.
 *   The day D-21/22/23 are answered, this is a data entry task, not a code change.
 *
 * ⚠ P-03 — THE FEE MUST BE KNOWABLE BEFORE THE CART.
 *   Hiding delivery cost until checkout is the single biggest first-time-buyer
 *   frustration in this market (R-08). The quote function is therefore callable
 *   from the PDP, not just the cart.
 */

import {
  type Money,
  type ZoneId,
  type Result,
  Ok,
  Err,
  gte,
  zero,
  sum,
} from '../shared';
import { type Pending, type Unavailable, isUnavailable, unavailable } from '../catalogue';
import { type CartLine, lineTotal } from '../pricing';

/* ================================================================== *
 * Fulfilment method
 * ================================================================== */

/** ⛔ D-26 — pickup is NOT confirmed as offered. The type exists; the flag gates it. */
export type FulfilmentMethod = 'delivery' | 'pickup';

/* ================================================================== *
 * Zones
 * ================================================================== */

/**
 * A zone whose commercial terms may still be blocked.
 *
 * ⚠ `fee` and `leadTime` are `Pending<T>`, NOT `Money` and NOT `string`.
 *   A zone can exist and be selectable while its FEE is still unknown — and the
 *   UI will then show "awaiting confirmation" rather than "KES 0". Rendering a
 *   zero fee for an unknown fee is an invented commercial claim.
 */
export interface DeliveryZone {
  readonly id: ZoneId;
  readonly name: string;
  /** e.g. 'Westlands, Parklands, Highridge' — helps the customer self-select. */
  readonly areas: readonly string[];
  /** ⛔ D-22 */
  readonly fee: Pending<Money>;
  /** ⛔ D-23 — e.g. 'Same day if ordered before 11:00'. NEVER invented. */
  readonly leadTime: Pending<string>;
  /** ⛔ D-21 — minimum order for this zone, if any. */
  readonly minimumOrder: Pending<Money> | null;
  readonly active: boolean;
}

/**
 * The delivery windows offered for a zone.
 * ⛔ D-23 — no windows have been supplied. An empty array means
 *    "no scheduled windows offered", NOT "any time".
 */
export interface DeliveryWindow {
  readonly id: string;
  readonly label: string; // 'Morning', '09:00–12:00'
  readonly zoneIds: readonly ZoneId[];
}

/**
 * ⛔ D-26 — the pickup location has NOT been supplied. `null` means pickup is
 *    NOT offered, which is the correct default until the client says otherwise.
 */
export interface PickupLocation {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly hours: string;
}

/* ================================================================== *
 * The configuration object — THIS is what the client fills in
 * ================================================================== */

/**
 * ⚠ THE HANDOVER SEAM FOR DELIVERY.
 *
 *   Everything the business gets to decide about delivery lives in this ONE
 *   object. No zone name, no fee and no lead time is hard-coded anywhere else
 *   in the codebase. When D-21/22/23/25/26 are answered, the answer is typed
 *   in here — and nothing else changes.
 */
export interface DeliveryConfig {
  readonly zones: readonly DeliveryZone[];
  readonly windows: readonly DeliveryWindow[];
  /** ⛔ D-26 — `null` = pickup not offered. */
  readonly pickup: PickupLocation | null;
  /** ⛔ D-25 — `null` = NO free-delivery rule exists. Not "threshold of zero". */
  readonly freeDeliveryThreshold: Money | null;
  /** ⛔ D-24 — do we deliver outside Nairobi at all? */
  readonly deliversOutsideNairobi: boolean;
  /** ⛔ D-23 — is scheduled delivery approved? */
  readonly scheduledDeliveryEnabled: boolean;
}

/**
 * ⛔ THE EMPTY CONFIG. This is what ships today.
 *
 *   Zero zones. Not one invented. The storefront's delivery selector therefore
 *   renders an honest "delivery areas are being confirmed" state rather than a
 *   fabricated dropdown of Nairobi suburbs with made-up prices.
 *
 *   This will look like an omission in a demo. It is not. It is the difference
 *   between a site that is unfinished and a site that is WRONG.
 */
export const EMPTY_DELIVERY_CONFIG: DeliveryConfig = {
  zones: [],
  windows: [],
  pickup: null, // ⛔ D-26
  freeDeliveryThreshold: null, // ⛔ D-25
  deliversOutsideNairobi: false, // ⛔ D-24
  scheduledDeliveryEnabled: false, // ⛔ D-23
};

/* ================================================================== *
 * Quoting
 * ================================================================== */

export interface DeliveryQuote {
  readonly zoneId: ZoneId;
  readonly zoneName: string;
  readonly fee: Money;
  readonly leadTime: string;
  /** True when the fee was waived by the free-delivery threshold. */
  readonly waived: boolean;
}

export type DeliveryError =
  /** The customer picked an area we do not serve. Must be a KIND state, not an error page. */
  | { kind: 'zone_not_served'; zoneId: ZoneId }
  | { kind: 'zone_inactive'; zoneName: string }
  /** ⛔ The zone exists but the client has not given us its fee. */
  | { kind: 'fee_unavailable'; zoneName: string; blockedBy: string }
  | { kind: 'below_minimum'; zoneName: string; minimum: Money }
  | { kind: 'empty_cart' };

export const deliveryErrorMessage = (e: DeliveryError): string => {
  switch (e.kind) {
    case 'zone_not_served':
      return 'We do not deliver to that area yet.';
    case 'zone_inactive':
      return `We have paused deliveries to ${e.zoneName}.`;
    case 'fee_unavailable':
      /** ⚠ Honest. We do not quote a number we do not have. */
      return 'The delivery fee for that area is still being confirmed.';
    case 'below_minimum':
      return `Orders to ${e.zoneName} start at a higher amount.`;
    case 'empty_cart':
      return 'Add something to your box first.';
  }
};

/**
 * THE quote function. Pure. Called from the PDP AND the cart. [P-03]
 *
 * Order of operations:
 *   1. zone must exist and be active
 *   2. zone fee must actually be KNOWN (⛔ else fee_unavailable — never zero)
 *   3. zone minimum must be met
 *   4. free-delivery threshold waives the fee, measured against the
 *      DISCOUNTED subtotal passed in by the caller
 */
export const quoteDelivery = (
  config: DeliveryConfig,
  zoneId: ZoneId,
  lines: readonly CartLine[],
  /** The subtotal AFTER discount. The caller owns discount maths. */
  discountedSubtotal: Money
): Result<DeliveryQuote, DeliveryError> => {
  if (lines.length === 0) return Err({ kind: 'empty_cart' });

  const zone = config.zones.find((z) => z.id === zoneId);
  if (!zone) return Err({ kind: 'zone_not_served', zoneId });
  if (!zone.active) return Err({ kind: 'zone_inactive', zoneName: zone.name });

  // ⛔ 2. The fee is not known. We do NOT default to zero.
  if (isUnavailable(zone.fee)) {
    return Err({
      kind: 'fee_unavailable',
      zoneName: zone.name,
      blockedBy: zone.fee.blockedBy,
    });
  }

  // 3. Zone minimum.
  if (zone.minimumOrder && !isUnavailable(zone.minimumOrder)) {
    if (!gte(discountedSubtotal, zone.minimumOrder)) {
      return Err({
        kind: 'below_minimum',
        zoneName: zone.name,
        minimum: zone.minimumOrder,
      });
    }
  }

  // 4. Free-delivery threshold. `null` means the RULE DOES NOT EXIST (D-25).
  const waived =
    config.freeDeliveryThreshold !== null &&
    gte(discountedSubtotal, config.freeDeliveryThreshold);

  const leadTime = isUnavailable(zone.leadTime)
    ? 'Lead time is being confirmed'
    : zone.leadTime;

  return Ok({
    zoneId: zone.id,
    zoneName: zone.name,
    fee: waived ? zero() : zone.fee,
    leadTime,
    waived,
  });
};

/**
 * How much more must the customer spend to earn free delivery?
 * Returns `null` when NO threshold rule exists (D-25) — which is not the same
 * as "you have already qualified".
 */
export const amountToFreeDelivery = (
  config: DeliveryConfig,
  discountedSubtotal: Money
): Money | null => {
  if (config.freeDeliveryThreshold === null) return null; // ⛔ D-25 — no rule
  if (gte(discountedSubtotal, config.freeDeliveryThreshold)) return null; // already free
  return {
    ...config.freeDeliveryThreshold,
    amount: config.freeDeliveryThreshold.amount - discountedSubtotal.amount,
  };
};

/** Delivery windows offered for a zone. Empty = none offered, NOT "any time". */
export const windowsForZone = (
  config: DeliveryConfig,
  zoneId: ZoneId
): readonly DeliveryWindow[] => {
  if (!config.scheduledDeliveryEnabled) return []; // ⛔ D-23
  return config.windows.filter((w) => w.zoneIds.includes(zoneId));
};

export const isPickupOffered = (config: DeliveryConfig): boolean => config.pickup !== null; // ⛔ D-26

/** Are ANY zones configured at all? Drives the honest empty state. */
export const hasZones = (config: DeliveryConfig): boolean =>
  config.zones.some((z) => z.active);

/** ⛔ The blocked-state explainer shown when no zones exist. */
export const ZONES_BLOCKED: Unavailable = unavailable(
  'D-21/D-22/D-23',
  'Nairobi delivery zones, fees and lead times have not been supplied by the client. No zone, fee or lead time is invented.'
);

/** Cart-line subtotal helper, re-exported so callers need not reach into pricing. */
export const linesSubtotal = (lines: readonly CartLine[]): Money =>
  sum(lines.map(lineTotal));
