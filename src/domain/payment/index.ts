/**
 * DOMAIN — PAYMENT
 *
 * ⚠ THE CENTRAL RULE OF THIS FILE:
 *
 *   An M-PESA payment has THREE genuinely different terminal outcomes:
 *   succeeded, failed, and UNKNOWN. The site does not always know which
 *   one occurred.
 *
 *   `unknown` is a FIRST-CLASS STATE and must NEVER be collapsed into
 *   `failed`. Guessing about whether a customer's money left their account
 *   is the fastest way to destroy trust in this market. [R-10, F-58, F-60]
 *
 *   This is why there are three outcome ROUTES, not one generic error page.
 *
 * The `provider` union is deliberately `'mpesa' | 'card'` — NOT `'stripe'`.
 * Stripe may not be able to settle KES for a Kenyan entity (⛔ D-35, R-05),
 * and the card rail may have to become Flutterwave / Pesapal / DPO. The
 * abstraction is designed so that swap is survivable.
 */

import type { Money, OrderId, PaymentId, ISODateTime } from '../shared';
import type { E164Phone } from '../identity/phone';

export type PaymentProvider = 'mpesa' | 'card';

/**
 * ```
 * initiated → pending → succeeded
 *                  │
 *                  ├──▶ failed    (user cancelled / insufficient funds / wrong PIN)
 *                  └──▶ unknown   ⚠ NO CALLBACK RECEIVED WITHIN THE WINDOW
 * ```
 */
export type PaymentStatus = 'initiated' | 'pending' | 'succeeded' | 'failed' | 'unknown';

export const TERMINAL_STATUSES = ['succeeded', 'failed', 'unknown'] as const;

export const isTerminal = (s: PaymentStatus): boolean =>
  (TERMINAL_STATUSES as readonly string[]).includes(s);

/** ⚠ Guard. `unknown` is NOT a failure. Any code that treats it as one is a bug. */
export const isFailure = (s: PaymentStatus): boolean => s === 'failed';
export const isSuccess = (s: PaymentStatus): boolean => s === 'succeeded';
export const isIndeterminate = (s: PaymentStatus): boolean => s === 'unknown';

export interface Payment {
  readonly id: PaymentId;
  readonly orderId: OrderId;
  readonly provider: PaymentProvider;
  readonly amount: Money;
  readonly status: PaymentStatus;
  /**
   * The M-PESA `CheckoutRequestID`, or the card provider's intent ID.
   * ⚠ THIS IS THE RECOVERY KEY. It is what makes the pending state
   *   server-authoritative and able to survive a page reload and a
   *   connection drop. [R-10]
   */
  readonly providerRef: string | null;
  /**
   * The M-PESA RECEIPT CODE the customer sees on their phone.
   * ⚠ This is the PRIMARY SUPPORT KEY in this market. The customer will
   *   quote this, not an order number. [R-21, F-88]
   */
  readonly transactionRef: string | null;
  readonly failureReason: string | null;
  readonly createdAt: ISODateTime;
  readonly updatedAt: ISODateTime;
}

export interface InitiatePaymentInput {
  readonly orderId: OrderId;
  readonly amount: Money;
  readonly provider: PaymentProvider;
  /** Required for M-PESA. Already normalised to `2547XXXXXXXX` by the domain. */
  readonly phone?: E164Phone;
}

/**
 * Append-only. NEVER mutated. NEVER deleted.
 * This is what lets customer care answer "did my money go through?" [R-21, F-89]
 */
export interface WebhookEvent {
  readonly id: string;
  readonly paymentId: PaymentId;
  readonly provider: PaymentProvider;
  /** ⚠ A duplicate callback MUST be a no-op. M-PESA will retry. */
  readonly idempotencyKey: string;
  readonly payload: unknown; // stored VERBATIM
  readonly signatureValid: boolean;
  readonly receivedAt: ISODateTime;
  readonly processedAt: ISODateTime | null;
}

/* ------------------------------------------------------------------ *
 * The pending window
 * ------------------------------------------------------------------ */

/**
 * How long we wait for a Daraja callback before declaring `unknown`.
 * Safaricom's STK prompt itself times out at ~60s; we allow headroom for
 * callback delivery. After this, the status is `unknown` — NOT `failed`.
 */
export const PENDING_WINDOW_MS = 90_000;

/** Poll interval for the client-side status check while pending. */
export const PENDING_POLL_INTERVAL_MS = 3_000;

export const hasExceededWindow = (payment: Payment, now: Date = new Date()): boolean =>
  now.getTime() - new Date(payment.createdAt).getTime() > PENDING_WINDOW_MS;

/**
 * Resolve what the CUSTOMER should be shown.
 *
 * ⚠ Note what this does NOT do: it never converts a timed-out pending payment
 *   into `failed`. It converts it into `unknown`, which routes to a page that
 *   says, honestly, that we have not heard back yet — and tells them we will
 *   confirm by SMS.
 */
export type PaymentOutcome =
  | { kind: 'pending'; elapsedMs: number }
  | { kind: 'succeeded'; transactionRef: string | null }
  | { kind: 'failed'; reason: string | null }
  | { kind: 'unknown' };

export const resolveOutcome = (payment: Payment, now: Date = new Date()): PaymentOutcome => {
  switch (payment.status) {
    case 'succeeded':
      return { kind: 'succeeded', transactionRef: payment.transactionRef };
    case 'failed':
      return { kind: 'failed', reason: payment.failureReason };
    case 'unknown':
      return { kind: 'unknown' };
    case 'initiated':
    case 'pending': {
      if (hasExceededWindow(payment, now)) {
        // ⚠ NOT 'failed'. We genuinely do not know.
        return { kind: 'unknown' };
      }
      return {
        kind: 'pending',
        elapsedMs: now.getTime() - new Date(payment.createdAt).getTime(),
      };
    }
  }
};

/**
 * Copy for each outcome. Written in-voice: no exclamation marks, no jokes,
 * non-judgemental on failure. [Brand Book §07]
 */
export const outcomeCopy = (
  o: PaymentOutcome
): { heading: string; body: string; retry: boolean } => {
  switch (o.kind) {
    case 'pending':
      return {
        heading: 'Check your phone',
        body: 'We have sent a payment request to your handset. Enter your M-PESA PIN to confirm. This page will update on its own.',
        retry: false,
      };
    case 'succeeded':
      return {
        heading: 'Payment received',
        body: 'Thank you. We will confirm your delivery by SMS.',
        retry: false,
      };
    case 'failed':
      return {
        heading: 'The payment did not go through',
        body: 'Nothing has been charged. Your box is still here, exactly as you left it.',
        retry: true,
      };
    case 'unknown':
      return {
        heading: 'We have not heard back yet',
        body: 'M-PESA has not confirmed this payment to us. Do not pay again. If the money left your account, we will find it and confirm by SMS. If it did not, nothing has been charged.',
        retry: false,
      };
  }
};
