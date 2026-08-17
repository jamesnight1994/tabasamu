/**
 * MOCK PAYMENT GATEWAY
 *
 * ⚠ THIS IS NOT A BACKEND, AND IT IS NOT AN INTEGRATION. NOTHING HERE IS
 *   CONNECTED TO SAFARICOM OR TO ANY CARD RAIL. No credential is present, and
 *   no live call is made. [NN-04]
 *
 * ⚠ IT IS DELIBERATELY UNRELIABLE, AND THAT IS THE POINT.
 *
 *   A mock that always succeeds instantly is worse than no mock at all. It lets
 *   you build a checkout that looks finished and then collapses the first time
 *   it meets a real Nairobi connection — because you have never once seen the
 *   states that actually matter:
 *
 *     · the customer who takes 40 seconds to find their phone
 *     · the customer who cancels on the handset
 *     · the customer who fat-fingers their PIN
 *     · THE CALLBACK THAT NEVER ARRIVES         ⚠ the one that ruins you
 *     · the callback that arrives TWICE
 *     · the callback that arrives AFTER we gave up waiting
 *
 *   So this mock produces all of them, on a weighted distribution, and the UI is
 *   built against that reality rather than against a happy path. [R-10, R-14]
 */

import {
  type Payment,
  type PaymentStatus,
  type WebhookEvent,
  PENDING_WINDOW_MS,
} from '../../domain/payment';

import type {
  IdempotencyKey,
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  PaymentStatusResponse,
  PaymentError,
  CancelPaymentRequest,
  CancelPaymentResponse,
  RefundRequest,
  RefundResponse,
  ReconcileRequest,
  ReconcileResult,
  WebhookVerification,
  WebhookProcessResult,
} from '../../domain/payment/contracts';

import type { PaymentGateway } from '../../ports';
import {
  type PaymentId,
  type OrderId,
  type Result,
  Ok,
  Err,
  paymentId as toPaymentId,
} from '../../domain/shared';

/* ================================================================== *
 * The simulated outcome distribution
 * ================================================================== */

/**
 * ⚠ THESE WEIGHTS ARE NOT REALISTIC PRODUCTION RATES. They are TESTING rates,
 *   tuned so that a developer clicking through the checkout a dozen times WILL
 *   hit the nasty states rather than seeing twelve clean successes and shipping.
 *
 *   In production the success rate is far higher. But a 2% `unknown` rate at
 *   scale is hundreds of customers a month whose money is in limbo — which is
 *   exactly why `unknown` must be a designed state and not an afterthought.
 */
export type SimulatedOutcome =
  | 'success'
  | 'success_late' // ⚠ callback arrives AFTER we declared `unknown`
  | 'cancelled_by_user' // customer pressed cancel on the handset
  | 'wrong_pin'
  | 'insufficient_funds'
  | 'timeout_no_callback' // ⚠ THE DANGEROUS ONE — we never hear back
  | 'provider_error';

const DEFAULT_WEIGHTS: Readonly<Record<SimulatedOutcome, number>> = {
  success: 55,
  success_late: 5,
  cancelled_by_user: 12,
  wrong_pin: 8,
  insufficient_funds: 8,
  timeout_no_callback: 10, // ⚠ deliberately high — you MUST design for this
  provider_error: 2,
};

const FAILURE_REASON: Readonly<Record<string, string>> = {
  cancelled_by_user: 'Request cancelled by user',
  wrong_pin: 'Wrong M-PESA PIN entered',
  insufficient_funds: 'Insufficient funds in M-PESA account',
  provider_error: 'The payment service did not respond',
};

/* ================================================================== *
 * Internal record
 * ================================================================== */

interface MockPaymentRecord {
  payment: Payment;
  outcome: SimulatedOutcome;
  /** When the customer would realistically finish typing their PIN. */
  resolvesAt: number;
  /** ⚠ Set once a callback has been "delivered". Duplicates are no-ops. */
  callbackReceived: boolean;
  idempotencyKey: IdempotencyKey;
  webhooks: WebhookEvent[];
}

const pick = (weights: Readonly<Record<SimulatedOutcome, number>>): SimulatedOutcome => {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [k, w] of Object.entries(weights)) {
    r -= w;
    if (r <= 0) return k as SimulatedOutcome;
  }
  return 'success';
};

const latency = (min = 220, max = 900): Promise<void> =>
  new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));

