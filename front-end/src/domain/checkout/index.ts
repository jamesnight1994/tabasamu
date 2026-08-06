/**
 * DOMAIN — CHECKOUT
 *
 * Validation and the checkout lifecycle. Pure. No React, no HTTP.
 *
 * ⚠ THE ADDRESS SHAPE IS NOT WESTERN, AND THAT IS DELIBERATE.
 *
 *   Nairobi addressing is ESTATE / BUILDING / LANDMARK based. There is no
 *   reliable street-number-and-postcode system, and a rider does not navigate by
 *   one. A `line1 / line2 / postcode` form — the default every ecommerce
 *   template ships with — is the WRONG SHAPE for this market. It produces
 *   addresses that are technically valid and practically undeliverable.
 *
 *   The rider will phone the number on the order and ask for the landmark. So
 *   the landmark is a FIRST-CLASS FIELD, and the phone is REQUIRED. [R-21]
 */

import { z } from 'zod';
import { type Money, type Result, type VariantId, Ok, Err } from '../shared';
import { normalisePhone, type E164Phone } from '../identity/phone';
import type { CartLine } from '../pricing';

/* ================================================================== *
 * Phone — the Zod bridge to the domain normaliser
 * ================================================================== */

/**
 * ⚠ The normalisation logic is NOT reimplemented here. Zod DELEGATES to the
 *   single domain function. Two implementations of phone normalisation is one
 *   too many — the second one is where the STK push goes to the wrong handset.
 */
export const phoneSchema = z
  .string()
  .min(1, 'Enter your phone number.')
  .transform((v, ctx) => {
    const r = normalisePhone(v);
    if (!r.ok) {
      ctx.addIssue({
        code: 'custom',
        message:
          r.error.kind === 'not_kenyan'
            ? 'Enter a Kenyan number.'
            : r.error.kind === 'empty'
              ? 'Enter your phone number.'
              : 'That does not look like a Kenyan mobile number.',
      });
      return z.NEVER;
    }
    return r.value;
  });

/* ================================================================== *
 * Contact
 * ================================================================== */

/**
 * ⚠ EMAIL IS OPTIONAL. PHONE IS NOT.
 *
 *   This inverts the Western default, and it is correct for this market. Phone
 *   is the primary human identifier in Kenya — it is the M-PESA account, it is
 *   the support key, it is how the rider finds the customer. Many customers will
 *   not have an email address they check.
 *
 *   ⛔ D-41 — whether we can SEND the SMS confirmation is still unanswered. But
 *      the field that makes it possible is collected regardless.
 */
export const contactSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Enter your name.')
    .max(80, 'That name is too long.'),
  phone: phoneSchema,
  email: z
    .string()
    .trim()
    .email('That email does not look right.')
    .optional()
    .or(z.literal('')),
  /** Guest checkout is the DEFAULT. An account is an option, never a gate. [F-49] */
  createAccount: z.boolean().default(false),
});

export type ContactInput = z.input<typeof contactSchema>;
export type Contact = z.output<typeof contactSchema>;

/* ================================================================== *
 * Address — the Nairobi shape
 * ================================================================== */

export const addressSchema = z.object({
  /** Separate from the buyer's name. A gift goes to someone else. */
  recipientName: z.string().trim().min(2, 'Enter the name of whoever receives the box.'),
  /** ⚠ The rider WILL call this. It may differ from the buyer's number. */
  recipientPhone: phoneSchema,
  zoneId: z.string().min(1, 'Choose your delivery area.'),
  estate: z.string().trim().min(2, 'Enter the estate or area.'),
  building: z.string().trim().min(1, 'Enter the building, house or apartment.'),
  /**
   * ⚠ REQUIRED, not optional. This is what the rider actually navigates by.
   *   Making it optional produces addresses that cannot be delivered to.
   */
  landmark: z.string().trim().min(2, 'Give the rider a landmark to find you by.'),
  instructions: z.string().trim().max(300, 'Please keep this shorter.').optional().or(z.literal('')),
});

export type AddressInput = z.input<typeof addressSchema>;
export type CheckoutAddress = z.output<typeof addressSchema>;

