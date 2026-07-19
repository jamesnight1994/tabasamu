/**
 * PHASE 7 — ADMIN DOMAIN TESTS
 *
 * The ⚠ rows protect an operational or security invariant: fail-closed RBAC,
 * the append-only/reversibility discipline, stock never going silently wrong,
 * and — the sleeper — CSV escaping, because a corrupt finance export is found
 * at the worst possible moment.
 */

import { describe, it, expect } from 'vitest';

import {
  can,
  canAny,
  permissionsForRole,
  isMutating,
  ROLES,
  PERMISSIONS,
  type StaffMember,
  type Role,
} from '../../src/domain/admin/rbac';

import {
  AUDIT_ACTIONS,
  reversibilityOf,
  auditActionsByResource,
} from '../../src/domain/admin/audit';

import {
  validateAdjustment,
  onHandFromMovements,
  reasonAffects,
  STOCK_REASON_CODES,
  type StockMovement,
} from '../../src/domain/admin/stock-movement';

import {
  validatePromotion,
  promotionStatus,
  usageSummary,
  type Promotion,
  type PromotionInput,
} from '../../src/domain/admin/promotions';

import {
  escapeCsvField,
  toCsv,
  REPORT_SCHEMAS,
  REPORT_TYPES,
} from '../../src/domain/admin/reporting';

/* ================================================================== *
 * RBAC — fail closed
 * ================================================================== */

const staff = (role: Role, active = true): StaffMember => ({
  id: 's1', name: 'Test', email: 't@x.co', role, active,
});

describe('⚠ RBAC is fail-closed', () => {
  it('a null staff member can do nothing', () => {
    expect(can(null, 'order.view')).toBe(false);
  });

  it('⚠ an inactive staff member can do nothing, whatever their role', () => {
    expect(can(staff('super_admin', false), 'dashboard.view')).toBe(false);
  });

  it('super_admin can do everything in the matrix', () => {
    for (const p of PERMISSIONS) expect(can(staff('super_admin'), p)).toBe(true);
  });

  it('⚠ finance_analyst is READ-ONLY — no mutating permission', () => {
    const analyst = staff('finance_analyst');
    const mutating = PERMISSIONS.filter(isMutating);
    for (const p of mutating) expect(can(analyst, p)).toBe(false);
  });

  it('⚠ only super_admin can manage staff and feature flags', () => {
    for (const role of ROLES) {
      const expected = role === 'super_admin';
      expect(can(staff(role), 'staff.manage')).toBe(expected);
      expect(can(staff(role), 'settings.feature_flags')).toBe(expected);
    }
  });

  it('⚠ refunds (money movement) are NOT granted to order_manager', () => {
    expect(can(staff('order_manager'), 'order.fulfil')).toBe(true);
    expect(can(staff('order_manager'), 'order.refund')).toBe(false); // higher bar
    expect(can(staff('store_manager'), 'order.refund')).toBe(true);
  });

  it('content_editor has no commercial access', () => {
    expect(can(staff('content_editor'), 'content.edit')).toBe(true);
    expect(can(staff('content_editor'), 'order.view')).toBe(false);
    expect(can(staff('content_editor'), 'payment.view')).toBe(false);
  });

  it('canAny drives nav visibility', () => {
    expect(canAny(staff('marketing'), ['promotion.view', 'order.view'])).toBe(true);
    expect(canAny(staff('marketing'), ['order.view', 'payment.view'])).toBe(false);
  });

  it('every role has at least dashboard.view', () => {
    for (const role of ROLES) expect(permissionsForRole(role)).toContain('dashboard.view');
  });
});

/* ================================================================== *
 * Audit — catalogue completeness & reversibility
 * ================================================================== */

describe('audit catalogue', () => {
  it('every action has a reversibility classification', () => {
    for (const a of AUDIT_ACTIONS) {
      expect(['reversible', 'irreversible', 'compensating']).toContain(reversibilityOf(a));
    }
  });

  it('⚠ money-moving actions are irreversible', () => {
    expect(reversibilityOf('order.refund_requested')).toBe('irreversible');
    expect(reversibilityOf('payment.refund_requested')).toBe('irreversible');
    expect(reversibilityOf('subscription.payment_retried')).toBe('irreversible');
  });

  it('⚠ a sent notification is irreversible (the message already left)', () => {
    expect(reversibilityOf('order.notification_resent')).toBe('irreversible');
  });

  it('⚠ a stock adjustment is compensating, not reversible (undo = opposite move, itself logged)', () => {
    expect(reversibilityOf('inventory.adjusted')).toBe('compensating');
  });

  it('groups actions by resource', () => {
    const grouped = auditActionsByResource();
    expect(grouped.order.length).toBeGreaterThan(0);
    expect(grouped.payment.length).toBeGreaterThan(0);
  });
});

/* ================================================================== *
 * Stock movement — never silently wrong
 * ================================================================== */