/** M-PESA receipt codes look like `SFF6VXQ8LR`. Support will ask for this. */
const mpesaReceipt = (): string => {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 10 }, () => A[Math.floor(Math.random() * A.length)]).join('');
};

const checkoutRequestId = (): string =>
  `ws_CO_${Date.now()}${Math.floor(Math.random() * 1000)}`;

/* ================================================================== *
 * The gateway
 * ================================================================== */

export interface MockPaymentOptions {
  readonly weights?: Partial<Record<SimulatedOutcome, number>>;
  /** Force a single outcome. Used by the test suite to make each case deterministic. */
  readonly forceOutcome?: SimulatedOutcome;
  /** Speed up the PIN-entry delay in tests. */
  readonly pinDelayMs?: number;
  readonly cardEnabled?: boolean;
}

export const createMockPaymentGateway = (
  opts: MockPaymentOptions = {}
): PaymentGateway & {
  /** Internal. The unguarded body, wrapped by the idempotency guard in `initiate`. */
  __initiateUnguarded(
    req: InitiatePaymentRequest
  ): Promise<Result<InitiatePaymentResponse, PaymentError>>;
  /** TEST SEAM — simulate the provider POSTing a callback to our webhook. */
  __deliverCallback(providerRef: string, duplicate?: boolean): Promise<WebhookProcessResult>;
  __verifyWebhook(rawBody: string, headers: Record<string, string>): WebhookVerification;
} => {
  const weights = { ...DEFAULT_WEIGHTS, ...opts.weights };
  const pinDelay = opts.pinDelayMs ?? 4_000;

  const byId = new Map<PaymentId, MockPaymentRecord>();
  const byRef = new Map<string, MockPaymentRecord>();
  /** ⚠ THE DOUBLE-CHARGE GUARD. Keyed by idempotency key. */
  const byIdemKey = new Map<IdempotencyKey, MockPaymentRecord>();

  /**
   * ⚠ THE RACE WINDOW — AND WHY THE COMPLETED MAP ABOVE IS NOT ENOUGH.
   *
   *   The idempotency check is `await`ed behind network latency. Two taps that
   *   land 80ms apart BOTH pass the "have I seen this key?" check before EITHER
   *   of them has finished writing its result. Both then create a payment. The
   *   customer's phone buzzes twice and they can pay twice.
   *
   *   My own test caught this. The completed-map check is necessary but NOT
   *   sufficient: it only knows about requests that have FINISHED. So we also
   *   record the IN-FLIGHT promise, keyed the same way, and a concurrent caller
   *   AWAITS THE FIRST ONE rather than starting a second.
   *
   *   ⚠ A REAL BACKEND HAS EXACTLY THIS BUG unless the idempotency key carries a
   *     UNIQUE CONSTRAINT IN THE DATABASE. An application-level "check then
   *     insert" is the same race across two processes, and no amount of
   *     application code closes it. This is called out in the backend contract.
   */
  const inFlight = new Map<IdempotencyKey, Promise<Result<InitiatePaymentResponse, PaymentError>>>();
  /** ⚠ Processed callbacks. A repeat is a NO-OP, not an error. */
  const processedCallbacks = new Set<string>();

  const now = () => Date.now();

  /**
   * ⚠ Resolve what the payment's status WOULD be right now, given its simulated
   *   outcome and how much time has passed. This models the provider, not us.
   */
  const advance = (rec: MockPaymentRecord): MockPaymentRecord => {
    const t = now();
    const elapsed = t - new Date(rec.payment.createdAt).getTime();

    // Still within the PIN-entry window — the customer is holding their phone.
    if (t < rec.resolvesAt) {
      return rec;
    }

    const settle = (status: PaymentStatus, extra: Partial<Payment> = {}) => {
      rec.payment = {
        ...rec.payment,
        status,
        updatedAt: new Date(t).toISOString(),
        ...extra,
      };
      return rec;
    };

    switch (rec.outcome) {
      case 'success':
        if (!rec.callbackReceived) rec.callbackReceived = true;
        return settle('succeeded', { transactionRef: rec.payment.transactionRef ?? mpesaReceipt() });

      case 'cancelled_by_user':
      case 'wrong_pin':
      case 'insufficient_funds':
      case 'provider_error':
        if (!rec.callbackReceived) rec.callbackReceived = true;
        return settle('failed', {
          failureReason: rec.payment.failureReason ?? FAILURE_REASON[rec.outcome],
        });

      /**
       * ⚠ THE STATE THAT MATTERS MOST.
       *
       *   No callback. Ever. We wait out the full window and then we say — out
       *   loud, to the customer — that WE DO NOT KNOW. We do not say "failed",
       *   because the money may well have left their account.
       *
       *   Collapsing this into `failed` tells a customer who HAS paid that they
       *   have not, and invites them to pay twice. [R-10, F-58]
       */
      case 'timeout_no_callback':
        if (elapsed > PENDING_WINDOW_MS) return settle('unknown');
        return rec;

      /**
       * ⚠ THE LATE CALLBACK.
       *
       *   We gave up. We told the customer we did not know. And THEN Safaricom
       *   confirms the payment. The order must be able to climb back out of
       *   `manual_reconciliation` into `paid` — which is exactly why the order
       *   state machine permits that edge, and why the customer was never told
       *   "failed".
       */
      case 'success_late':
        if (elapsed > PENDING_WINDOW_MS * 2) {
          if (!rec.callbackReceived) rec.callbackReceived = true;
          return settle('succeeded', {
            transactionRef: rec.payment.transactionRef ?? mpesaReceipt(),
          });
        }
        if (elapsed > PENDING_WINDOW_MS) return settle('unknown');
        return rec;
    }
  };

  return {
    /* -------------------------------------------------------------- *
     * INITIATE
     * -------------------------------------------------------------- */
    async initiate(
      req: InitiatePaymentRequest
    ): Promise<Result<InitiatePaymentResponse, PaymentError>> {
      /**
       * ⚠ CHECKED SYNCHRONOUSLY, BEFORE THE AWAIT. This is the fix for the race
       *   described above. A second tap arriving while the first is still in the
       *   air joins the FIRST promise instead of starting a second payment.
       */
      const pending = inFlight.get(req.idempotencyKey);
      if (pending) {
        const original = await pending;
        if (!original.ok) return original;
        return Ok({ ...original.value, replayed: true });
      }

      const work = this.__initiateUnguarded(req);
      inFlight.set(req.idempotencyKey, work);
      try {
        return await work;
      } finally {
        // Keep the COMPLETED record (byIdemKey) but release the in-flight slot.
        inFlight.delete(req.idempotencyKey);
      }
    },

    async __initiateUnguarded(
      req: InitiatePaymentRequest
    ): Promise<Result<InitiatePaymentResponse, PaymentError>> {
      await latency();

      /**
       * ⚠ THE IDEMPOTENCY CHECK COMES FIRST, BEFORE ANYTHING ELSE.
       *
       *   The customer double-tapped, or their connection dropped and the app
       *   retried. Same key = same payment. We return the ORIGINAL, and we mark
       *   it `replayed` so the UI can tell the difference between "we sent a new
       *   push" and "you already have one waiting on your phone".
       *
       *   Without this, they get two STK prompts and can pay twice.
       */
      const existing = byIdemKey.get(req.idempotencyKey);
      if (existing) {
        return Ok({
          paymentId: existing.payment.id,
          providerRef: existing.payment.providerRef!,
          status: existing.payment.status === 'initiated' ? 'initiated' : 'pending',
          card: null,
          replayed: true, // ⚠ the tell
          createdAt: existing.payment.createdAt,
        });
      }

      // ⛔ D-35 — the card rail is not configured and may never be Stripe.
      if (req.provider === 'card' && !opts.cardEnabled) {
        return Err({
          kind: 'provider_not_configured',
          provider: 'card',
          blockedBy: 'D-35',
        });
      }

      if (req.provider === 'mpesa' && !req.phone) {
        return Err({ kind: 'invalid_phone', detail: 'M-PESA requires a phone number' });
      }

      const outcome = opts.forceOutcome ?? pick(weights);
      const id = toPaymentId(`pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
      const ref = checkoutRequestId();
      const created = new Date().toISOString();

      const rec: MockPaymentRecord = {
        payment: {
          id,
          orderId: req.orderId,
          provider: req.provider,
          amount: req.amount,
          /**
           * ⚠ `pending`. NEVER `succeeded`.
           *   Safaricom has ACCEPTED the request. The customer has not yet typed
           *   a PIN. The type of `InitiatePaymentResponse.status` makes it
           *   impossible to claim otherwise.
           */
          status: 'pending',
          providerRef: ref,
          transactionRef: null,
          failureReason: null,
          createdAt: created,
          updatedAt: created,
        },
        outcome,
        resolvesAt: now() + pinDelay,
        callbackReceived: false,
        idempotencyKey: req.idempotencyKey,
        webhooks: [],
      };

      byId.set(id, rec);
      byRef.set(ref, rec);
      byIdemKey.set(req.idempotencyKey, rec);

      return Ok({
        paymentId: id,
        providerRef: ref,
        status: 'pending',
        card:
          req.provider === 'card'
            ? { mode: 'redirect', redirectUrl: `/checkout/card/simulated?ref=${ref}` }
            : null,
        replayed: false,
        createdAt: created,
      });
    },

    /* -------------------------------------------------------------- *
     * STATUS — the polling fallback
     * -------------------------------------------------------------- */
    async status(providerRef: string): Promise<Result<PaymentStatusResponse, PaymentError>> {
      await latency(120, 400);

      const rec = byRef.get(providerRef);
      if (!rec) return Err({ kind: 'network' });

      const advanced = advance(rec);

      return Ok({
        paymentId: advanced.payment.id,
        orderId: advanced.payment.orderId,
        status: advanced.payment.status,
        transactionRef: advanced.payment.transactionRef,
        failureReason: advanced.payment.failureReason,
        callbackReceived: advanced.callbackReceived,
        updatedAt: advanced.payment.updatedAt,
      });
    },

    /* -------------------------------------------------------------- *
     * CANCEL
     * -------------------------------------------------------------- */
    async cancel(req: CancelPaymentRequest): Promise<Result<CancelPaymentResponse, PaymentError>> {
      await latency(100, 300);
      const rec = byId.get(req.paymentId);
      if (!rec) return Err({ kind: 'network' });

      /**
       * ⚠ AN M-PESA STK PUSH CANNOT BE RECALLED.
       *   Once Safaricom has pushed the prompt, only the customer or the timeout
       *   can end it. We report `supported: false` HONESTLY rather than pretend
       *   we cancelled something we did not. The customer's handset may still be
       *   showing the prompt — and if they pay it, we must honour it.
       */
      if (rec.payment.provider === 'mpesa') {
        return Ok({
          paymentId: req.paymentId,
          supported: false,
          status: rec.payment.status,
        });
      }

      rec.payment = { ...rec.payment, status: 'failed', failureReason: req.reason };
      return Ok({ paymentId: req.paymentId, supported: true, status: 'failed' });
    },

    /* -------------------------------------------------------------- *
     * REFUND — ⛔ D-36 / D-37
     * -------------------------------------------------------------- */
    async refund(req: RefundRequest): Promise<Result<RefundResponse, PaymentError>> {
      await latency();
      const rec = byId.get(req.paymentId);
      if (!rec) return Err({ kind: 'network' });

      const isMpesa = rec.payment.provider === 'mpesa';

      /**
       * ⚠ AN M-PESA REFUND IS A HUMAN BEING WITH TILL ACCESS.
       *
       *   It is a B2C reversal, performed manually, and it does not settle in the
       *   time it takes to return an HTTP response. Reporting `succeeded` here
       *   would be a lie that leaves the customer's money exactly where it is
       *   while the UI says it has been sent.
       *
       *   So: `pending_manual`, and `requiresManualAction: true`. The ops team
       *   sees a task. The customer sees an honest "in progress". [D-37]
       */
      return Ok({
        refundId: `rfnd_${Date.now()}`,
        paymentId: req.paymentId,
        amount: req.amount ?? rec.payment.amount,
        status: isMpesa ? 'pending_manual' : 'processing',
        requiresManualAction: isMpesa,
        providerRef: rec.payment.providerRef,
        createdAt: new Date().toISOString(),
      });
    },

    /* -------------------------------------------------------------- *
     * RECONCILE — how `unknown` gets resolved
     * -------------------------------------------------------------- */
    async reconcile(req: ReconcileRequest): Promise<Result<ReconcileResult, PaymentError>> {
      await latency(400, 1200);
      const rec = byRef.get(req.providerRef);
      if (!rec) return Err({ kind: 'network' });

      const advanced = advance(rec);

      /**
       * ⚠ RECONCILIATION MAY FAIL TO RESOLVE ANYTHING, AND THAT IS HONEST.
       *
       *   Querying Safaricom's transaction status API does not always produce an
       *   answer either. A payment can remain `unknown` after a reconciliation
       *   attempt — at which point a human checks the till statement. Pretending
       *   otherwise would just move the lie one layer down.
       */
      if (advanced.payment.status === 'unknown') {
        return Ok({
          paymentId: advanced.payment.id,
          status: 'unknown', // ⚠ still unknown. Escalate to a human.
          transactionRef: null,
          method: 'provider_query',
          resolvedAt: null,
        });
      }

      return Ok({
        paymentId: advanced.payment.id,
        status: advanced.payment.status,
        transactionRef: advanced.payment.transactionRef,
        method: 'provider_query',
        resolvedAt: new Date().toISOString(),
      });
    },

    async byId(id: PaymentId): Promise<Payment | null> {
      const rec = byId.get(id);
      return rec ? advance(rec).payment : null;
    },

    async webhookHistory(id: PaymentId): Promise<readonly WebhookEvent[]> {
      return byId.get(id)?.webhooks ?? [];
    },

    /* -------------------------------------------------------------- *
     * TEST SEAMS — simulate the provider calling US
     * -------------------------------------------------------------- */

    /**
     * ⚠ MODELS SAFARICOM POSTING TO OUR CALLBACK URL.
     *
     *   Call it twice with `duplicate: true` to prove the duplicate is a NO-OP.
     *   This is the single most important webhook test, because M-PESA WILL do
     *   this in production — and an unguarded handler will fulfil the order twice.
     */
    async __deliverCallback(providerRef: string, duplicate = false): Promise<WebhookProcessResult> {
      const rec = byRef.get(providerRef);
      if (!rec) {
        return { accepted: false, duplicate: false, paymentId: null, resultingStatus: null };
      }

      // ⚠ The provider's own id is the idempotency key. We never generate it.
      const key = `${providerRef}:${rec.outcome}`;

      if (processedCallbacks.has(key)) {
        /**
         * ⚠ ALREADY PROCESSED. NO-OP. AND WE STILL RETURN "ACCEPTED".
         *
         *   Returning an error here would make Safaricom retry HARDER, producing
         *   more duplicates. The correct response to a duplicate is a calm 200
         *   and no side effects whatsoever.
         */
        return {
          accepted: true,
          duplicate: true, // ⚠ the tell
          paymentId: rec.payment.id,
          resultingStatus: rec.payment.status,
        };
      }

      processedCallbacks.add(key);

      // Force the outcome to land now, as a real callback would.
      rec.resolvesAt = 0;
      const advanced = advance(rec);
      advanced.callbackReceived = true;

      advanced.webhooks.push({
        id: `whk_${Date.now()}`,
        paymentId: advanced.payment.id,
        provider: advanced.payment.provider,
        idempotencyKey: key,
        payload: { ResultCode: advanced.payment.status === 'succeeded' ? 0 : 1032 },
        signatureValid: true,
        receivedAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
      });

      void duplicate;

      return {
        accepted: true,
        duplicate: false,
        paymentId: advanced.payment.id,
        resultingStatus: advanced.payment.status,
      };
    },

    /**
     * ⚠ MODELS SIGNATURE VERIFICATION — which the BACKEND owns.
     *
     *   An M-PESA callback URL is PUBLIC. Anyone on the internet can POST to it.
     *   Without verification, an attacker marks their own order paid and we ship
     *   free kombucha to whoever asks. The real implementation validates the
     *   source IP against Safaricom's published range and/or an HMAC signature.
     */
    __verifyWebhook(rawBody: string, headers: Record<string, string>): WebhookVerification {
      const sig = headers['x-signature'] ?? headers['X-Signature'] ?? '';
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawBody);
      } catch {
        return {
          valid: false,
          provider: 'mpesa',
          idempotencyKey: '',
          reason: 'malformed body',
        };
      }

      const ref =
        typeof parsed === 'object' && parsed !== null && 'CheckoutRequestID' in parsed
          ? String((parsed as Record<string, unknown>).CheckoutRequestID)
          : '';

      if (sig !== 'valid-signature') {
        // ⚠ DISCARDED. Not processed-then-flagged. Discarded.
        return {
          valid: false,
          provider: 'mpesa',
          idempotencyKey: ref,
          reason: 'signature verification failed',
        };
      }

      return { valid: true, provider: 'mpesa', idempotencyKey: ref, reason: null };
    },
  };
};

/** Re-exported for the test suite. */
export type { OrderId };
