/**
 * PHASE 5 — THE HOSTILE CASES
 *
 * ⚠ These tests are NOT about the happy path. The happy path is easy and it is
 *   already covered. Every test below encodes a way the checkout can take a
 *   customer's money and give them nothing — or take it twice.
 *
 *   Each one is a bug I would otherwise have shipped.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  ORDER_TRANSITIONS,
  transition,
  tryTransition,
  canTransition,
  IllegalTransitionError,
  isTerminalOrder,
  isSettled,
  needsReconciliation,
  orderStatusCopy,
  type OrderStatus,
} from '../../src/domain/order';

import {
  quoteDelivery,
  EMPTY_DELIVERY_CONFIG,
  hasZones,
  amountToFreeDelivery,
  isPickupOffered,
  type DeliveryConfig,
} from '../../src/domain/delivery';

import {
  validateCheckout,
  checkoutSchema,
  summariseRevalidation,
  isBlockingChange,
  canSubmit,
  isBusy,
  CHECKOUT_TTL_MS,
  isExpired,
  type CartChange,
} from '../../src/domain/checkout';

import {
  serialiseCart,
  deserialiseCart,
  CART_SCHEMA_VERSION,
  CART_MAX_AGE_MS,
  toCartLines,
} from '../../src/domain/cart';

import { newIdempotencyKey } from '../../src/domain/payment/contracts';
import { createMockPaymentGateway } from '../../src/adapters/mock/payments';
import { createMockAdapters, configureMocks, resetMockState } from '../../src/adapters/mock';
import { fromMajor, money, variantId, zoneId } from '../../src/domain/shared';
import { normalisePhone } from '../../src/domain/identity/phone';
import { unavailable } from '../../src/domain/catalogue';

/* ================================================================== *
 * 1. THE ORDER STATE MACHINE
 * ================================================================== */

describe('order state machine', () => {
  it('every status has an explicit transition list', () => {
    for (const s of Object.keys(ORDER_TRANSITIONS) as OrderStatus[]) {
      expect(Array.isArray(ORDER_TRANSITIONS[s])).toBe(true);
    }
  });

  it('permits the ordinary path', () => {
    let s: OrderStatus = 'draft';
    for (const next of [
      'awaiting_payment',
      'payment_processing',
      'paid',
      'confirmed',
      'preparing',
      'ready_for_dispatch',
      'dispatched',
      'delivered',
    ] as OrderStatus[]) {
      s = transition(s, next);
    }
    expect(s).toBe('delivered');
  });

  /**
   * ⚠ THE TEST THAT MATTERS MOST IN THIS FILE.
   *
   *   M-PESA delivers callbacks LATE. A callback for an order that was long ago
   *   delivered — or cancelled — WILL arrive. Without a guard, it drives
   *   `delivered → paid` and silently corrupts the order.
   */
  it('⚠ REFUSES a late callback that would rewrite a delivered order', () => {
    expect(() => transition('delivered', 'paid')).toThrow(IllegalTransitionError);
    expect(canTransition('delivered', 'paid')).toBe(false);
  });

  it('⚠ REFUSES a late callback that would resurrect a cancelled order', () => {
    expect(() => transition('cancelled', 'paid')).toThrow(IllegalTransitionError);
  });

  /**
   * ⚠ A DUPLICATE CALLBACK IS A NO-OP, NOT AN ERROR.
   *
   *   Safaricom WILL send the same callback twice. Throwing on the second one
   *   would cause it to retry harder, producing more duplicates. The correct
   *   response is a calm no-op.
   */
  it('⚠ treats a repeat of the SAME transition as an idempotent no-op', () => {
    expect(transition('paid', 'paid')).toBe('paid');

    const r = tryTransition('paid', 'paid');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.changed).toBe(false); // ⚠ no side effect
  });

  it('distinguishes a harmless replay from genuine corruption', () => {
    // Replay of the same state — fine.
    expect(tryTransition('delivered', 'delivered').ok).toBe(true);
    // A genuinely late duplicate that would rewrite history — REFUSED.
    expect(tryTransition('delivered', 'paid').ok).toBe(false);
  });

  it('terminal states have no way out', () => {
    for (const s of ['cancelled', 'refunded', 'partially_refunded'] as OrderStatus[]) {
      expect(isTerminalOrder(s)).toBe(true);
      expect(ORDER_TRANSITIONS[s]).toHaveLength(0);
    }
  });

  /**
   * ⚠ `manual_reconciliation` MUST be able to reach BOTH outcomes.
   *   The late callback arrives and the money is found → `paid`.
   *   Ops checks the till and the money is not there → `payment_failed`.
   */
  it('⚠ manual_reconciliation can resolve in BOTH directions', () => {
    expect(canTransition('manual_reconciliation', 'paid')).toBe(true);
    expect(canTransition('manual_reconciliation', 'payment_failed')).toBe(true);
  });

  it('⚠ manual_reconciliation is NEITHER settled NOR a failure', () => {
    expect(needsReconciliation('manual_reconciliation')).toBe(true);
    expect(isSettled('manual_reconciliation')).toBe(false);
    // ⚠ And critically — it is not lumped in with the failures.
    expect(orderStatusCopy('manual_reconciliation').body).toContain('Do not pay again');
  });

  it('a dispatched order cannot be cancelled — only refunded', () => {
    expect(canTransition('dispatched', 'cancelled')).toBe(false);
    expect(canTransition('dispatched', 'refund_pending')).toBe(true);
  });

  it('a failed payment is retryable — the cart is not destroyed', () => {
    expect(canTransition('payment_failed', 'awaiting_payment')).toBe(true);
  });

  /** ⚠ Brand voice. [Brand Book §07, P-07] */
  it('no status copy uses an exclamation mark or blames the customer', () => {
    for (const s of Object.keys(ORDER_TRANSITIONS) as OrderStatus[]) {
      const copy = orderStatusCopy(s);
      expect(copy.body).not.toContain('!');
      expect(copy.label).not.toContain('!');
      expect(copy.body.toLowerCase()).not.toContain('you failed');
    }
  });
});

