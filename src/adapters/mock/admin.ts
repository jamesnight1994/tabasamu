/**
 * MOCK ADMIN ADAPTERS — Phase 7
 *
 * ⚠ REALISTIC, AND IT ENFORCES PERMISSIONS EVEN THOUGH IT DOESN'T HAVE TO.
 *
 *   A mock could skip authorisation. This one doesn't — it checks `can(staff, …)`
 *   before every mutation and writes an `AuditEvent` after, exactly as the real
 *   backend must. Building the UI against a mock that enforces means the UI is
 *   correct when the real backend (which enforces for real) arrives.
 *
 * ⚠ IT STILL MOVES NO MONEY. Refund/retry requests set state and audit; they do
 *   not settle. [brief §6, D-09]
 *
 * ⚠ THE NUMBERS ARE DEMO DATA. Revenue-shaped figures are marked Unavailable
 *   (blocked on D-14/D-16); counts are plausible fabrications for a buildable UI,
 *   never presented as real performance. [NN-05]
 */

import type {
  AdminAdapters,
  AdminError,
  AdminCustomerSummary,
  StoreSettings,
  ContentBlock,
} from '../../ports/admin';
import {
  type StaffMember,
  type Role,
  type Permission,
  can,
} from '../../domain/admin/rbac';
import {
  type AuditEvent,
  type AuditAction,
  reversibilityOf,
} from '../../domain/admin/audit';
import {
  type StockMovement,
  validateAdjustment,
  onHandFromMovements,
} from '../../domain/admin/stock-movement';
import {
  type Promotion,
  type PromotionInput,
  validatePromotion,
} from '../../domain/admin/promotions';
import {
  type DashboardMetrics,
  type ProductPerformanceRow,
  type ActivityEntry,
  type ReportType,
  type ReportResult,
  type DateRange,
  REPORT_SCHEMAS,
  toCsv,
} from '../../domain/admin/reporting';
import { type Result, Ok, Err, type VariantId } from '../../domain/shared';
import { unavailable } from '../../domain/catalogue';
import { EMPTY_DELIVERY_CONFIG } from '../../domain/delivery';

/* ================================================================== *
 * State
 * ================================================================== */

let currentStaff: StaffMember | null = null;
const staffList: StaffMember[] = [];
const auditLog: AuditEvent[] = [];
const movements = new Map<string, StockMovement[]>();
const promotions: Promotion[] = [];
let settings: StoreSettings;
const featureFlags: Record<string, boolean> = {};
const contentBlocks: ContentBlock[] = [];

let seq = 1;
const nextId = (p: string) => `${p}_${(seq++).toString(36)}`;
const latency = () => new Promise((r) => setTimeout(r, 30 + Math.random() * 40));

/* ================================================================== *
 * Seed
 * ================================================================== */

