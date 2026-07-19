/**
 * PHASE 5 — USER FLOW TESTS
 *
 * ⚠ WHY THESE RUN IN JSDOM AND NOT A REAL BROWSER.
 *
 *   Playwright's browser binary cannot be downloaded in this sandbox (the egress
 *   proxy blocks it). Rather than SKIP the flow verification — or, worse, claim
 *   in the report that flows were "tested" when they were not — the same journeys
 *   are driven through jsdom with Testing Library.
 *
 *   ⚠ THIS IS AN HONEST SUBSTITUTE, NOT AN EQUIVALENT. jsdom does not lay out a
 *     page, so it cannot catch a horizontal overflow at 360px or a mis-sized
 *     touch target. Those checks REMAIN OUTSTANDING and are recorded as such in
 *     the Phase 5 report. What jsdom CAN verify is the logic — and the logic is
 *     where the money is.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CartProvider, useCart } from '../../src/components/commerce/CartProvider';
import { createMockAdapters, configureMocks, resetMockState } from '../../src/adapters/mock';
import { viewFor } from '../../src/components/commerce/PaymentStatus';
import { PENDING_WINDOW_MS } from '../../src/domain/payment';
import { newIdempotencyKey } from '../../src/domain/payment/contracts';
import { fromMajor, variantId } from '../../src/domain/shared';
import { CART_STORAGE_KEY } from '../../src/domain/cart';
import type { Adapters } from '../../src/ports';

/* ================================================================== *
 * Harness
 * ================================================================== */

function CartProbe() {
  const { itemCount, lines, totals, isEmpty, hydrating, addItem, setQuantity, removeItem } =
    useCart();

  return (
    <div>
      <span data-testid="count">{itemCount}</span>
      <span data-testid="empty">{String(isEmpty)}</span>
      <span data-testid="hydrating">{String(hydrating)}</span>
      <span data-testid="subtotal">{totals.subtotal.amount}</span>
      <span data-testid="lines">{lines.length}</span>

      <button onClick={() => addItem(variantId('var_pineapple_1l'), fromMajor(550), 1)}>
        add
      </button>
      <button onClick={() => setQuantity(variantId('var_pineapple_1l'), 5)}>set5</button>
      <button onClick={() => removeItem(variantId('var_pineapple_1l'))}>remove</button>
    </div>
  );
}

const renderCart = (adapters: Adapters) =>
  render(
    <CartProvider adapters={adapters}>
      <CartProbe />
    </CartProvider>
  );

/* ================================================================== *
 * Cart flows
 * ================================================================== */

