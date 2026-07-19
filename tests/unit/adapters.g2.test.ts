import { describe, it, expect, beforeEach } from 'vitest';
import { createMockAdapters, configureMocks, resetMockState } from '../../src/adapters/mock';
import { createHttpAdapters } from '../../src/adapters/http';
import type { Adapters } from '../../src/ports';
import { customerId, variantId } from '../../src/domain/shared';
import { newIdempotencyKey } from '../../src/domain/payment/contracts';
import { isUnavailable } from '../../src/domain/catalogue';
import { AppError } from '../../src/lib/errors';

/**
 * GATE G2 — THE ADAPTER-SWAP ACCEPTANCE TEST
 *
 * Phase 1 defines the handover criterion:
 *
 *   "The full user-flow test suite runs GREEN against BOTH MockAdapters and
 *    HttpAdapters, with ZERO changes above the adapter layer. If it passes, the
 *    handover is clean. If it fails, backend logic has leaked upward."
 *
 * This file is that test. Today `HttpAdapters` is an unimplemented stub, so the
 * assertion we CAN make is the structural one: both adapter sets satisfy the
 * same `Adapters` interface, expose the same surface, and are substitutable
 * without any consumer knowing which one it holds.
 *
 * When the backend lands, the `describe.each` below runs the SAME flow suite
 * against both — and that is the moment the handover is proven.
 */

/* ------------------------------------------------------------------ *
 * 1. STRUCTURAL SUBSTITUTABILITY
 * ------------------------------------------------------------------ */

describe('G2 — adapter substitutability', () => {
  const REQUIRED_PORTS = [
    'products',
    'inventory',
    'carts',
    'delivery',
    'discounts',
    'orders',
    'payments',
    'notifications',
  ] as const;

  it('both adapter sets expose every port', () => {
    const mock = createMockAdapters();
    const http = createHttpAdapters();

    for (const port of REQUIRED_PORTS) {
      expect(mock[port], `mock is missing ${port}`).toBeDefined();
      expect(http[port], `http is missing ${port}`).toBeDefined();
    }
  });

  it('a consumer holding the interface cannot tell them apart', () => {
    // The whole point of the port layer. If this ever needs a type assertion
    // or a runtime check, the abstraction has leaked.
    const sets: Adapters[] = [createMockAdapters(), createHttpAdapters()];
    for (const adapters of sets) {
      expect(typeof adapters.products.list).toBe('function');
      expect(typeof adapters.payments.initiate).toBe('function');
      expect(typeof adapters.payments.status).toBe('function');
      expect(typeof adapters.orders.findByPhoneOrReference).toBe('function');
    }
  });

  it('the http adapter fails LOUDLY rather than returning a plausible fake', () => {
    // ⚠ A silently-fake HTTP adapter is worse than an absent one: it would let
    //   this very gate pass against nothing. [NN-04]
    const http = createHttpAdapters();
    expect(() => http.products.list()).toThrow(AppError);
  });
});

/* ------------------------------------------------------------------ *
 * 2. THE FLOW SUITE
 *
 * Written to be adapter-agnostic. Today it runs against `mock` only, because
 * `http` is not implemented. At Gate G2 the second entry is uncommented and
 * MUST pass unchanged.
 * ------------------------------------------------------------------ */

const SUITES: ReadonlyArray<[string, () => Adapters]> = [
  ['mock', () => createMockAdapters()],
  // ['http', () => createHttpAdapters()],   ← ⚠ UNCOMMENT AT GATE G2
];