/* ================================================================== *
 * Fulfilment
 * ================================================================== */

/** ⛔ D-26 — pickup is gated by config. The schema permits it; the config decides. */
export const fulfilmentSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('delivery'),
    address: addressSchema,
    /** ⛔ D-23 — only offered when `scheduledDeliveryEnabled`. */
    windowId: z.string().optional(),
  }),
  z.object({
    method: z.literal('pickup'),
    pickupLocationId: z.string().min(1, 'Choose a collection point.'),
  }),
]);

export type Fulfilment = z.output<typeof fulfilmentSchema>;

/* ================================================================== *
 * Payment method
 * ================================================================== */

/**
 * ⚠ `'card'`, NOT `'stripe'`. ⛔ D-35.
 *   The card option is gated behind the `cardPayments` flag, which is FALSE
 *   until we know whether Stripe can settle KES for a Kenyan entity.
 */
export const paymentMethodSchema = z.enum(['mpesa', 'card']);
export type PaymentMethod = z.output<typeof paymentMethodSchema>;

/* ================================================================== *
 * The whole checkout
 * ================================================================== */

export const checkoutSchema = z.object({
  contact: contactSchema,
  fulfilment: fulfilmentSchema,
  paymentMethod: paymentMethodSchema,
  /**
   * ⚠ For M-PESA this may DIFFER from the contact phone. The customer may be
   *   buying on their own account but paying from a different handset — or vice
   *   versa. Forcing them to be the same is a real and common failure.
   */
  mpesaPhone: phoneSchema.optional(),
  orderNotes: z.string().trim().max(500, 'Please keep this shorter.').optional().or(z.literal('')),
  discountCode: z.string().trim().optional().or(z.literal('')),
  /** ⚠ MUST be an explicit, unticked-by-default action. Never pre-ticked. */
  acceptedTerms: z.literal(true, {
    message: 'Please accept the terms before placing your order.',
  }),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type Checkout = z.output<typeof checkoutSchema>;

/** Which phone receives the STK push. Falls back to the contact number. */
export const stkPhoneFor = (c: Checkout): E164Phone => c.mpesaPhone ?? c.contact.phone;

/* ================================================================== *
 * REVALIDATION — the guard against a stale cart
 * ================================================================== */

/**
 * ⚠ THE PROBLEM THIS SOLVES.
 *
 *   A customer adds six bottles, leaves the tab open on a bus for forty minutes,
 *   comes back, and taps Pay. In that window: the price may have changed, the
 *   stock may have gone, the coupon may have expired.
 *
 *   Charging them the old price is a business loss. Charging them the NEW price
 *   without telling them is a betrayal. Silently removing an out-of-stock line
 *   and charging for the rest is worse than both.
 *
 *   So we REVALIDATE before payment, and we SHOW THE CUSTOMER what changed, and
 *   we make them look at it before we take a shilling. [F-53]
 */
export type CartChange =
  | { kind: 'price_increased'; variantId: VariantId; name: string; from: Money; to: Money }
  | { kind: 'price_decreased'; variantId: VariantId; name: string; from: Money; to: Money }
  | { kind: 'stock_reduced'; variantId: VariantId; name: string; requested: number; available: number }
  | { kind: 'out_of_stock'; variantId: VariantId; name: string }
  | { kind: 'unavailable'; variantId: VariantId; name: string }
  | { kind: 'discount_expired'; code: string }
  | { kind: 'discount_invalid'; code: string };

export interface RevalidationResult {
  readonly changes: readonly CartChange[];
  readonly lines: readonly CartLine[];
  /**
   * ⚠ TRUE when the customer MUST look before we proceed. A price DROP does not
   *   block — nobody was ever harmed by paying less than they expected. A price
   *   RISE, a stock loss, or a dead coupon does block.
   */
  readonly requiresAcknowledgement: boolean;
}

export const isBlockingChange = (c: CartChange): boolean =>
  c.kind !== 'price_decreased';

export const cartChangeMessage = (c: CartChange): string => {
  switch (c.kind) {
    case 'price_increased':
      return `The price of ${c.name} has changed.`;
    case 'price_decreased':
      return `${c.name} is now less than it was.`;
    case 'stock_reduced':
      /**
       * ⚠ THE BRAND LINT CAUGHT MY FIRST DRAFT OF THIS LINE, AND IT WAS RIGHT.
       *
       *   I wrote "We only have N left" — which is a SCARCITY CUE. P-07 forbids
       *   urgency framing outright, and it does not carve out an exception for
       *   urgency that happens to be TRUE. "Only N left" is the exact sentence
       *   pattern every countdown-timer storefront uses to pressure a purchase,
       *   and this brand does not do that.
       *
       *   The customer still needs the number — it is their box and the quantity
       *   changed. So the fact is stated plainly, and the pressure is removed.
       */
      return `${c.name} is now ${c.available} in your box. This batch is smaller than the order.`;
    case 'out_of_stock':
      return `${c.name} has sold out. The next batch is on its way.`;
    case 'unavailable':
      return `${c.name} is no longer available.`;
    case 'discount_expired':
      return `The code ${c.code} has expired.`;
    case 'discount_invalid':
      return `The code ${c.code} is no longer valid.`;
  }
};

/** Fold a set of changes into a decision. */
export const summariseRevalidation = (
  changes: readonly CartChange[],
  lines: readonly CartLine[]
): RevalidationResult => ({
  changes,
  lines,
  requiresAcknowledgement: changes.some(isBlockingChange),
});

/* ================================================================== *
 * CHECKOUT SESSION — expiry
 * ================================================================== */

/**
 * ⚠ WHY A CHECKOUT EXPIRES AT ALL.
 *
 *   The moment we reserve stock for a customer, we are withholding it from
 *   everyone else. If a checkout could live forever, a handful of abandoned tabs
 *   would take the entire batch out of circulation.
 *
 *   ⛔ D-38 — the AUTO-CANCEL window for the ORDER has not been supplied, and no
 *      order will be auto-cancelled without it. This constant governs only the
 *      STOCK RESERVATION, which is an operational necessity rather than a
 *      commercial policy.
 */
export const CHECKOUT_TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface CheckoutSession {
  readonly id: string;
  readonly cartId: string;
  readonly expiresAt: string;
  readonly reservationIds: readonly string[];
}

export const isExpired = (s: CheckoutSession, now: Date = new Date()): boolean =>
  new Date(s.expiresAt).getTime() <= now.getTime();

export const msUntilExpiry = (s: CheckoutSession, now: Date = new Date()): number =>
  Math.max(0, new Date(s.expiresAt).getTime() - now.getTime());

/* ================================================================== *
 * SUBMISSION GUARD — the double-click problem
 * ================================================================== */

/**
 * ⚠ Disabling the button in React state is NOT sufficient.
 *
 *   A double-tap on a slow Android handset can fire two submit handlers before
 *   the first re-render lands. The guard must therefore be a REF-like value that
 *   flips SYNCHRONOUSLY, outside the React render cycle — and, independently,
 *   an idempotency key must protect the server. Two layers, because the first
 *   one WILL leak.
 */
export type SubmissionState =
  | { kind: 'idle' }
  | { kind: 'validating' }
  | { kind: 'submitting'; idempotencyKey: string }
  | { kind: 'awaiting_payment'; providerRef: string; paymentId: string }
  | { kind: 'succeeded'; orderId: string }
  | { kind: 'failed'; reason: string; retryable: boolean }
  /** ⚠ NOT a failure. We do not know. */
  | { kind: 'indeterminate'; orderId: string };

export const canSubmit = (s: SubmissionState): boolean =>
  s.kind === 'idle' || (s.kind === 'failed' && s.retryable);

export const isBusy = (s: SubmissionState): boolean =>
  s.kind === 'validating' || s.kind === 'submitting' || s.kind === 'awaiting_payment';

/* ================================================================== *
 * Validation entry point
 * ================================================================== */

export type CheckoutValidationError = {
  readonly field: string;
  readonly message: string;
};

export const validateCheckout = (
  input: unknown
): Result<Checkout, readonly CheckoutValidationError[]> => {
  const parsed = checkoutSchema.safeParse(input);
  if (parsed.success) return Ok(parsed.data);

  return Err(
    parsed.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }))
  );
};