describe('cart flows', () => {
  beforeEach(() => {
    resetMockState();
    configureMocks({ latencyMs: 0 });
    window.localStorage.clear();
  });

  it('adds an item and reflects it in the header count', async () => {
    const user = userEvent.setup();
    renderCart(createMockAdapters());

    await waitFor(() => expect(screen.getByTestId('hydrating')).toHaveTextContent('false'));
    expect(screen.getByTestId('empty')).toHaveTextContent('true');

    await user.click(screen.getByText('add'));

    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('55000'); // integer minor units
  });

  it('merges a repeat add rather than creating a second line', async () => {
    const user = userEvent.setup();
    renderCart(createMockAdapters());
    await waitFor(() => expect(screen.getByTestId('hydrating')).toHaveTextContent('false'));

    await user.click(screen.getByText('add'));
    await user.click(screen.getByText('add'));

    // ⚠ ONE line, quantity 2 — not two lines of the same product.
    expect(screen.getByTestId('lines')).toHaveTextContent('1');
    expect(screen.getByTestId('count')).toHaveTextContent('2');
  });

  it('updates quantity and removes', async () => {
    const user = userEvent.setup();
    renderCart(createMockAdapters());
    await waitFor(() => expect(screen.getByTestId('hydrating')).toHaveTextContent('false'));

    await user.click(screen.getByText('add'));
    await user.click(screen.getByText('set5'));
    expect(screen.getByTestId('count')).toHaveTextContent('5');

    await user.click(screen.getByText('remove'));
    expect(screen.getByTestId('empty')).toHaveTextContent('true');
  });

  /**
   * ⚠ THE RELOAD TEST.
   *
   *   A Nairobi customer WILL lose the tab — Android kills backgrounded apps to
   *   reclaim memory, and the connection drops. If the cart dies with the tab,
   *   the sale dies with it.
   */
  it('⚠ SURVIVES a page reload', async () => {
    const user = userEvent.setup();
    const { unmount } = renderCart(createMockAdapters());

    await waitFor(() => expect(screen.getByTestId('hydrating')).toHaveTextContent('false'));
    await user.click(screen.getByText('add'));
    await user.click(screen.getByText('add'));

    // The persist effect writes on the next tick.
    await waitFor(() =>
      expect(window.localStorage.getItem(CART_STORAGE_KEY)).toBeTruthy()
    );

    unmount(); // ⚠ the tab dies

    // ⚠ A brand-new tree, as after a reload.
    renderCart(createMockAdapters());

    await waitFor(() => expect(screen.getByTestId('hydrating')).toHaveTextContent('false'));
    // The box is still there, with both bottles.
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('2'));
  });

  it('⚠ a CORRUPT stored cart yields an empty cart, not a crash', async () => {
    // ⚠ A negative quantity would otherwise produce a NEGATIVE total.
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        cartId: 'c',
        savedAt: new Date().toISOString(),
        lines: [
          { variantId: 'v', quantity: -9, unitPriceMinor: 100, currency: 'KES', bundleId: null },
        ],
      })
    );

    renderCart(createMockAdapters());

    await waitFor(() => expect(screen.getByTestId('hydrating')).toHaveTextContent('false'));
    // Discarded wholesale. The storefront still renders.
    expect(screen.getByTestId('empty')).toHaveTextContent('true');
  });

  it('⚠ survives localStorage throwing (Safari private mode)', async () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    renderCart(createMockAdapters());

    // ⚠ An unhandled throw here would take down the ENTIRE storefront on load,
    //   for a feature as optional as restoring a cart.
    await waitFor(() => expect(screen.getByTestId('hydrating')).toHaveTextContent('false'));
    expect(screen.getByTestId('empty')).toHaveTextContent('true');

    spy.mockRestore();
  });

  /**
   * ⛔ D-21/22/23 — THE TOTAL IS `Unavailable`, NOT ZERO.
   *
   *   With no zone configured, the delivery fee is unknown. The total must
   *   therefore be unknown too. A total that silently equals the subtotal is a
   *   quoted price that omits delivery — and the customer finds out at the door.
   */
  it('⛔ the TOTAL is Unavailable while no delivery zone exists', async () => {
    const user = userEvent.setup();

    function TotalProbe() {
      const { totals, addItem } = useCart();
      const t = totals.total as { _unavailable?: true; blockedBy?: string };
      return (
        <div>
          <span data-testid="total-blocked">{String(t._unavailable === true)}</span>
          <span data-testid="total-blocker">{t.blockedBy ?? ''}</span>
          <button onClick={() => addItem(variantId('v'), fromMajor(550), 1)}>add</button>
        </div>
      );
    }

    render(
      <CartProvider adapters={createMockAdapters()}>
        <TotalProbe />
      </CartProvider>
    );

    await user.click(screen.getByText('add'));

    // ⚠ NOT a number. Not KES 0. Explicitly "we do not know yet".
    expect(screen.getByTestId('total-blocked')).toHaveTextContent('true');
  });
});

/* ================================================================== *
 * Payment view resolution — the three outcomes
 * ================================================================== */

describe('⚠ payment view resolution', () => {
  it('shows "check your phone" while the customer is holding it', () => {
    expect(viewFor('pending', 5_000, null, null).kind).toBe('awaiting_pin');
  });

  it('shows success only on a SERVER-CONFIRMED success', () => {
    const v = viewFor('succeeded', 10_000, 'SFF6VXQ8LR', null);
    expect(v.kind).toBe('succeeded');
    if (v.kind === 'succeeded') expect(v.transactionRef).toBe('SFF6VXQ8LR');
  });

  it('⚠ a TIMED-OUT pending payment resolves to `unknown` — NEVER `failed`', () => {
    // ⚠ The single most important line in the payment UI.
    //   The money may have left their account. Saying "failed" invites a second
    //   payment and destroys trust permanently. [R-10, F-58]
    const v = viewFor('pending', PENDING_WINDOW_MS + 1, null, null);
    expect(v.kind).toBe('unknown');
    expect(v.kind).not.toBe('failed');
  });

  it('an explicit provider failure IS a failure', () => {
    const v = viewFor('failed', 5_000, null, 'Wrong M-PESA PIN entered');
    expect(v.kind).toBe('failed');
  });
});

/* ================================================================== *
 * The double-click
 * ================================================================== */

describe('⚠ double submission', () => {
  it('⚠ two concurrent initiates with ONE key produce ONE payment', async () => {
    resetMockState();
    configureMocks({ latencyMs: 5, pinDelayMs: 0, forcePaymentOutcome: 'success' });
    const adapters = createMockAdapters();

    const key = newIdempotencyKey();
    const req = {
      orderId: 'ord_1' as never,
      amount: fromMajor(550),
      provider: 'mpesa' as const,
      phone: '254712345678' as never,
      idempotencyKey: key,
    };

    // ⚠ THE DOUBLE-TAP. Both fire before either resolves.
    const [a, b] = await Promise.all([
      adapters.payments.initiate(req),
      adapters.payments.initiate(req),
    ]);

    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;

    // ⚠ ONE STK push. The customer's phone buzzes ONCE.
    expect(b.value.paymentId).toBe(a.value.paymentId);
    expect(b.value.replayed).toBe(true);
  });
});