/* ================================================================== *
 * 2. IDEMPOTENCY — the double-charge guard
 * ================================================================== */

describe('⚠ payment idempotency', () => {
  it('⚠ a DOUBLE-TAP with the same key returns the SAME payment, not a second one', async () => {
    const gw = createMockPaymentGateway({ forceOutcome: 'success', pinDelayMs: 0 });
    const key = newIdempotencyKey();

    const req = {
      orderId: 'ord_1' as never,
      amount: fromMajor(550),
      provider: 'mpesa' as const,
      phone: '254712345678' as never,
      idempotencyKey: key,
    };

    // The customer taps twice. Or the connection drops and the app retries.
    const [a, b] = await Promise.all([gw.initiate(req), gw.initiate(req)]);

    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;

    /**
     * ⚠ ONE payment. ONE STK push. The customer's phone buzzes ONCE.
     *   Without this, they get two prompts and can pay twice.
     */
    expect(b.value.paymentId).toBe(a.value.paymentId);
    expect(b.value.providerRef).toBe(a.value.providerRef);

    // ⚠ And the second call SAYS it was a replay, so the UI can tell the
    //   difference between "we sent a push" and "you already have one waiting".
    expect(b.value.replayed).toBe(true);
  });

  it('a NEW attempt after a genuine failure gets a NEW key and a NEW push', async () => {
    const gw = createMockPaymentGateway({ forceOutcome: 'wrong_pin', pinDelayMs: 0 });

    const base = {
      orderId: 'ord_1' as never,
      amount: fromMajor(550),
      provider: 'mpesa' as const,
      phone: '254712345678' as never,
    };

    const first = await gw.initiate({ ...base, idempotencyKey: newIdempotencyKey() });
    const retry = await gw.initiate({ ...base, idempotencyKey: newIdempotencyKey() });

    expect(first.ok && retry.ok).toBe(true);
    if (!first.ok || !retry.ok) return;

    // ⚠ A customer whose PIN was wrong MUST be able to try again.
    //   The key is per-ATTEMPT, not derived from the cart.
    expect(retry.value.paymentId).not.toBe(first.value.paymentId);
    expect(retry.value.replayed).toBe(false);
  });
});

/* ================================================================== *
 * 3. WEBHOOKS — duplicates and forgeries
 * ================================================================== */