let seeded = false;
const seed = () => {
  if (seeded) return;
  seeded = true;

  staffList.push(
    { id: 'staff_1', name: 'Amina Otieno', email: 'amina@tabasamu.co.ke', role: 'super_admin', active: true },
    { id: 'staff_2', name: 'Brian Kimani', email: 'brian@tabasamu.co.ke', role: 'order_manager', active: true },
    { id: 'staff_3', name: 'Cynthia Wangui', email: 'cynthia@tabasamu.co.ke', role: 'finance_analyst', active: true },
  );
  currentStaff = staffList[0]; // demo: signed in as super admin

  settings = {
    storeName: 'Tabasamu Sips',
    currency: 'KES',
    contactEmail: '', // ⛔ D-47 — trading contact not supplied
    contactPhone: '',
    orderNumberPrefix: 'TS-',
    maintenanceMode: false,
    taxEnabled: false, // ⛔ D-16
  };

  Object.assign(featureFlags, {
    subscriptions: false, // ⛔ D-09
    buildABox: false,     // ⛔ D-06
    cardPayments: false,  // ⛔ D-35
  });

  // A couple of demo promotions so the promotions area is explorable.
  promotions.push(
    {
      id: 'promo_1', code: 'WELCOME10', type: 'percentage', value: 10,
      productRestriction: [], customerRestriction: [], minimumSpend: null,
      startsAt: null, endsAt: null, usageLimit: 100, perCustomerLimit: 1,
      active: true, timesUsed: 12, createdAt: Date.now() - 86400000 * 20,
    },
    {
      id: 'promo_2', code: 'FREEDELIVERY', type: 'free_delivery', value: 0,
      productRestriction: [], customerRestriction: [], minimumSpend: null,
      startsAt: null, endsAt: Date.now() - 86400000, usageLimit: null, perCustomerLimit: null,
      active: true, timesUsed: 44, createdAt: Date.now() - 86400000 * 40,
    },
  );

  contentBlocks.push(
    { id: 'c_home_hero', kind: 'homepage_section', title: 'Homepage hero', status: 'published', updatedAt: Date.now() - 86400000 * 5 },
    { id: 'c_announcement', kind: 'announcement', title: 'Announcement bar', status: 'draft', updatedAt: Date.now() - 86400000 * 2 },
    { id: 'c_faq_shelf', kind: 'faq', title: 'FAQ: shelf life', status: 'draft', updatedAt: Date.now() - 86400000 }, // ⛔ D-46
  );

  // Some stock movements for the demo variants.
  const seedMoves = (vid: string, initial: number) => {
    const list: StockMovement[] = [
      { id: nextId('mv'), variantId: vid as VariantId, delta: initial, reason: 'received', note: 'Opening batch', actorId: 'staff_1', actorName: 'Amina Otieno', at: Date.now() - 86400000 * 10, balanceAfter: initial },
    ];
    movements.set(vid, list);
  };
  seedMoves('var_passion_1l', 60);
  seedMoves('var_pineapple_1l', 40);
  seedMoves('var_grape_ginger_1l', 8); // low stock demo
};

/* ================================================================== *
 * Helpers — authorise + audit
 * ================================================================== */

const denied = (): Result<never, AdminError> => Err({ kind: 'unauthorised', message: 'You do not have permission to do that.' });

const authorise = (permission: Permission): boolean => can(currentStaff, permission);

const writeAudit = (
  action: AuditAction,
  target: string,
  summary: string,
  before: string | null = null,
  after: string | null = null
): AuditEvent => {
  const event: AuditEvent = {
    id: nextId('audit'),
    action,
    actorId: currentStaff?.id ?? 'unknown',
    actorName: currentStaff?.name ?? 'Unknown',
    actorRole: currentStaff?.role ?? 'unknown',
    target,
    summary,
    before,
    after,
    at: Date.now(),
    reversibility: reversibilityOf(action),
  };
  auditLog.unshift(event); // newest first
  return event;
};

/* ================================================================== *
 * The adapters
 * ================================================================== */

