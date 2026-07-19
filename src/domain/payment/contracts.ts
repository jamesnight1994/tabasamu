/**
 * DOMAIN — PAYMENT CONTRACTS
 *
 * Provider-neutral payment operations, plus the M-PESA and card specifics that
 * the BACKEND must own. Nothing here performs I/O — these are the TYPES that
 * the backend implements and the frontend consumes.
 *
 * ⚠ THE RULE THAT GOVERNS THIS ENTIRE FILE:
 *
 *   THE FRONTEND NEVER DECIDES THE OUTCOME OF A PAYMENT.
 *
 *   An M-PESA STK push returns an HTTP 200 with a `CheckoutRequestID` the
 *   instant it is ACCEPTED — long before the customer has typed their PIN, and
 *   regardless of whether they ever do. Treating that acknowledgement as proof
 *   of payment is THE classic Daraja integration bug. It ships orders that were
 *   never paid for.
 *
 *   So: the acknowledgement gives us a `providerRef` and NOTHING ELSE. The
 *   truth arrives later, by callback, and is confirmed server-side. [R-10, F-58]
 *
 * ⛔ D-35 — THE CARD RAIL MAY NOT BE STRIPE.
 *    Stripe does not offer standard KES settlement to Kenyan-registered
 *    entities. If it cannot settle, the rail becomes Flutterwave / Pesapal /
 *    DPO. Every type below is therefore written against `'card'`, never against
 *    `'stripe'`. The Stripe specifics are confined to `CardSessionDescriptor`,
 *    which is the ONLY thing that changes if the provider changes.
 */

import type { Money, OrderId, PaymentId, ISODateTime, Result } from '../shared';
import type { E164Phone } from '../identity/phone';
import type { Payment, PaymentProvider, PaymentStatus } from './index';

/* ================================================================== *
 * IDEMPOTENCY
 * ================================================================== */

/**
 * ⚠ THE DOUBLE-CHARGE GUARD.
 *
 *   Generated ONCE per checkout attempt, on the CLIENT, and sent with the
 *   initiate call. If the customer double-taps "Pay", or their connection drops
 *   and the app retries, the SAME key arrives twice — and the backend MUST
 *   return the FIRST payment rather than creating a second one.
 *
 *   Nairobi mobile connections drop mid-request routinely. Without this key, a
 *   dropped response on a successful request looks identical to a failed
 *   request, and the customer taps again. That is how people get charged twice.
 */
export type IdempotencyKey = string & { readonly __idempotency: unique symbol };

/**
 * ⚠ Must be stable across retries of the SAME attempt, and different across
 *   genuinely NEW attempts. It is NOT derived from the cart — a customer whose
 *   first payment genuinely failed must be able to try again with the same cart.
 */
export const idempotencyKey = (s: string): IdempotencyKey => s as IdempotencyKey;

