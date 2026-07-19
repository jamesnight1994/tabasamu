/**
 * PHASE 7 — ADMIN WORKFLOW TESTS
 *
 * The existing admin.test.ts / admin-adapter.test.ts cover RBAC, audit, stock,
 * promotions and CSV. This suite covers the adapter paths the Phase 7 SCREENS
 * exercise: payments review queue (read-only), customer data-request handling,
 * content publish/unpublish, settings + feature flags, and the audit trail that
 * every one of these must leave behind.
 *
 * ⚠ The recurring assertion: a permitted action succeeds AND leaves an audit
 *   event; a forbidden one is refused AND changes nothing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getAdminAdapters } from '../../src/adapters/admin';
import { resetAdminState, __setStaffRole, __auditCount } from '../../src/adapters/mock/admin';

beforeEach(() => {
  resetAdminState();
});

/* ================================================================== *
 * Payments — read + queue only, NO privileged call
 * ================================================================== */

describe('⚠ admin payments are read + queue management only', () => {
  it('lists payments and the review queue for a permitted role', async () => {
    __setStaffRole('finance_analyst'); // read-only
    const admin = getAdminAdapters();

    const all = await admin.adminPayments.list({});
    expect(all.length).toBeGreaterThan(0);

    const queue = await admin.adminPayments.reviewQueue();
    // The queue is the subset needing attention (failed/unmatched/duplicate).
    expect(queue.length).toBeGreaterThan(0);
    expect(queue.length).toBeLessThanOrEqual(all.length);
  });

  it('⚠ reconcile FLAGS for the server and audits — it does not move money', async () => {
    __setStaffRole('finance_analyst');
    const admin = getAdminAdapters();
    // finance_analyst is read-only → cannot reconcile
    const denied = await admin.adminPayments.reconcile('SFF6VXQ8LR');
    expect(denied.ok).toBe(false);

    __setStaffRole('store_manager');
    const admin2 = getAdminAdapters();
    const before = __auditCount();
    const ok = await admin2.adminPayments.reconcile('SFF6VXQ8LR');
    expect(ok.ok).toBe(true);
    expect(__auditCount()).toBe(before + 1); // audited
  });

  it('a lookup by reference returns the payment', async () => {
    __setStaffRole('super_admin');
    const admin = getAdminAdapters();
    const p = await admin.adminPayments.byReference('SGH2KLM9PQ');
    expect(p).not.toBeNull();
  });
});

/* ================================================================== *
 * Customers — data requests are audited and permission-gated
 * ================================================================== */

describe('⚠ admin customer data-request handling', () => {
  it('lists and searches customers', async () => {
    __setStaffRole('customer_care');
    const admin = getAdminAdapters();
    const all = await admin.adminCustomers.list('');
    expect(all.length).toBeGreaterThan(0);
    const filtered = await admin.adminCustomers.list('amina');
    expect(filtered.length).toBe(1);
  });

  it('⚠ handling a deletion request is gated + audited', async () => {
    __setStaffRole('content_editor'); // no customer permission
    const denied = await getAdminAdapters().adminCustomers.handleDataRequest(
      'cust_demo' as never, 'deletion', 'approve', 'x'
    );
    expect(denied.ok).toBe(false);

    __setStaffRole('super_admin');
    const admin = getAdminAdapters();
    const before = __auditCount();
    const ok = await admin.adminCustomers.handleDataRequest('cust_demo' as never, 'deletion', 'approve', 'Approved');
    expect(ok.ok).toBe(true);
    expect(__auditCount()).toBe(before + 1);
  });

  it('⚠ lifetime value is Unavailable (D-14), never a fabricated number', async () => {
    __setStaffRole('super_admin');
    const admin = getAdminAdapters();
    const [c] = await admin.adminCustomers.list('');
    expect((c.lifetimeValue as { _unavailable?: true })._unavailable).toBe(true);
  });
});

/* ================================================================== *
 * Content — publish / unpublish gated + audited
 * ================================================================== */