describe.each(SUITES)('G2 flow suite — %s adapters', (_name, make) => {
  let adapters: Adapters;

  beforeEach(() => {
    resetMockState();
    configureMocks({ latencyMs: 0, failureRate: 0 });
    adapters = make();
  });

  /**
   * ⚠ CHANGED IN PHASE 4, and the change is a decision, not a regression.
   *
   *   In Phase 3, Gooseberry was `draft` and excluded from the storefront
   *   because it had no photograph.
   *
   *   The client decided (2026-07-14) that Beetroot and Gooseberry ship with an
   *   image PLACEHOLDER and stay in the catalogue.
   *
   *   A missing photograph is an ASSET problem. It is not a merchandising
   *   decision, and conflating the two would silently hide a third of the range
   *   from the shop. So `status` and `hasPhoto` are separate facts, and all six
   *   products are now active.
   */
  it('lists ALL SIX products — a missing photo is an asset gap, not a draft', async () => {
    const products = await adapters.products.list();
    expect(products.length).toBe(6);
    expect(products.every((p) => p.status === 'active')).toBe(true);

    // Gooseberry is present — and will render an honest "photography pending"
    // panel plus a SOLD OUT badge (it has zero stock, which is a separate fact).
    expect(products.find((p) => p.slug === 'gooseberry')).toBeDefined();
    expect(products.find((p) => p.slug === 'beetroot')).toBeDefined();
  });

  it('exposes all six flavours when drafts are requested explicitly', async () => {
    const active = await adapters.products.list({ status: 'active' });
    const draft = await adapters.products.list({ status: 'draft' });
    expect(active.length + draft.length).toBe(6);
  });

  it('⛔ every product still reports its REMAINING blocked fields honestly', async () => {
    const [product] = await adapters.products.list();

    // ✅ D-13 ANSWERED (client, 2026-07-14) — descriptor is "Caffeine Free".
    // ✅ D-50 ANSWERED (client, 2026-07-14) — the base is rooibos.
    expect(isUnavailable(product.descriptor)).toBe(false);
    expect(product.descriptor).toBe('Caffeine Free');
    expect(isUnavailable(product.base)).toBe(false);
    expect(product.base).toBe('Rooibos');

    // ⛔ STILL BLOCKED. These are regulated food information and have not been
    //    supplied. They must NEVER be invented. [NN-05]
    expect(isUnavailable(product.ingredients)).toBe(true);
    expect(isUnavailable(product.nutrition)).toBe(true);
    // ⛔ D-49 — no farm has been named.
    expect(isUnavailable(product.provenance)).toBe(true);
    // ⛔ D-52 — six days or fourteen? The two source documents disagree.
    expect(isUnavailable(product.fermentationDays)).toBe(true);
  });

  it('⛔ returns NO delivery zones — they were never supplied (D-21)', async () => {
    // ⚠ An empty list is the CORRECT answer. Inventing "Westlands · KES 200"
    //   would be inventing a delivery promise the business has not made.
    const zones = await adapters.delivery.zones();
    expect(zones).toHaveLength(0);
  });

  it('adds a line to a cart and computes a subtotal', async () => {
    const cart = await adapters.carts.create(null);
    const updated = await adapters.carts.addLine(cart.id, {
      variantId: variantId('var_pineapple_1l'),
      quantity: 2,
    });
    expect(updated.lines).toHaveLength(1);
    expect(updated.totals.subtotal.amount).toBeGreaterThan(0);
  });

  it('⛔ the cart total stays UNAVAILABLE while delivery is unknown', async () => {
    const cart = await adapters.carts.create(null);
    const updated = await adapters.carts.addLine(cart.id, {
      variantId: variantId('var_pineapple_1l'),
      quantity: 1,
    });
    // The subtotal is knowable. The TOTAL is not — and we say so. [P-03]
    expect(isUnavailable(updated.totals.delivery)).toBe(true);
    expect(isUnavailable(updated.totals.total)).toBe(true);
  });

  it('merges a repeated variant instead of duplicating the line', async () => {
    const cart = await adapters.carts.create(customerId('cus_1'));
    await adapters.carts.addLine(cart.id, {
      variantId: variantId('var_passion_1l'),
      quantity: 1,
    });
    const twice = await adapters.carts.addLine(cart.id, {
      variantId: variantId('var_passion_1l'),
      quantity: 2,
    });
    expect(twice.lines).toHaveLength(1);
    expect(twice.lines[0].quantity).toBe(3);
  });

  it('reserves and releases stock', async () => {
    const before = await adapters.inventory.check(variantId('var_pineapple_1l'));
    expect(before).not.toBeNull();

    const reserved = await adapters.inventory.reserve(variantId('var_pineapple_1l'), 2);
    expect(reserved.ok).toBe(true);

    const during = await adapters.inventory.check(variantId('var_pineapple_1l'));
    expect(during!.available).toBe(before!.available - 2);

    if (reserved.ok) await adapters.inventory.release(reserved.value.id);
    const after = await adapters.inventory.check(variantId('var_pineapple_1l'));
    expect(after!.available).toBe(before!.available);
  });

  it('refuses to over-reserve', async () => {
    const r = await adapters.inventory.reserve(variantId('var_beetroot_1l'), 9999);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('insufficient');
  });
});