export const createMockAdminAdapters = (): AdminAdapters => {
  seed();

  return {
    adminAuth: {
      async currentStaff() {
        seed();
        return currentStaff;
      },
      async signIn(email) {
        await latency();
        const found = staffList.find((s) => s.email === email && s.active);
        if (!found) return Err({ kind: 'unauthorised', message: 'No active staff account for that email.' });
        currentStaff = found;
        return Ok(found);
      },
      async signOut() {
        currentStaff = null;
      },
    },

    dashboard: {
      async metrics(): Promise<DashboardMetrics> {
        await latency();
        // ⛔ Revenue is Unavailable — depends on approved prices (D-14) + tax (D-16).
        const rev = unavailable('D-14', 'Revenue needs approved prices and tax status (D-16).') as never;
        return {
          revenueToday: rev, revenue7d: rev, revenue30d: rev, averageOrderValue: rev,
          ordersToday: 7, orders7d: 41, ordersPaid: 33, ordersPending: 8,
          ordersPendingFulfilment: 5,
          mpesaCount: 38, cardCount: 0, // ⛔ card disabled (D-35)
          failedPayments: 3,
          newCustomers7d: 14, returningCustomers7d: 9,
          lowStockCount: 1, outOfStockCount: 0,
          subscriptionsActive: 6, subscriptionsPaused: 1, subscriptionsPastDue: 1,
          renewalsUpcoming7d: 4,
        };
      },
      async productPerformance(): Promise<readonly ProductPerformanceRow[]> {
        const rev = unavailable('D-14', 'Revenue needs approved prices.') as never;
        return [
          { variantId: 'var_passion_1l', name: 'Passion', unitsSold: 58, revenue: rev },
          { variantId: 'var_pineapple_1l', name: 'Pineapple', unitsSold: 41, revenue: rev },
          { variantId: 'var_grape_ginger_1l', name: 'Grape Ginger', unitsSold: 33, revenue: rev },
        ];
      },
      async recentActivity(): Promise<readonly ActivityEntry[]> {
        return [
          { at: Date.now() - 3600_000, summary: 'Order TS-2042 dispatched', kind: 'order' },
          { at: Date.now() - 7200_000, summary: 'Stock received: Passion +48', kind: 'stock' },
          { at: Date.now() - 10800_000, summary: 'Payment SGH2KLM9PQ confirmed', kind: 'payment' },
          { at: Date.now() - 86400_000, summary: 'New customer registered', kind: 'customer' },
        ];
      },
    },

    reporting: {
      async run(type: ReportType, range: DateRange): Promise<ReportResult> {
        await latency();
        const schema = { type, columns: REPORT_SCHEMAS[type] };
        // Demo rows; money columns carry an honest "awaiting confirmation" caveat.
        const caveats: string[] = [];
        if (schema.columns.some((c) => c.type === 'money')) {
          caveats.push('Money columns are blocked on approved prices (D-14) and tax status (D-16); shown as "awaiting confirmation".');
        }
        const rows = demoRows(type);
        return { schema, range, rows, caveats };
      },
    },

    adminProducts: {
      async create(draft) {
        if (!authorise('product.create')) return denied();
        await latency();
        const id = nextId('prod');
        writeAudit('product.created', `product:${id}`, `Created product`, null, JSON.stringify(draft).slice(0, 120));
        return Ok({ id });
      },
      async update(id, patch) {
        if (!authorise('product.edit')) return denied();
        writeAudit('product.updated', `product:${id}`, `Updated product`, null, JSON.stringify(patch).slice(0, 120));
        return Ok(true);
      },
      async archive(id) {
        if (!authorise('product.archive')) return denied();
        writeAudit('product.archived', `product:${id}`, `Archived product`);
        return Ok(true);
      },
      async duplicate(id) {
        if (!authorise('product.duplicate')) return denied();
        const newId = nextId('prod');
        writeAudit('product.duplicated', `product:${newId}`, `Duplicated from ${id}`);
        return Ok({ id: newId });
      },
      async publish(id, scheduledAt) {
        if (!authorise('product.edit')) return denied();
        writeAudit('product.published', `product:${id}`, scheduledAt ? `Scheduled publish` : `Published`);
        return Ok(true);
      },
    },

    adminInventory: {
      async movements(variantId) {
        seed();
        return movements.get(variantId as string) ?? [];
      },
      async adjust(input) {
        if (!authorise('inventory.adjust')) return denied();
        const list = movements.get(input.variantId as string) ?? [];
        const current = onHandFromMovements(list);
        const valid = validateAdjustment(input, current);
        if (!valid.ok) return Err({ kind: 'invalid', message: valid.error.kind });
        await latency();
        const balanceAfter = current + input.delta;
        const move: StockMovement = {
          id: nextId('mv'), variantId: input.variantId, delta: input.delta,
          reason: input.reason, note: input.note,
          actorId: currentStaff!.id, actorName: currentStaff!.name,
          at: Date.now(), balanceAfter,
        };
        movements.set(input.variantId as string, [move, ...list]);
        writeAudit('inventory.adjusted', `variant:${input.variantId}`,
          `${input.delta > 0 ? '+' : ''}${input.delta} (${input.reason})`,
          String(current), String(balanceAfter));
        return Ok(move);
      },
      async exportCsv() {
        if (!authorise('inventory.export')) return denied();
        const rows = [...movements.entries()].map(([vid, list]) => ({
          name: vid, sku: vid, onHand: onHandFromMovements(list), reserved: 0, available: onHandFromMovements(list),
        }));
        return Ok(toCsv(REPORT_SCHEMAS.inventory, rows));
      },
    },

    adminOrders: makeStubOrders(authorise, writeAudit),
    adminPayments: makeStubPayments(authorise, writeAudit),
    adminCustomers: makeStubCustomers(authorise, writeAudit),
    adminSubscriptions: makeStubSubscriptions(authorise, writeAudit),

    promotions: {
      async list() { seed(); return promotions; },
      async byId(id) { return promotions.find((p) => p.id === id) ?? null; },
      async create(input: PromotionInput) {
        if (!authorise('promotion.create')) return denied();
        const valid = validatePromotion(input);
        if (!valid.ok) return Err({ kind: 'invalid', message: valid.error[0]?.message });
        const promo: Promotion = {
          id: nextId('promo'), ...valid.value, timesUsed: 0, createdAt: Date.now(),
        };
        promotions.unshift(promo);
        writeAudit('promotion.created', `promotion:${promo.code}`, `Created ${promo.code}`);
        return Ok(promo);
      },
      async update(id, input) {
        if (!authorise('promotion.edit')) return denied();
        const valid = validatePromotion(input);
        if (!valid.ok) return Err({ kind: 'invalid', message: valid.error[0]?.message });
        const idx = promotions.findIndex((p) => p.id === id);
        if (idx < 0) return Err({ kind: 'not_found' });
        promotions[idx] = { ...promotions[idx], ...valid.value };
        writeAudit('promotion.updated', `promotion:${id}`, `Updated`);
        return Ok(promotions[idx]);
      },
      async deactivate(id) {
        if (!authorise('promotion.deactivate')) return denied();
        const idx = promotions.findIndex((p) => p.id === id);
        if (idx < 0) return Err({ kind: 'not_found' });
        promotions[idx] = { ...promotions[idx], active: false };
        writeAudit('promotion.deactivated', `promotion:${id}`, `Deactivated`);
        return Ok(true);
      },
    },

    adminDelivery: {
      async config() { return EMPTY_DELIVERY_CONFIG; }, // ⛔ D-21/22/23
      async updateConfig(patch) {
        if (!authorise('delivery.edit')) return denied();
        writeAudit('delivery.config_updated', 'delivery:config', 'Updated delivery config', null, JSON.stringify(patch).slice(0, 120));
        return Ok(EMPTY_DELIVERY_CONFIG);
      },
    },

    content: {
      async list(kind) { seed(); return contentBlocks.filter((c) => kind === 'all' || c.kind === kind); },
      async update(id, patch) {
        if (!authorise('content.edit')) return denied();
        const idx = contentBlocks.findIndex((c) => c.id === id);
        if (idx < 0) return Err({ kind: 'not_found' });
        contentBlocks[idx] = { ...contentBlocks[idx], updatedAt: Date.now() };
        writeAudit('content.updated', `content:${id}`, `Updated ${contentBlocks[idx].title}`, null, JSON.stringify(patch).slice(0, 80));
        return Ok(contentBlocks[idx]);
      },
      async publish(id) {
        if (!authorise('content.publish')) return denied();
        const idx = contentBlocks.findIndex((c) => c.id === id);
        if (idx < 0) return Err({ kind: 'not_found' });
        contentBlocks[idx] = { ...contentBlocks[idx], status: 'published', updatedAt: Date.now() };
        writeAudit('content.published', `content:${id}`, `Published ${contentBlocks[idx].title}`);
        return Ok(true);
      },
      async unpublish(id) {
        if (!authorise('content.publish')) return denied();
        const idx = contentBlocks.findIndex((c) => c.id === id);
        if (idx < 0) return Err({ kind: 'not_found' });
        contentBlocks[idx] = { ...contentBlocks[idx], status: 'draft', updatedAt: Date.now() };
        writeAudit('content.unpublished', `content:${id}`, `Unpublished ${contentBlocks[idx].title}`);
        return Ok(true);
      },
    },

    settings: {
      async get() { seed(); return settings; },
      async update(patch) {
        if (!authorise('settings.edit')) return denied();
        settings = { ...settings, ...patch };
        writeAudit('settings.updated', 'settings:store', 'Updated store settings', null, JSON.stringify(patch).slice(0, 120));
        return Ok(settings);
      },
      async featureFlags() { seed(); return { ...featureFlags }; },
      async toggleFlag(flag, on) {
        if (!authorise('settings.feature_flags')) return denied();
        featureFlags[flag] = on;
        writeAudit('settings.feature_flag_toggled', `flag:${flag}`, `${flag} → ${on ? 'on' : 'off'}`, String(!on), String(on));
        return Ok(true);
      },
    },

    staff: {
      async list() { seed(); return staffList; },
      async invite(email, name, role: Role) {
        if (!authorise('staff.manage')) return denied();
        const member: StaffMember = { id: nextId('staff'), name, email, role, active: true };
        staffList.push(member);
        writeAudit('staff.invited', `staff:${member.id}`, `Invited ${email} as ${role}`);
        return Ok(member);
      },
      async changeRole(id, role: Role) {
        if (!authorise('staff.manage')) return denied();
        const idx = staffList.findIndex((s) => s.id === id);
        if (idx < 0) return Err({ kind: 'not_found' });
        const before = staffList[idx].role;
        staffList[idx] = { ...staffList[idx], role };
        writeAudit('staff.role_changed', `staff:${id}`, `Role ${before} → ${role}`, before, role);
        return Ok(staffList[idx]);
      },
      async deactivate(id) {
        if (!authorise('staff.manage')) return denied();
        const idx = staffList.findIndex((s) => s.id === id);
        if (idx < 0) return Err({ kind: 'not_found' });
        staffList[idx] = { ...staffList[idx], active: false };
        writeAudit('staff.deactivated', `staff:${id}`, `Deactivated ${staffList[idx].name}`);
        return Ok(true);
      },
    },

    audit: {
      async list(filters) {
        seed();
        if (!authorise('audit.view')) return [];
        const action = filters.action;
        return action ? auditLog.filter((e) => e.action.startsWith(action)) : auditLog;
      },
    },
  };
};