export const newIdempotencyKey = (): IdempotencyKey =>
  idempotencyKey(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `idem_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  );

/* ================================================================== *
 * INITIATE
 * ================================================================== */

export interface InitiatePaymentRequest {
  readonly orderId: OrderId;
  readonly amount: Money;
  readonly provider: PaymentProvider;
  /** REQUIRED for M-PESA. Already normalised to `2547XXXXXXXX` by the domain. */
  readonly phone?: E164Phone;
  /** ⚠ REQUIRED. The double-charge guard. */
  readonly idempotencyKey: IdempotencyKey;
}

/**
 * ⚠ WHAT AN INITIATE RESPONSE IS, AND IS NOT.
 *
 *   IS:     an acknowledgement that the provider accepted the request, plus the
 *           `providerRef` we will use to ask about it later.
 *   IS NOT: proof of payment. Note there is no `success: true` field, by design.
 *
 *   The status returned here can ONLY ever be `initiated` or `pending`. It can
 *   never be `succeeded`. The type makes the bug unrepresentable.
 */
export interface InitiatePaymentResponse {
  readonly paymentId: PaymentId;
  /** The M-PESA `CheckoutRequestID`, or the card intent/session id. THE RECOVERY KEY. */
  readonly providerRef: string;
  /** ⚠ Deliberately narrowed. An initiate call CANNOT report success. */
  readonly status: Extract<PaymentStatus, 'initiated' | 'pending'>;
  /** Card only — what the client must do next (3DS, redirect, confirm). */
  readonly card: CardSessionDescriptor | null;
  /** True when this key had already been used — the backend returned the ORIGINAL payment. */
  readonly replayed: boolean;
  readonly createdAt: ISODateTime;
}

export type PaymentError =
  | { kind: 'invalid_phone'; detail: string }
  | { kind: 'amount_mismatch'; expected: Money; received: Money }
  /** Cart contents or price changed between checkout and pay. MUST re-quote. */
  | { kind: 'stale_checkout'; detail: string }
  | { kind: 'provider_unavailable'; provider: PaymentProvider }
  /** ⛔ D-35 — the card rail is not configured. */
  | { kind: 'provider_not_configured'; provider: PaymentProvider; blockedBy: string }
  | { kind: 'order_not_payable'; status: string }
  | { kind: 'rate_limited'; retryAfterMs: number }
  | { kind: 'network' };

export const paymentErrorMessage = (e: PaymentError): string => {
  switch (e.kind) {
    case 'invalid_phone':
      return 'That does not look like a Kenyan mobile number.';
    case 'amount_mismatch':
    case 'stale_checkout':
      /** ⚠ Never blame the customer for a price change. */
      return 'Something in your box changed. Please review it before paying.';
    case 'provider_unavailable':
      return 'That payment method is not responding. Please try again shortly.';
    case 'provider_not_configured':
      return 'That payment method is not available yet.';
    case 'order_not_payable':
      return 'This order can no longer be paid for.';
    case 'rate_limited':
      return 'Please wait a moment before trying again.';
    case 'network':
      return 'We could not reach the payment service. Your box is still here.';
  }
};

/* ================================================================== *
 * CARD — ⛔ D-35. Provider-neutral by construction.
 * ================================================================== */

/**
 * ⚠ THE ONLY PROVIDER-SPECIFIC TYPE IN THE PAYMENT DOMAIN.
 *
 *   Everything else speaks `'card'`. This descriptor tells the client what the
 *   chosen rail needs it to DO next — and the three shapes below cover Stripe,
 *   Flutterwave, Pesapal and DPO between them.
 *
 *   `client_secret`  → Stripe PaymentIntent (confirm in-page, 3DS in an iframe)
 *   `redirect`       → Flutterwave / Pesapal / DPO (leave the site, come back)
 *   `hosted_session` → Stripe Checkout (leave the site, come back)
 *
 *   If D-35 resolves against Stripe, the UI already handles `redirect`. That is
 *   the whole point of the abstraction.
 */
export type CardSessionDescriptor =
  | {
      readonly mode: 'client_secret';
      /**
       * ⚠ NOT A SECRET IN THE CREDENTIAL SENSE. A Stripe client_secret is
       *   scoped to ONE PaymentIntent, is designed to be used in the browser,
       *   and cannot be used to charge anything else. The SECRET KEY (`sk_...`)
       *   NEVER leaves the server. [NN-03]
       */
      readonly clientSecret: string;
      /** Publishable key (`pk_...`). Safe by design. */
      readonly publishableKey: string;
    }
  | {
      readonly mode: 'redirect';
      readonly redirectUrl: string;
    }
  | {
      readonly mode: 'hosted_session';
      readonly sessionUrl: string;
    };

/** What the client must do after a card initiate. Drives the checkout UI. */
export type CardAction =
  | { kind: 'confirm_in_page' }
  | { kind: 'authenticate_3ds' }
  | { kind: 'leave_site'; url: string };

export const cardActionFor = (d: CardSessionDescriptor): CardAction => {
  switch (d.mode) {
    case 'client_secret':
      return { kind: 'confirm_in_page' };
    case 'redirect':
      return { kind: 'leave_site', url: d.redirectUrl };
    case 'hosted_session':
      return { kind: 'leave_site', url: d.sessionUrl };
  }
};

/* ================================================================== *
 * STATUS — server-authoritative
 * ================================================================== */

/**
 * ⚠ THE CLIENT ASKS. IT NEVER DECIDES.
 *
 *   This is the polling FALLBACK for the case where the callback has not yet
 *   reached us — or where the customer reloaded the page and the websocket (if
 *   any) is gone. It is keyed by `providerRef`, which is why the pending state
 *   survives a reload AND a connection drop.
 */
export interface PaymentStatusResponse {
  readonly paymentId: PaymentId;
  readonly orderId: OrderId;
  readonly status: PaymentStatus;
  /** The M-PESA receipt code. THE PRIMARY SUPPORT KEY in this market. [D-33, R-21] */
  readonly transactionRef: string | null;
  readonly failureReason: string | null;
  /** True once a signed callback has been received and verified server-side. */
  readonly callbackReceived: boolean;
  readonly updatedAt: ISODateTime;
}

/* ================================================================== *
 * CANCEL / REFUND
 * ================================================================== */

/**
 * ⚠ M-PESA STK pushes CANNOT be cancelled server-side once sent. The customer
 *   cancels on their handset, or it times out. This operation therefore means
 *   "stop waiting and abandon the attempt" — it does NOT reach into Safaricom.
 *   `supported: false` for M-PESA is the honest answer.
 */
export interface CancelPaymentRequest {
  readonly paymentId: PaymentId;
  readonly reason: string;
}

export interface CancelPaymentResponse {
  readonly paymentId: PaymentId;
  readonly supported: boolean;
  readonly status: PaymentStatus;
}

/**
 * ⛔ D-36 (refund policy) and D-37 (M-PESA refund SLA) ARE UNANSWERED.
 *
 * ⚠ AN M-PESA REFUND IS NOT AN API CALL.
 *   It is a MANUAL B2C reversal performed by a human with till access. The admin
 *   UI must therefore NEVER present it as a one-click operation that resolves
 *   instantly. It is a TASK WITH A STATE — which is precisely why the order
 *   machine has `refund_pending` and not just `refunded`. [D-37]
 */
export interface RefundRequest {
  readonly paymentId: PaymentId;
  /** Omit for a FULL refund. Present = partial. */
  readonly amount?: Money;
  readonly reason: string;
  /** ⚠ REQUIRED. A double-tapped refund must not pay the customer twice. */
  readonly idempotencyKey: IdempotencyKey;
}

export type RefundStatus =
  /** ⚠ M-PESA lands here and STAYS here until a human completes the reversal. */
  | 'pending_manual'
  | 'processing'
  | 'succeeded'
  | 'failed';

export interface RefundResponse {
  readonly refundId: string;
  readonly paymentId: PaymentId;
  readonly amount: Money;
  readonly status: RefundStatus;
  /**
   * ⚠ TRUE for M-PESA. The rail cannot settle this automatically; ops must act.
   *   Surfacing this honestly is the difference between an ops team that knows
   *   it has work to do and a customer whose refund silently never happens.
   */
  readonly requiresManualAction: boolean;
  readonly providerRef: string | null;
  readonly createdAt: ISODateTime;
}

/* ================================================================== *
 * WEBHOOKS — the only source of payment truth
 * ================================================================== */

/**
 * ⚠ EVERY REQUIREMENT BELOW IS A BACKEND REQUIREMENT. The frontend cannot and
 *   must not implement any of it.
 *
 *   1. VERIFY THE SIGNATURE FIRST. An unsigned or badly-signed callback is
 *      DISCARDED — not processed and then flagged. M-PESA callback URLs are
 *      public; anyone can POST to them. Without signature/IP validation, an
 *      attacker marks their own order paid.
 *   2. IDEMPOTENCY. M-PESA WILL deliver the same callback more than once.
 *      The second delivery MUST be a no-op that returns 200. Returning an error
 *      makes Safaricom retry harder.
 *   3. RESPOND 200 FAST. Acknowledge, then process asynchronously. A slow
 *      handler causes retries, which causes duplicates.
 *   4. STORE THE PAYLOAD VERBATIM, ALWAYS, even when the signature FAILS.
 *      The rejected ones are the ones you will need in a dispute.
 */
export interface WebhookVerification {
  readonly valid: boolean;
  readonly provider: PaymentProvider;
  /** ⚠ Derived from the PROVIDER's own id, never generated by us. */
  readonly idempotencyKey: string;
  readonly reason: string | null;
}

export interface WebhookProcessResult {
  readonly accepted: boolean;
  /** ⚠ TRUE when this exact callback has already been processed. Still returns 200. */
  readonly duplicate: boolean;
  readonly paymentId: PaymentId | null;
  readonly resultingStatus: PaymentStatus | null;
}

/* ================================================================== *
 * RECONCILIATION — for the `unknown` payments
 * ================================================================== */

/**
 * ⚠ THIS EXISTS BECAUSE `unknown` IS REAL.
 *
 *   Some percentage of M-PESA payments will produce no callback. The money may
 *   have left the customer's account anyway. Reconciliation is how that money is
 *   FOUND — by querying Safaricom's transaction status API, or by a human
 *   checking the till statement.
 *
 *   A site without reconciliation quietly keeps the money of every customer
 *   whose callback was lost. [R-10, F-60]
 */
export interface ReconcileRequest {
  readonly paymentId: PaymentId;
  readonly providerRef: string;
}

export interface ReconcileResult {
  readonly paymentId: PaymentId;
  /** ⚠ May STILL be `unknown` after a reconciliation attempt. That is honest. */
  readonly status: PaymentStatus;
  readonly transactionRef: string | null;
  /** 'provider_query' | 'manual_till_check' — how the truth was established. */
  readonly method: 'provider_query' | 'manual_till_check';
  readonly resolvedAt: ISODateTime | null;
}

/* ================================================================== *
 * THE PROVIDER-NEUTRAL OPERATION SET
 * ================================================================== */

/**
 * ⚠ NOTE WHAT IS ABSENT: there is no `charge()` that returns a boolean.
 *   The shape of this interface makes the "did it work?" question impossible to
 *   answer synchronously — because in reality, it is.
 */
export interface PaymentOperations {
  initiate(req: InitiatePaymentRequest): Promise<Result<InitiatePaymentResponse, PaymentError>>;
  status(providerRef: string): Promise<Result<PaymentStatusResponse, PaymentError>>;
  cancel(req: CancelPaymentRequest): Promise<Result<CancelPaymentResponse, PaymentError>>;
  refund(req: RefundRequest): Promise<Result<RefundResponse, PaymentError>>;
  reconcile(req: ReconcileRequest): Promise<Result<ReconcileResult, PaymentError>>;
  byId(id: PaymentId): Promise<Payment | null>;
}