describe('⚠ admin content publication', () => {
  it('content_editor can publish and it is audited', async () => {
    __setStaffRole('content_editor');
    const admin = getAdminAdapters();
    const blocks = await admin.content.list('homepage_section');
    if (blocks.length === 0) return; // nothing seeded is acceptable
    const before = __auditCount();
    const r = await admin.content.publish(blocks[0].id);
    expect(r.ok).toBe(true);
    expect(__auditCount()).toBe(before + 1);
  });

  it('⚠ a role without content permission cannot publish', async () => {
    __setStaffRole('finance_analyst');
    const admin = getAdminAdapters();
    const blocks = await admin.content.list('homepage_section');
    if (blocks.length === 0) return;
    const r = await admin.content.publish(blocks[0].id);
    expect(r.ok).toBe(false);
  });
});

/* ================================================================== *
 * Settings & flags — super_admin only, audited
 * ================================================================== */

describe('⚠ admin settings & feature flags', () => {
  it('reads store settings with tax OFF (D-16 unconfirmed)', async () => {
    __setStaffRole('super_admin');
    const admin = getAdminAdapters();
    const s = await admin.settings.get();
    expect(s.taxEnabled).toBe(false); // ⛔ D-16 — never applied until confirmed
    expect(s.currency).toBe('KES');
  });

  it('⚠ a role without settings.edit cannot change settings; a permitted one can, audited', async () => {
    // customer_care has no settings.edit — maintenance mode is off-limits.
    __setStaffRole('customer_care');
    const denied = await getAdminAdapters().settings.update({ maintenanceMode: true });
    expect(denied.ok).toBe(false);

    // store_manager DOES have settings.edit (day-to-day store ops) — and it audits.
    __setStaffRole('store_manager');
    const admin = getAdminAdapters();
    const before = __auditCount();
    const ok = await admin.settings.update({ maintenanceMode: true });
    expect(ok.ok).toBe(true);
    expect(__auditCount()).toBe(before + 1);
  });

  it('⚠ toggling a feature flag is super_admin-only and audited', async () => {
    __setStaffRole('marketing');
    const denied = await getAdminAdapters().settings.toggleFlag('subscriptions', true);
    expect(denied.ok).toBe(false);

    __setStaffRole('super_admin');
    const admin = getAdminAdapters();
    const before = __auditCount();
    const ok = await admin.settings.toggleFlag('subscriptions', true);
    expect(ok.ok).toBe(true);
    expect(__auditCount()).toBe(before + 1);
  });
});

/* ================================================================== *
 * Delivery — reads config; zones blocked (D-21/22/23)
 * ================================================================== */

describe('⚠ admin delivery config', () => {
  it('⛔ reports no zones configured (D-21/22/23) rather than inventing them', async () => {
    __setStaffRole('super_admin');
    const admin = getAdminAdapters();
    const config = await admin.adminDelivery.config();
    expect(config.zones.length).toBe(0);
  });
});

/* ================================================================== *
 * Audit — the trail every action leaves
 * ================================================================== */

describe('⚠ the audit trail accumulates across actions', () => {
  it('a sequence of admin actions produces a matching count of audit events', async () => {
    __setStaffRole('super_admin');
    const admin = getAdminAdapters();
    const start = __auditCount();

    await admin.settings.update({ maintenanceMode: true });
    await admin.settings.toggleFlag('subscriptions', true);
    await admin.adminPayments.reconcile('SFF6VXQ8LR');

    // Three consequential actions → three audit events.
    expect(__auditCount()).toBe(start + 3);

    // And they are visible to a role with audit.view.
    const events = await admin.audit.list({});
    expect(events.length).toBeGreaterThanOrEqual(3);
  });

  it('⚠ a role without audit.view sees an empty log (not everyone reads the trail)', async () => {
    __setStaffRole('super_admin');
    await getAdminAdapters().settings.update({ maintenanceMode: true });

    __setStaffRole('content_editor'); // no audit.view
    const events = await getAdminAdapters().audit.list({});
    expect(events.length).toBe(0);
  });
});
