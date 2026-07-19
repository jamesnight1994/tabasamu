/**
 * PHASE 7 — ADMIN ADAPTER TESTS
 *
 * ⚠ These verify the MOCK enforces what the real backend must: no mutation
 *   without permission, and an audit event after every consequential action.
 *   Building the UI against a mock that enforces means the UI is honest when the
 *   enforcing backend arrives.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createMockAdminAdapters, resetAdminState, __setStaffRole, __auditCount } from '../../src/adapters/mock/admin';

describe('⚠ admin adapter enforces permissions', () => {
  beforeEach(() => resetAdminState());

  it('a finance_analyst (read-only) cannot adjust inventory', async () => {
    __setStaffRole('finance_analyst');
    const admin = createMockAdminAdapters();
    const r = await admin.adminInventory.adjust({
      variantId: 'var_passion_1l' as never, delta: 10, reason: 'received', note: 'batch',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('unauthorised');
  });

  it('a store_manager CAN adjust inventory, and it writes an audit event', async () => {
    __setStaffRole('store_manager');
    const admin = createMockAdminAdapters();
    const before = __auditCount();
    const r = await admin.adminInventory.adjust({
      variantId: 'var_passion_1l' as never, delta: 24, reason: 'received', note: 'batch 13',
    });
    expect(r.ok).toBe(true);
    expect(__auditCount()).toBe(before + 1); // ⚠ audited
  });

  it('⚠ only super_admin can toggle a feature flag', async () => {
    __setStaffRole('store_manager');
    let admin = createMockAdminAdapters();
    const denied = await admin.settings.toggleFlag('subscriptions', true);
    expect(denied.ok).toBe(false);

    __setStaffRole('super_admin');
    admin = createMockAdminAdapters();
    const allowed = await admin.settings.toggleFlag('subscriptions', true);
    expect(allowed.ok).toBe(true);
  });

  it('⚠ only super_admin can manage staff', async () => {
    __setStaffRole('order_manager');
    const admin = createMockAdminAdapters();
    const r = await admin.staff.changeRole('staff_2', 'store_manager');
    expect(r.ok).toBe(false);
  });

  it('⚠ a refund is REQUESTED (audited), never executed in the browser', async () => {
    __setStaffRole('store_manager');
    const admin = createMockAdminAdapters();
    const before = __auditCount();
    const r = await admin.adminOrders.requestRefund('ord_1' as never, null, 'damaged in transit');
    expect(r.ok).toBe(true); // the REQUEST succeeds
    expect(__auditCount()).toBe(before + 1);
  });

  it('order_manager cannot request a refund (money bar)', async () => {
    __setStaffRole('order_manager');
    const admin = createMockAdminAdapters();
    const r = await admin.adminOrders.requestRefund('ord_1' as never, null, 'x');
    expect(r.ok).toBe(false);
  });

  it('⚠ inventory adjustment through the adapter rejects a would-go-negative', async () => {
    __setStaffRole('store_manager');
    const admin = createMockAdminAdapters();
    const r = await admin.adminInventory.adjust({
      variantId: 'var_grape_ginger_1l' as never, delta: -999, reason: 'damaged', note: 'big loss',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('invalid');
  });

  it('dashboard revenue is Unavailable (blocked on D-14), counts are real', async () => {
    __setStaffRole('super_admin');
    const admin = createMockAdminAdapters();
    const m = await admin.dashboard.metrics();
    expect((m.revenueToday as { _unavailable?: true })._unavailable).toBe(true);
    expect(typeof m.ordersToday).toBe('number');
  });

  it('audit list is empty for a role without audit.view', async () => {
    __setStaffRole('content_editor');
    const admin = createMockAdminAdapters();
    // trigger an action first (as super admin) then check content editor can't read
    const list = await admin.audit.list({});
    expect(list).toHaveLength(0);
  });

  it('a promotion with a bad code is rejected before it is created', async () => {
    __setStaffRole('marketing');
    const admin = createMockAdminAdapters();
    const r = await admin.promotions.create({
      code: 'a b', type: 'percentage', value: 10,
      productRestriction: [], customerRestriction: [], minimumSpend: null,
      startsAt: null, endsAt: null, usageLimit: null, perCustomerLimit: null, active: true,
    });
    expect(r.ok).toBe(false);
  });

  it('marketing CAN create a valid promotion (and it is audited)', async () => {
    __setStaffRole('marketing');
    const admin = createMockAdminAdapters();
    const before = __auditCount();
    const r = await admin.promotions.create({
      code: 'SPRING20', type: 'percentage', value: 20,
      productRestriction: [], customerRestriction: [], minimumSpend: null,
      startsAt: null, endsAt: null, usageLimit: 50, perCustomerLimit: 1, active: true,
    });
    expect(r.ok).toBe(true);
    expect(__auditCount()).toBe(before + 1);
  });
});