describe('⚠ stock adjustments', () => {
  const vid = 'var_x' as StockMovement['variantId'];

  it('rejects a zero delta', () => {
    const r = validateAdjustment({ variantId: vid, delta: 0, reason: 'received', note: '' }, 10);
    expect(r.ok).toBe(false);
  });

  it('⚠ rejects a recount with no note (why did the count change?)', () => {
    const r = validateAdjustment({ variantId: vid, delta: -3, reason: 'recount', note: '  ' }, 10);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('note_required_for_recount');
  });

  it('⚠ refuses to drive on-hand below zero', () => {
    const r = validateAdjustment({ variantId: vid, delta: -20, reason: 'damaged', note: 'breakage' }, 10);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('would_go_negative');
  });

  it('accepts a valid received delta', () => {
    const r = validateAdjustment({ variantId: vid, delta: 48, reason: 'received', note: 'batch 12' }, 10);
    expect(r.ok).toBe(true);
  });

  it('⚠ reserved/released affect a different pool than on-hand', () => {
    expect(reasonAffects('reserved')).toBe('reserved');
    expect(reasonAffects('released')).toBe('reserved');
    expect(reasonAffects('damaged')).toBe('damaged');
    expect(reasonAffects('received')).toBe('on_hand');
  });

  it('⚠ on-hand is the SUM of on-hand movements — the audit trail is the source of truth', () => {
    const mk = (delta: number, reason: StockMovement['reason']): StockMovement => ({
      id: 'm', variantId: vid, delta, reason, note: '', actorId: 'a', actorName: 'A',
      at: 0, balanceAfter: 0,
    });
    const movements = [
      mk(100, 'received'),
      mk(-10, 'sold'),
      mk(-5, 'damaged'),   // ⚠ damaged pool, not on-hand
      mk(-3, 'reserved'),  // ⚠ reserved pool, not on-hand
      mk(2, 'returned'),
    ];
    // on-hand = 100 - 10 + 2 = 92 (damaged & reserved excluded)
    expect(onHandFromMovements(movements)).toBe(92);
  });

  it('every reason code has a pool', () => {
    for (const code of STOCK_REASON_CODES) {
      expect(['on_hand', 'reserved', 'damaged']).toContain(reasonAffects(code));
    }
  });
});

/* ================================================================== *
 * Promotions
 * ================================================================== */

describe('promotion validation', () => {
  const base: PromotionInput = {
    code: 'welcome10', type: 'percentage', value: 10,
    productRestriction: [], customerRestriction: [], minimumSpend: null,
    startsAt: null, endsAt: null, usageLimit: null, perCustomerLimit: null, active: true,
  };

  it('uppercases and accepts a valid code', () => {
    const r = validatePromotion(base);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.code).toBe('WELCOME10');
  });

  it('rejects a code with spaces', () => {
    expect(validatePromotion({ ...base, code: 'we lcome' }).ok).toBe(false);
  });

  it('⚠ rejects a percentage outside 1–100', () => {
    expect(validatePromotion({ ...base, value: 0 }).ok).toBe(false);
    expect(validatePromotion({ ...base, value: 150 }).ok).toBe(false);
  });

  it('⚠ rejects a window that ends before it starts', () => {
    const r = validatePromotion({ ...base, startsAt: 2000, endsAt: 1000 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.some((e) => e.field === 'endsAt')).toBe(true);
  });
});

describe('promotion status', () => {
  const p = (over: Partial<Promotion> = {}): Promotion => ({
    id: 'p', code: 'X', type: 'percentage', value: 10,
    productRestriction: [], customerRestriction: [], minimumSpend: null,
    startsAt: null, endsAt: null, usageLimit: null, perCustomerLimit: null,
    active: true, timesUsed: 0, createdAt: 0, ...over,
  });

  it('paused when inactive', () => {
    expect(promotionStatus(p({ active: false }))).toBe('paused');
  });

  it('⚠ exhausted when usage limit reached', () => {
    expect(promotionStatus(p({ usageLimit: 100, timesUsed: 100 }))).toBe('exhausted');
  });

  it('expired past the end', () => {
    expect(promotionStatus(p({ endsAt: 1000 }), 2000)).toBe('expired');
  });

  it('scheduled before the start', () => {
    expect(promotionStatus(p({ startsAt: 5000 }), 1000)).toBe('scheduled');
  });

  it('live within the window', () => {
    expect(promotionStatus(p({ startsAt: 0, endsAt: 10000 }), 5000)).toBe('live');
  });

  it('summarises usage', () => {
    expect(usageSummary(p({ timesUsed: 3, usageLimit: 100 }))).toBe('3 of 100 used');
    expect(usageSummary(p({ timesUsed: 3, usageLimit: null }))).toBe('3 used');
  });
});

/* ================================================================== *
 * CSV — the sleeper correctness case
 * ================================================================== */

describe('⚠ CSV escaping — a corrupt export is found at the worst time', () => {
  it('leaves plain fields alone', () => {
    expect(escapeCsvField('hello')).toBe('hello');
    expect(escapeCsvField(42)).toBe('42');
  });

  it('⚠ quotes and escapes a field containing a comma', () => {
    expect(escapeCsvField('Riverside, Block C')).toBe('"Riverside, Block C"');
  });

  it('⚠ doubles internal quotes', () => {
    expect(escapeCsvField('the "special" one')).toBe('"the ""special"" one"');
  });

  it('⚠ quotes a field with a newline (would otherwise split the row)', () => {
    expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"');
  });

  it('builds a CRLF-terminated CSV with a header', () => {
    const cols = REPORT_SCHEMAS.inventory;
    const csv = toCsv(cols, [
      { name: 'Passion', sku: 'TS-PAS-1L', onHand: 40, reserved: 3, available: 37 },
    ]);
    const lines = csv.split('\r\n');
    expect(lines[0]).toContain('Product');
    expect(lines[1]).toContain('Passion');
  });

  it('every report type has a schema', () => {
    for (const t of REPORT_TYPES) expect(REPORT_SCHEMAS[t].length).toBeGreaterThan(0);
  });
});
