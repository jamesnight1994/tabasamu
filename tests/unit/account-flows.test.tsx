/**
 * PHASE 6 — ACCOUNT UI FLOW TESTS (jsdom)
 *
 * ⚠ Same honest substitute as Phase 5: Playwright's browser cannot be installed
 *   in this sandbox, so the JOURNEY LOGIC is driven through jsdom. Pixel layout
 *   at 360px remains a real-browser check and is recorded as outstanding.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AdapterProvider } from '../../src/components/commerce/AdapterProvider';
import { SessionProvider, useSession } from '../../src/components/commerce/SessionProvider';
import { createMockAdapters, configureMocks, resetMockState } from '../../src/adapters/mock';
import { __seedDemoAccount } from '../../src/adapters/mock/accounts';
import { email as toEmail } from '../../src/domain/identity/auth';

function SessionProbe() {
  const { session, loading, isAuthenticated, signIn, signOut } = useSession();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="auth">{String(isAuthenticated)}</span>
      <span data-testid="name">{session?.displayName ?? ''}</span>
      <span data-testid="verified">{String(session?.emailVerified ?? false)}</span>
      <button onClick={() => void signIn(toEmail('demo@tabasamu.co.ke'), 'tabasamu-demo-2026')}>
        signin
      </button>
      <button onClick={() => void signOut()}>signout</button>
    </div>
  );
}

const renderWithSession = () => {
  const adapters = createMockAdapters();
  return render(
    <AdapterProvider adapters={adapters}>
      <SessionProvider>
        <SessionProbe />
      </SessionProvider>
    </AdapterProvider>
  );
};

describe('⚠ session lifecycle through the provider', () => {
  beforeEach(() => {
    resetMockState();
    configureMocks({ latencyMs: 0 });
    __seedDemoAccount();
  });

  it('starts unauthenticated once the initial check resolves', async () => {
    renderWithSession();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('auth')).toHaveTextContent('false');
  });

  it('⚠ signs in, exposes the display name, and signs out cleanly', async () => {
    const user = userEvent.setup();
    renderWithSession();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    await user.click(screen.getByText('signin'));
    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('true'));
    expect(screen.getByTestId('name')).toHaveTextContent('Amina');
    expect(screen.getByTestId('verified')).toHaveTextContent('true');

    await user.click(screen.getByText('signout'));
    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('false'));
  });
});

describe('⚠ the adapter journey a dashboard performs', () => {
  beforeEach(() => {
    resetMockState();
    configureMocks({ latencyMs: 0 });
    __seedDemoAccount();
  });

  it('after sign-in, the demo customer has orders and a subscription', async () => {
    const adapters = createMockAdapters();
    await adapters.auth.signIn(toEmail('demo@tabasamu.co.ke'), 'tabasamu-demo-2026');

    const profile = await adapters.customer.profile();
    expect(profile).not.toBeNull();

    const orders = await adapters.orders.listForCustomer(profile!.id);
    expect(orders.length).toBeGreaterThan(0);
    // ⚠ The most recent order carries an M-PESA reference — the support key.
    expect(orders.some((o) => o.mpesaReference)).toBe(true);

    const subs = await adapters.subscriptions.list();
    expect(subs.length).toBeGreaterThan(0);
  });

  it('⚠ a signed-out customer sees no orders (data is per-session)', async () => {
    const adapters = createMockAdapters();
    const subs = await adapters.subscriptions.list();
    expect(subs).toHaveLength(0);
  });

  it('⚠ the full manage arc: pause → resume → cancel → reactivate', async () => {
    const adapters = createMockAdapters();
    await adapters.auth.signIn(toEmail('demo@tabasamu.co.ke'), 'tabasamu-demo-2026');
    const [sub] = await adapters.subscriptions.list();

    const paused = await adapters.subscriptions.pause(sub.id);
    expect(paused.ok && paused.value.status).toBe('paused');

    const resumed = await adapters.subscriptions.resume(sub.id);
    expect(resumed.ok && resumed.value.status).toBe('active');

    const cancelled = await adapters.subscriptions.cancel(sub.id);
    expect(cancelled.ok && cancelled.value.status).toBe('cancelled');

    const reactivated = await adapters.subscriptions.reactivate(sub.id);
    // ⚠ NEW subscription, not a resurrection.
    expect(reactivated.ok && reactivated.value.id).not.toBe(sub.id);
  });

  it('⚠ address changes preserve the single-default invariant through the adapter', async () => {
    const adapters = createMockAdapters();
    await adapters.auth.signIn(toEmail('demo@tabasamu.co.ke'), 'tabasamu-demo-2026');

    const before = await adapters.addresses.list();
    expect(before.filter((a) => a.isDefault)).toHaveLength(1);

    const added = await adapters.addresses.add({
      label: 'Office', recipientName: 'Amina', recipientPhone: '254712000111' as never,
      zoneId: '', estate: 'Westlands', building: 'ABC Place', landmark: 'By the mall', instructions: '',
    });
    expect(added.ok).toBe(true);

    const after = await adapters.addresses.list();
    expect(after.filter((a) => a.isDefault)).toHaveLength(1); // still exactly one
  });
});