/* ================================================================== *
 * Stub factories for the read-heavy services (kept terse; they read the
 * existing customer/order/subscription mocks via the main adapter set at the
 * UI layer, so these focus on admin-only mutations + audit).
 * ================================================================== */

function makeStubOrders(auth: (p: Permission) => boolean, audit: typeof writeAudit): AdminAdapters['adminOrders'] {
  return {
    async search() { return []; },       // UI reads orders via the main orders port
    async byId() { return null; },
    async advanceStatus(id, to) {
      if (!auth('order.fulfil')) return denied();
      audit('order.status_changed', `order:${id}`, `Status → ${to}`);
      return Err({ kind: 'not_found', message: 'Read orders via the storefront orders port; admin mutation audited.' });
    },
    async cancel(id, reason) {
      if (!auth('order.cancel')) return denied();
      audit('order.cancelled', `order:${id}`, `Cancelled: ${reason}`);
      return Err({ kind: 'not_found' });
    },
    async requestRefund(id, _amount, reason) {
      if (!auth('order.refund')) return denied();
      // ⚠ REQUESTS a refund — no money moves in the browser. Server settles.
      audit('order.refund_requested', `order:${id}`, `Refund requested: ${reason}`);
      return Ok(true);
    },
    async addNote(id, note) {
      if (!auth('order.note')) return denied();
      audit('order.note_added', `order:${id}`, note.slice(0, 60));
      return Ok(true);
    },
    async resendNotification(id, channel) {
      if (!auth('order.note')) return denied();
      audit('order.notification_resent', `order:${id}`, `Resent via ${channel}`);
      return Ok(true);
    },
    async createManual() {
      if (!auth('order.create_manual')) return denied();
      return Err({ kind: 'invalid', message: 'Manual order entry requires the checkout port; audited on creation.' });
    },
    async timeline() { return []; },
  };
}

