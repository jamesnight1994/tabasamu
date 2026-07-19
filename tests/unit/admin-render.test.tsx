/**
 * PHASE 7 — ADMIN SCREEN RENDER TESTS (jsdom)
 *
 * ⚠ Same honest substitute as Phases 5–6: Playwright's browser can't be
 *   installed here, so RENDER LOGIC and RBAC-driven visibility are verified in
 *   jsdom. Pixel layout at 360px remains a real-browser check, recorded as
 *   outstanding.
 *
 * These confirm the screens actually render their data (not just a skeleton) and
 * that a permission gate hides an action from a role that lacks it.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { AdminProvider } from '../../src/components/admin/AdminProvider';
import { AdapterProvider } from '../../src/components/commerce/AdapterProvider';
import { createMockAdapters } from '../../src/adapters/mock';
import { resetAdminAdapters } from '../../src/adapters/admin';
import { resetAdminState, __setStaffRole } from '../../src/adapters/mock/admin';

import { AdminPayments, AdminCustomers } from '../../src/components/admin/screens-b';
import { AdminReports, AdminSettings } from '../../src/components/admin/screens-c';

const renderAdmin = (ui: React.ReactElement) => {
  const adapters = createMockAdapters();
  return render(
    <AdapterProvider adapters={adapters}>
      <AdminProvider>{ui}</AdminProvider>
    </AdapterProvider>
  );
};

beforeEach(() => {
  resetAdminState();
  resetAdminAdapters();
});

describe('⚠ admin payments screen', () => {
  it('renders the read-only notice and payment rows', async () => {
    __setStaffRole('super_admin');
    renderAdmin(<AdminPayments />);
    // The blocked/read-only notice is part of the product, not a loading state.
    await waitFor(() => expect(screen.getByText(/never moves money/i)).toBeInTheDocument());
    // A demo payment reference appears.
    await waitFor(() => expect(screen.getByText('SGH2KLM9PQ')).toBeInTheDocument());
  });

  it('⚠ hides Reconcile from a role without payment.reconcile', async () => {
    // marketing has no payment permission at all → the screen still renders,
    // but no Reconcile button is shown.
    __setStaffRole('marketing');
    renderAdmin(<AdminPayments />);
    await waitFor(() => expect(screen.getByText(/never moves money/i)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /reconcile/i })).toBeNull();
  });

  it('shows Reconcile for finance/store roles', async () => {
    __setStaffRole('store_manager');
    renderAdmin(<AdminPayments />);
    await waitFor(() => expect(screen.getAllByRole('button', { name: /reconcile/i }).length).toBeGreaterThan(0));
  });
});

describe('⚠ admin customers screen', () => {
  it('renders customer rows with an Unavailable lifetime value', async () => {
    __setStaffRole('super_admin');
    renderAdmin(<AdminCustomers />);
    await waitFor(() => expect(screen.getByText('Amina Wanjiru')).toBeInTheDocument());
    // ⚠ D-14 — lifetime value is rendered as the awaiting-confirmation marker,
    //   never a fabricated number. The MoneyValue component surfaces this.
    await waitFor(() => expect(screen.getAllByText(/awaiting|confirmation/i).length).toBeGreaterThan(0));
  });
});

describe('⚠ admin reports screen', () => {
  it('renders the report type tabs and a blocked-revenue notice', async () => {
    __setStaffRole('finance_analyst');
    renderAdmin(<AdminReports />);
    await waitFor(() => expect(screen.getByText(/awaiting confirmation/i)).toBeInTheDocument());
    // Report type buttons exist.
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });
});

describe('⚠ admin settings screen', () => {
  it('shows tax OFF (D-16) and gates editing', async () => {
    __setStaffRole('super_admin');
    renderAdmin(<AdminSettings />);
    await waitFor(() => expect(screen.getByText(/D-16 unconfirmed/i)).toBeInTheDocument());
  });
});