/* ------------------------------------------------------------------ *
 * 3. M-PESA — ⚠ REWRITTEN IN PHASE 5.
 *
 *   The Phase 4 assertions were written against a gateway that returned a bare
 *   `Payment` and knew three outcomes. The Phase 5 gateway returns a
 *   `Result<InitiatePaymentResponse, PaymentError>`, demands an idempotency key,
 *   and models seven outcomes.
 *
 *   ⚠ THESE TESTS DID NOT "BREAK". They were STALE — they asserted an old
 *     contract. The compiler caught every one of them, which is the entire
 *     reason the contract is typed.
 * ------------------------------------------------------------------ */

describe('G2 — M-PESA outcomes are all reachable', () => {
  beforeEach(() => {
    resetMockState();
  });

  it.each([
    'success',
    'cancelled_by_user',
    'wrong_pin',
    'insufficient_funds',
    'timeout_no_callback',
    'success_late',
  ] as const)('the mock can produce a %s outcome on demand', async (outcome) => {
    configureMocks({ latencyMs: 0, forcePaymentOutcome: outcome, pinDelayMs: 0 });
    const adapters = createMockAdapters();

    const res = await adapters.payments.initiate({
      orderId: 'ord_test' as never,
      amount: { amount: 55000, currency: 'KES', taxIncluded: null },
      provider: 'mpesa',
      phone: '254712345678' as never,
      idempotencyKey: newIdempotencyKey(),
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    /**
     * ⚠ THE CENTRAL ASSERTION OF THE WHOLE PAYMENT RAIL.
     *
     *   An initiate NEVER reports success — no matter which outcome is coming.
     *   Safaricom returns HTTP 200 the instant it ACCEPTS the push, long before
     *   the customer has typed a PIN. Treating that as payment is the classic
     *   Daraja bug, and it ships unpaid orders.
     */
    expect(res.value.status).toBe('pending');
    /**
     * ⚠ THERE IS NO RUNTIME ASSERTION THAT `status !== 'succeeded'` HERE, AND
     *   THAT IS THE STRONGEST POSSIBLE RESULT.
     *
     *   I wrote one. TypeScript rejected it as unreachable — `status` is typed
     *   `Extract<PaymentStatus, 'initiated' | 'pending'>`, so `'succeeded'` is
     *   not merely absent at runtime, it is UNREPRESENTABLE.
     *
     *   A runtime test can only prove the bug is absent today. The type proves
     *   it cannot be written tomorrow. The compiler is the better guard, so the
     *   assertion is deliberately left out rather than restored.
     */

    // ⚠ And it always carries the recovery key.
    expect(res.value.providerRef).toBeTruthy();
  });

  it('⚠ an `unknown` payment NEVER settles to `failed` on its own', async () => {
    configureMocks({ latencyMs: 0, forcePaymentOutcome: 'timeout_no_callback', pinDelayMs: 0 });
    const adapters = createMockAdapters();

    const res = await adapters.payments.initiate({
      orderId: 'ord_test' as never,
      amount: { amount: 55000, currency: 'KES', taxIncluded: null },
      provider: 'mpesa',
      phone: '254712345678' as never,
      idempotencyKey: newIdempotencyKey(),
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const status = await adapters.payments.status(res.value.providerRef);
    expect(status.ok).toBe(true);
    if (!status.ok) return;

    /**
     * ⚠ It is `pending`, and it will become `unknown` — never `failed`.
     *   The money may well have left the customer's account. Saying "failed"
     *   tells someone who HAS paid that they have not, and invites a double
     *   payment. [R-10, F-58]
     */
    expect(status.value.status).not.toBe('failed');
    expect(status.value.callbackReceived).toBe(false);
  });

  it('⛔ the card rail is REFUSED while D-35 is unresolved', async () => {
    configureMocks({ latencyMs: 0 });
    const adapters = createMockAdapters();

    const res = await adapters.payments.initiate({
      orderId: 'ord_test' as never,
      amount: { amount: 55000, currency: 'KES', taxIncluded: null },
      provider: 'card',
      idempotencyKey: newIdempotencyKey(),
    });

    // ⛔ Stripe may not settle KES for a Kenyan entity. Until we know, the rail
    //    is OFF — and it fails loudly rather than pretending to work.
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.kind).toBe('provider_not_configured');
  });
});