const DEMO_PAYMENTS = [
  { id: 'pay_1', reference: 'SGH2KLM9PQ', provider: 'mpesa', status: 'succeeded', orderNumber: 'TS-2002', amountLabel: 'awaiting confirmation', createdAt: '2026-07-14T09:12:00Z', queue: null },
  { id: 'pay_2', reference: 'ws_CO_140720260830', provider: 'mpesa', status: 'unknown', orderNumber: 'TS-2003', amountLabel: 'awaiting confirmation', createdAt: '2026-07-14T08:30:00Z', queue: 'unmatched' },
  { id: 'pay_3', reference: 'SFF6VXQ8LR', provider: 'mpesa', status: 'failed', orderNumber: 'TS-2001', amountLabel: 'awaiting confirmation', createdAt: '2026-07-13T17:40:00Z', queue: 'failed' },
  { id: 'pay_4', reference: 'DUP-88213', provider: 'mpesa', status: 'succeeded', orderNumber: 'TS-2002', amountLabel: 'awaiting confirmation', createdAt: '2026-07-14T09:13:10Z', queue: 'duplicate' },
] as const;

function makeStubPayments(auth: (p: Permission) => boolean, audit: typeof writeAudit): AdminAdapters['adminPayments'] {
  return {
    // ⚠ READ-ONLY here. No privileged payment call is ever made from the browser;
    //   these are views over what the backend recorded. [brief §6]
    async list() { return DEMO_PAYMENTS as unknown as never; },
    async byReference(reference: string) {
      return (DEMO_PAYMENTS.find((p) => p.reference === reference) ?? null) as unknown as never;
    },
    async reviewQueue() {
      // Pending / failed / unmatched / duplicate — the manual review queue.
      return DEMO_PAYMENTS.filter((p) => p.queue !== null) as unknown as never;
    },
    async webhookHistory() { return []; },
    async markReviewed(reference, note) {
      if (!auth('payment.reconcile')) return denied();
      audit('payment.marked_reviewed', `payment:${reference}`, note.slice(0, 60));
      return Ok(true);
    },
    async reconcile(reference) {
      if (!auth('payment.reconcile')) return denied();
      // ⚠ Flags for reconciliation; the server reconciles. No privileged call here.
      audit('payment.reconciled', `payment:${reference}`, 'Flagged for reconciliation');
      return Ok(true);
    },
    async exportCsv() {
      if (!auth('payment.export')) return denied();
      return Ok(toCsv(REPORT_SCHEMAS.payment, []));
    },
  };
}