describe('⚠ webhook handling', () => {
  it('⚠ a DUPLICATE callback is a NO-OP and still returns accepted', async () => {
    const gw = createMockPaymentGateway({ forceOutcome: 'success', pinDelayMs: 0 });

    const res = await gw.initiate({
      orderId: 'ord_1' as never,
      amount: fromMajor(550),
      provider: 'mpesa',
      phone: '254712345678' as never,
      idempotencyKey: newIdempotencyKey(),
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const first = await gw.__deliverCallback(res.value.providerRef);
    const second = await gw.__deliverCallback(res.value.providerRef);

    expect(first.duplicate).toBe(false);
    expect(first.resultingStatus).toBe('succeeded');

    /**
     * ⚠ THE SECOND DELIVERY MUST NOT FULFIL THE ORDER TWICE.
     *
     *   And it must STILL return accepted. Returning an error would make
     *   Safaricom retry harder, producing MORE duplicates — the exact opposite
     *   of what you want.
     */
    expect(second.duplicate).toBe(true);
    expect(second.accepted).toBe(true);
    expect(second.resultingStatus).toBe('succeeded'); // unchanged
  });

  it('⚠ an UNSIGNED callback is DISCARDED — the URL is public', () => {
    const gw = createMockPaymentGateway();

    const body = JSON.stringify({ CheckoutRequestID: 'ws_CO_123', ResultCode: 0 });

    // ⚠ Anyone on the internet can POST to an M-PESA callback URL. Without
    //   signature validation, an attacker marks their own order paid.
    const forged = gw.__verifyWebhook(body, { 'x-signature': 'i-made-this-up' });
    expect(forged.valid).toBe(false);
    expect(forged.reason).toContain('signature');

    const genuine = gw.__verifyWebhook(body, { 'x-signature': 'valid-signature' });
    expect(genuine.valid).toBe(true);
  });

  it('a malformed callback body is rejected, not crashed on', () => {
    const gw = createMockPaymentGateway();
    const r = gw.__verifyWebhook('{{{not json', { 'x-signature': 'valid-signature' });
    expect(r.valid).toBe(false);
  });
});

/* ================================================================== *
 * 4. THE `unknown` PAYMENT
 * ================================================================== */

describe('⚠ the payment we cannot resolve', () => {
  it('⚠ a payment with NO callback becomes `unknown` — NEVER `failed`', async () => {
    const gw = createMockPaymentGateway({
      forceOutcome: 'timeout_no_callback',
      pinDelayMs: 0,
    });

    const res = await gw.initiate({
      orderId: 'ord_1' as never,
      amount: fromMajor(550),
      provider: 'mpesa',
      phone: '254712345678' as never,
      idempotencyKey: newIdempotencyKey(),
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const status = await gw.status(res.value.providerRef);
    expect(status.ok).toBe(true);
    if (!status.ok) return;

    /**
     * ⚠ The money MAY have left the customer's account. We do not know.
     *   Telling them "failed" invites them to pay a second time.
     */
    expect(status.value.status).not.toBe('failed');
    expect(status.value.callbackReceived).toBe(false);
  });

  it('⚠ reconciliation may STILL fail to resolve — and says so honestly', async () => {
    const gw = createMockPaymentGateway({
      forceOutcome: 'timeout_no_callback',
      pinDelayMs: 0,
    });

    const res = await gw.initiate({
      orderId: 'ord_1' as never,
      amount: fromMajor(550),
      provider: 'mpesa',
      phone: '254712345678' as never,
      idempotencyKey: newIdempotencyKey(),
    });
    if (!res.ok) return;

    const rec = await gw.reconcile({
      paymentId: res.value.paymentId,
      providerRef: res.value.providerRef,
    });

    expect(rec.ok).toBe(true);
    if (!rec.ok) return;

    // ⚠ Querying Safaricom does not always produce an answer either. Pretending
    //   otherwise would just move the lie one layer down. A human checks the till.
    expect(rec.value.resolvedAt === null || rec.value.status !== 'unknown').toBe(true);
  });
});

/* ================================================================== *
 * 5. REFUNDS — ⛔ D-37
 * ================================================================== */

describe('⛔ refunds', () => {
  it('⚠ an M-PESA refund is NOT one-click — it requires a human', async () => {
    const gw = createMockPaymentGateway({ forceOutcome: 'success', pinDelayMs: 0 });

    const res = await gw.initiate({
      orderId: 'ord_1' as never,
      amount: fromMajor(550),
      provider: 'mpesa',
      phone: '254712345678' as never,
      idempotencyKey: newIdempotencyKey(),
    });
    if (!res.ok) return;

    const refund = await gw.refund({
      paymentId: res.value.paymentId,
      reason: 'bottle arrived broken',
      idempotencyKey: newIdempotencyKey(),
    });

    expect(refund.ok).toBe(true);
    if (!refund.ok) return;

    /**
     * ⚠ An M-PESA refund is a MANUAL B2C reversal by someone with till access.
     *   Reporting `succeeded` here would be a lie that leaves the customer's
     *   money exactly where it is while the UI claims it was sent. [D-37]
     */
    expect(refund.value.status).toBe('pending_manual');
    expect(refund.value.requiresManualAction).toBe(true);
  });

  it('⚠ an M-PESA STK push cannot be cancelled — and we say so', async () => {
    const gw = createMockPaymentGateway({ forceOutcome: 'success', pinDelayMs: 999_999 });

    const res = await gw.initiate({
      orderId: 'ord_1' as never,
      amount: fromMajor(550),
      provider: 'mpesa',
      phone: '254712345678' as never,
      idempotencyKey: newIdempotencyKey(),
    });
    if (!res.ok) return;

    const cancel = await gw.cancel({
      paymentId: res.value.paymentId,
      reason: 'customer changed their mind',
    });

    expect(cancel.ok).toBe(true);
    if (!cancel.ok) return;

    // ⚠ Once Safaricom has pushed the prompt, only the customer or the timeout
    //   can end it. We do NOT pretend we recalled it — their handset may still
    //   be showing the prompt, and if they pay it we must honour it.
    expect(cancel.value.supported).toBe(false);
  });
});

/* ================================================================== *
 * 6. THE STALE CART
 * ================================================================== */

describe('⚠ cart revalidation', () => {
  beforeEach(() => resetMockState());

  it('⚠ a price RISE blocks; a price DROP does not', () => {
    const rise: CartChange = {
      kind: 'price_increased',
      variantId: variantId('v1'),
      name: 'Pineapple',
      from: fromMajor(500),
      to: fromMajor(600),
    };
    const drop: CartChange = { ...rise, kind: 'price_decreased', to: fromMajor(400) };

    expect(isBlockingChange(rise)).toBe(true);
    // ⚠ Nobody was ever harmed by paying LESS than they expected.
    expect(isBlockingChange(drop)).toBe(false);

    expect(summariseRevalidation([drop], []).requiresAcknowledgement).toBe(false);
    expect(summariseRevalidation([rise], []).requiresAcknowledgement).toBe(true);
  });

  it('⚠ a SOLD-OUT line blocks the checkout rather than silently shrinking the box', async () => {
    configureMocks({ latencyMs: 0 });
    const a = createMockAdapters();

    const cart = await a.carts.create(null);
    await a.carts.addLine(cart.id, { variantId: variantId('var_pineapple_1l'), quantity: 2 });

    const { __simulateDrift } = await import('../../src/adapters/mock');
    __simulateDrift({ stockChanges: { var_pineapple_1l: 0 } });

    const check = await a.checkout.revalidate(cart.id);

    // ⚠ Shipping a shorter box without saying so is worse than an empty cart.
    expect(check.requiresAcknowledgement).toBe(true);
    expect(check.changes.some((c) => c.kind === 'out_of_stock')).toBe(true);
  });
});

/* ================================================================== *
 * 7. CART PERSISTENCE — hostile input
 * ================================================================== */

describe('⚠ cart persistence treats storage as hostile', () => {
  it('round-trips a good cart', () => {
    const stored = serialiseCart(
      'cart_1' as never,
      [{ variantId: variantId('v1'), quantity: 2, unitPrice: fromMajor(550), bundleId: null }],
      null,
      null
    );
    const r = deserialiseCart(JSON.stringify(stored));
    expect(r.kind).toBe('restored');
    if (r.kind !== 'restored') return;
    expect(toCartLines(r.cart)[0].quantity).toBe(2);
  });

  it('⚠ DISCARDS a cart from an older schema rather than half-reading it', () => {
    const blob = JSON.stringify({ version: CART_SCHEMA_VERSION - 1, cartId: 'c', lines: [] });
    const r = deserialiseCart(blob);
    expect(r.kind).toBe('discarded');
    if (r.kind !== 'discarded') return;
    expect(r.reason.kind).toBe('version_mismatch');
  });

  it('⚠ DISCARDS a hand-edited NEGATIVE quantity', () => {
    // ⚠ This would sail into calculateTotals and produce a NEGATIVE total.
    const blob = JSON.stringify({
      version: CART_SCHEMA_VERSION,
      cartId: 'c',
      savedAt: new Date().toISOString(),
      lines: [{ variantId: 'v1', quantity: -5, unitPriceMinor: 55000, currency: 'KES', bundleId: null }],
    });
    expect(deserialiseCart(blob).kind).toBe('discarded');
  });

  it('⚠ DISCARDS a FLOAT price — money is integer minor units', () => {
    const blob = JSON.stringify({
      version: CART_SCHEMA_VERSION,
      cartId: 'c',
      savedAt: new Date().toISOString(),
      lines: [{ variantId: 'v1', quantity: 1, unitPriceMinor: 550.55, currency: 'KES', bundleId: null }],
    });
    expect(deserialiseCart(blob).kind).toBe('discarded');
  });

  it('discards a cart older than the max age', () => {
    const old = new Date(Date.now() - CART_MAX_AGE_MS - 1000).toISOString();
    const blob = JSON.stringify({
      version: CART_SCHEMA_VERSION,
      cartId: 'c',
      savedAt: old,
      lines: [],
    });
    const r = deserialiseCart(blob);
    expect(r.kind).toBe('discarded');
    if (r.kind !== 'discarded') return;
    expect(r.reason.kind).toBe('expired');
  });

  it('survives outright garbage', () => {
    expect(deserialiseCart('{{{').kind).toBe('discarded');
    expect(deserialiseCart(null).kind).toBe('discarded');
    expect(deserialiseCart('"a string"').kind).toBe('discarded');
  });
});

/* ================================================================== *
 * 8. CHECKOUT VALIDATION
 * ================================================================== */

describe('checkout validation', () => {
  const valid = {
    contact: { fullName: 'Wanjiku Kamau', phone: '0712345678', createAccount: false },
    fulfilment: {
      method: 'delivery' as const,
      address: {
        recipientName: 'Wanjiku Kamau',
        recipientPhone: '0712345678',
        zoneId: 'zone_1',
        estate: 'Kileleshwa',
        building: 'Riverside Apartments, Block C',
        landmark: 'Opposite the Total petrol station',
      },
    },
    paymentMethod: 'mpesa' as const,
    acceptedTerms: true as const,
  };

  it('accepts a well-formed Kenyan checkout', () => {
    const r = validateCheckout(valid);
    expect(r.ok).toBe(true);
  });

  it('⚠ NORMALISES the phone to the shape Daraja demands', () => {
    const r = checkoutSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (!r.success) return;
    // ⚠ A wrongly-normalised number sends the STK push to the wrong handset.
    expect(r.data.contact.phone).toBe('254712345678');
  });

  it.each([
    ['+254712345678', '254712345678'],
    ['0712 345 678', '254712345678'],
    ['254712345678', '254712345678'],
    ['0112345678', '254112345678'],
  ])('normalises %s → %s', (input, expected) => {
    const r = normalisePhone(input);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(expected);
  });

  it('⚠ REJECTS a UK number — this would push to a stranger', () => {
    const r = validateCheckout({
      ...valid,
      contact: { ...valid.contact, phone: '+447911123456' },
    });
    expect(r.ok).toBe(false);
  });

  it('⚠ REQUIRES a landmark — a rider cannot navigate without one', () => {
    const r = validateCheckout({
      ...valid,
      fulfilment: {
        ...valid.fulfilment,
        address: { ...valid.fulfilment.address, landmark: '' },
      },
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.some((e) => e.field.includes('landmark'))).toBe(true);
  });

  it('⚠ terms must be ACTIVELY accepted — never pre-ticked', () => {
    const r = validateCheckout({ ...valid, acceptedTerms: false });
    expect(r.ok).toBe(false);
  });

  it('email is OPTIONAL — phone is the identity in this market', () => {
    expect(validateCheckout(valid).ok).toBe(true); // no email supplied
  });

  /** ⚠ Two layers, because the React-state layer WILL leak on a slow handset. */
  it('⚠ the submission guard forbids a second submit while one is in flight', () => {
    expect(canSubmit({ kind: 'idle' })).toBe(true);
    expect(canSubmit({ kind: 'submitting', idempotencyKey: 'k' })).toBe(false);
    expect(canSubmit({ kind: 'awaiting_payment', providerRef: 'r', paymentId: 'p' })).toBe(false);
    expect(isBusy({ kind: 'awaiting_payment', providerRef: 'r', paymentId: 'p' })).toBe(true);

    // A genuinely failed payment CAN be retried.
    expect(canSubmit({ kind: 'failed', reason: 'wrong pin', retryable: true })).toBe(true);
  });

  it('a checkout session expires', () => {
    const past = {
      id: 's',
      cartId: 'c',
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      reservationIds: [],
    };
    expect(isExpired(past)).toBe(true);
    expect(CHECKOUT_TTL_MS).toBeGreaterThan(0);
  });
});

/* ================================================================== *
 * 9. DELIVERY — ⛔ D-21/22/23
 * ================================================================== */

describe('⛔ delivery rules', () => {
  it('⛔ ships with ZERO invented Nairobi zones', () => {
    // ⚠ This test exists to FAIL the day someone types "Westlands, KES 200".
    //   A fee we invented is a fee the business never agreed to. [NN-05]
    expect(EMPTY_DELIVERY_CONFIG.zones).toHaveLength(0);
    expect(hasZones(EMPTY_DELIVERY_CONFIG)).toBe(false);
    expect(EMPTY_DELIVERY_CONFIG.freeDeliveryThreshold).toBeNull(); // ⛔ D-25
    expect(isPickupOffered(EMPTY_DELIVERY_CONFIG)).toBe(false); // ⛔ D-26
  });

  const lines = [
    { variantId: variantId('v1'), quantity: 2, unitPrice: fromMajor(550), bundleId: null },
  ];

  const config: DeliveryConfig = {
    ...EMPTY_DELIVERY_CONFIG,
    zones: [
      {
        id: zoneId('z_test'),
        name: 'Test Zone',
        areas: ['Testville'],
        fee: fromMajor(200),
        leadTime: 'Next day',
        minimumOrder: null,
        active: true,
      },
      {
        id: zoneId('z_blocked'),
        name: 'Blocked Zone',
        areas: [],
        // ⛔ The zone exists but its FEE has not been supplied.
        fee: unavailable('D-22', 'fee not supplied'),
        leadTime: unavailable('D-23', 'lead time not supplied'),
        minimumOrder: null,
        active: true,
      },
    ],
  };

  it('quotes a fee for a configured zone', () => {
    const r = quoteDelivery(config, zoneId('z_test'), lines, fromMajor(1100));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.fee.amount).toBe(20000);
  });

  it('⚠ REFUSES to quote a zone whose fee is unknown — it never defaults to ZERO', () => {
    const r = quoteDelivery(config, zoneId('z_blocked'), lines, fromMajor(1100));
    expect(r.ok).toBe(false);
    if (r.ok) return;

    // ⚠ Rendering "KES 0" for an unknown fee is an invented commercial claim,
    //   and the customer would be charged the real fee at the door.
    expect(r.error.kind).toBe('fee_unavailable');
    if (r.error.kind !== 'fee_unavailable') return;
    expect(r.error.blockedBy).toBe('D-22');
  });

  it('an unserved area is a KIND state, not an error', () => {
    const r = quoteDelivery(config, zoneId('z_nairobi_west'), lines, fromMajor(1100));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.kind).toBe('zone_not_served');
  });

  it('waives the fee above a free-delivery threshold', () => {
    const withThreshold = { ...config, freeDeliveryThreshold: fromMajor(1000) };
    const r = quoteDelivery(withThreshold, zoneId('z_test'), lines, fromMajor(1100));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.waived).toBe(true);
    expect(r.value.fee.amount).toBe(0);
  });

  it('⛔ with NO threshold rule, `amountToFreeDelivery` is null — not "already free"', () => {
    // ⚠ These are different things and must not be conflated.
    expect(amountToFreeDelivery(config, fromMajor(50))).toBeNull(); // no rule (D-25)
  });

  it('rejects an empty cart', () => {
    const r = quoteDelivery(config, zoneId('z_test'), [], money(0));
    expect(r.ok).toBe(false);
  });
});