const DEMO_CUSTOMERS = [
  {
    profile: { id: 'cust_demo', email: 'demo@tabasamu.co.ke', fullName: 'Amina Wanjiru', phone: '254712000111', emailVerified: true, createdAt: Date.now() - 1000 * 60 * 60 * 24 * 90 },
    orderCount: 2,
    lifetimeValue: { _unavailable: true as const, blockedBy: 'D-14' },
    status: 'active' as const,
  },
  {
    profile: { id: 'cust_2', email: 'j.otieno@example.co.ke', fullName: 'James Otieno', phone: '254720555222', emailVerified: false, createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20 },
    orderCount: 1,
    lifetimeValue: { _unavailable: true as const, blockedBy: 'D-14' },
    status: 'active' as const,
  },
];

function makeStubCustomers(auth: (p: Permission) => boolean, audit: typeof writeAudit): AdminAdapters['adminCustomers'] {
  return {
    async list(query: string): Promise<readonly AdminCustomerSummary[]> {
      const q = query.trim().toLowerCase();
      const rows = DEMO_CUSTOMERS.filter(
        (c) => q === '' || c.profile.fullName.toLowerCase().includes(q) || c.profile.email.toLowerCase().includes(q)
      );
      return rows as unknown as readonly AdminCustomerSummary[];
    },
    async detail(id) {
      return (DEMO_CUSTOMERS.find((c) => c.profile.id === (id as unknown as string)) ?? null) as unknown as AdminCustomerSummary | null;
    },
    async orders() { return []; },
    async addresses() { return []; },
    async subscriptions() { return []; },
    async addNote(id, note) {
      if (!auth('customer.note')) return denied();
      audit('customer.note_added', `customer:${id}`, note.slice(0, 60));
      return Ok(true);
    },
    async setStatus(id, status) {
      if (!auth('customer.note')) return denied();
      audit('customer.status_changed', `customer:${id}`, `Status → ${status}`);
      return Ok(true);
    },
    async handleDataRequest(id, kind, decision, note) {
      if (!auth('customer.handle_data_request')) return denied();
      audit(kind === 'export' ? 'customer.data_export_requested' : 'customer.deletion_requested',
        `customer:${id}`, `${kind} ${decision}: ${note}`.slice(0, 80));
      return Ok(true);
    },
  };
}

function makeStubSubscriptions(auth: (p: Permission) => boolean, audit: typeof writeAudit): AdminAdapters['adminSubscriptions'] {
  return {
    async list() { return []; },
    async pause(id) {
      if (!auth('subscription.manage')) return denied();
      audit('subscription.paused_by_admin', `subscription:${id}`, 'Paused by admin');
      return Err({ kind: 'not_found', message: 'Read subscriptions via the storefront port; admin action audited.' });
    },
    async cancel(id) {
      if (!auth('subscription.manage')) return denied();
      audit('subscription.cancelled_by_admin', `subscription:${id}`, 'Cancelled by admin');
      return Err({ kind: 'not_found' });
    },
    async retryPayment(id) {
      if (!auth('subscription.retry_payment')) return denied();
      // ⛔ D-09 — requests a retry; the charge model is undefined. State + audit only.
      audit('subscription.payment_retried', `subscription:${id}`, 'Payment retry requested');
      return Ok(true);
    },
    async history() { return []; },
  };
}

/* ================================================================== *
 * Demo report rows
 * ================================================================== */

function demoRows(type: ReportType): readonly Readonly<Record<string, string | number>>[] {
  const awaiting = 'awaiting confirmation';
  switch (type) {
    case 'sales':
      return [
        { date: '2026-07-14', orders: 7, units: 19, revenue: awaiting },
        { date: '2026-07-13', orders: 5, units: 12, revenue: awaiting },
      ];
    case 'inventory':
      return [
        { name: 'Passion', sku: 'TS-PAS-1L', onHand: 60, reserved: 3, available: 57 },
        { name: 'Grape Ginger', sku: 'TS-GRG-1L', onHand: 8, reserved: 0, available: 8 },
      ];
    case 'payment':
      return [
        { reference: 'SGH2KLM9PQ', provider: 'M-PESA', status: 'confirmed', amount: awaiting, date: '2026-07-14' },
      ];
    case 'discount':
      return [{ code: 'WELCOME10', used: 12, status: 'live' }];
    default:
      return [];
  }
}

/** Test/dev helpers. */
export const resetAdminState = (): void => {
  seeded = false;
  currentStaff = null;
  staffList.length = 0;
  auditLog.length = 0;
  movements.clear();
  promotions.length = 0;
  contentBlocks.length = 0;
  for (const k of Object.keys(featureFlags)) delete featureFlags[k];
  seq = 1;
};
export const __setStaffRole = (role: Role): void => {
  seed();
  currentStaff = { id: 'test_staff', name: 'Test', email: 'test@x.co', role, active: true };
};
export const __auditCount = (): number => auditLog.length;
