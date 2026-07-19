/**
 * ADMIN PORTS — Phase 7
 *
 * ⚠ THE ADMIN CONTRACT. Every method here is what an authorised staff member's
 *   browser calls; the backend implements them and — critically — RE-CHECKS THE
 *   PERMISSION server-side on every one. The frontend RBAC guard decides what to
 *   show; these methods must be independently authorised on the server. [rbac.ts]
 *
 * ⚠ EVERY MUTATING METHOD IS EXPECTED TO WRITE AN AUDIT EVENT server-side, from
 *   the authenticated actor. The `AuditAction` a method corresponds to is noted
 *   in the audit catalogue doc. The frontend cannot be trusted to write audit
 *   records (the actor could forge them), so it doesn't — it calls the action.
 *
 * ⚠ NO PRIVILEGED PAYMENT CALLS FROM THE BROWSER. Payment operations here are
 *   READ + queue-management (reconcile flags, review status). Actual refund
 *   execution and provider settlement happen server-side; the admin UI requests
 *   them, it does not perform them. [brief §6]
 */

import type { Result, Money, OrderId, CustomerId, SubscriptionId, VariantId } from '../domain/shared';
import type { StaffMember, Role, Permission } from '../domain/admin/rbac';
import type { AuditEvent, AuditAction } from '../domain/admin/audit';
import type { StockMovement, AdjustmentInput } from '../domain/admin/stock-movement';
import type { Promotion, PromotionInput } from '../domain/admin/promotions';
import type {
  DashboardMetrics,
  ProductPerformanceRow,
  ActivityEntry,
  ReportType,
  ReportResult,
  DateRange,
} from '../domain/admin/reporting';
import type { Order } from './index';
import type { Subscription } from '../domain/subscription';
import type { CustomerProfile, SavedAddress } from '../domain/identity/customer';
import type { Payment, WebhookEvent } from '../domain/payment';
import type { DeliveryConfig } from '../domain/delivery';

/** A generic admin error. The kind maps to a user-facing message in the UI. */
export type AdminError = { kind: 'unauthorised' | 'not_found' | 'invalid' | 'conflict' | 'server'; message?: string };

/* ================================================================== *
 * Admin session — who is acting
 * ================================================================== */

export interface AdminAuthService {
  /** The current staff member, or null. Reads the server session. */
  currentStaff(): Promise<StaffMember | null>;
  signIn(email: string, password: string): Promise<Result<StaffMember, AdminError>>;
  signOut(): Promise<void>;
}

/* ================================================================== *
 * Dashboard & reporting
 * ================================================================== */

export interface AdminDashboardService {
  metrics(): Promise<DashboardMetrics>;
  productPerformance(): Promise<readonly ProductPerformanceRow[]>;
  recentActivity(): Promise<readonly ActivityEntry[]>;
}

export interface AdminReportingService {
  run(type: ReportType, range: DateRange): Promise<ReportResult>;
}

/* ================================================================== *
 * Products & inventory
 * ================================================================== */

export interface AdminProductService {
  // Read uses the existing catalogue; these are the mutations.
  create(draft: Readonly<Record<string, unknown>>): Promise<Result<{ id: string }, AdminError>>;
  update(id: string, patch: Readonly<Record<string, unknown>>): Promise<Result<true, AdminError>>;
  archive(id: string): Promise<Result<true, AdminError>>;
  duplicate(id: string): Promise<Result<{ id: string }, AdminError>>;
  publish(id: string, scheduledAt: number | null): Promise<Result<true, AdminError>>;
}

export interface AdminInventoryService {
  movements(variantId: VariantId): Promise<readonly StockMovement[]>;
  adjust(input: AdjustmentInput): Promise<Result<StockMovement, AdminError>>;
  /** Returns a CSV string (built by the shared toCsv contract). */
  exportCsv(): Promise<Result<string, AdminError>>;
}

/* ================================================================== *
 * Orders
 * ================================================================== */

export interface AdminOrderService {
  search(query: string, filters: Readonly<Record<string, string>>): Promise<readonly Order[]>;
  byId(id: OrderId): Promise<Order | null>;
  /** ⚠ Goes through the guarded order state machine; illegal transitions are refused. */
  advanceStatus(id: OrderId, to: string): Promise<Result<Order, AdminError>>;
  cancel(id: OrderId, reason: string): Promise<Result<Order, AdminError>>;
  /** ⚠ Requests a refund — does NOT execute it in the browser. Server settles. */
  requestRefund(id: OrderId, amount: Money | null, reason: string): Promise<Result<true, AdminError>>;
  addNote(id: OrderId, note: string): Promise<Result<true, AdminError>>;
  resendNotification(id: OrderId, channel: string): Promise<Result<true, AdminError>>;
  createManual(draft: Readonly<Record<string, unknown>>): Promise<Result<Order, AdminError>>;
  timeline(id: OrderId): Promise<readonly AuditEvent[]>;
}

/* ================================================================== *
 * Payments — READ + queue management only
 * ================================================================== */

export interface AdminPaymentService {
  list(filters: Readonly<Record<string, string>>): Promise<readonly Payment[]>;
  byReference(reference: string): Promise<Payment | null>;
  /** Pending / failed / unmatched / duplicate queues. */
  reviewQueue(): Promise<readonly Payment[]>;
  webhookHistory(reference: string): Promise<readonly WebhookEvent[]>;
  markReviewed(reference: string, note: string): Promise<Result<true, AdminError>>;
  /** ⚠ Flags for reconciliation — the server does the actual reconcile. */
  reconcile(reference: string): Promise<Result<true, AdminError>>;
  exportCsv(): Promise<Result<string, AdminError>>;
}

/* ================================================================== *
 * Customers
 * ================================================================== */

export interface AdminCustomerSummary {
  readonly profile: CustomerProfile;
  readonly orderCount: number;
  /** ⛔ D-14 — lifetime value depends on approved prices; carried as a marker. */
  readonly lifetimeValue: Money | { readonly _unavailable: true; readonly blockedBy: string };
  readonly status: 'active' | 'suspended';
}

export interface AdminCustomerService {
  list(query: string): Promise<readonly AdminCustomerSummary[]>;
  detail(id: CustomerId): Promise<AdminCustomerSummary | null>;
  orders(id: CustomerId): Promise<readonly Order[]>;
  addresses(id: CustomerId): Promise<readonly SavedAddress[]>;
  subscriptions(id: CustomerId): Promise<readonly Subscription[]>;
  addNote(id: CustomerId, note: string): Promise<Result<true, AdminError>>;
  setStatus(id: CustomerId, status: 'active' | 'suspended'): Promise<Result<true, AdminError>>;
  handleDataRequest(id: CustomerId, kind: 'export' | 'deletion', decision: 'approve' | 'reject', note: string): Promise<Result<true, AdminError>>;
}

/* ================================================================== *
 * Subscriptions (admin view)
 * ================================================================== */

export interface AdminSubscriptionService {
  list(filter: string): Promise<readonly Subscription[]>;
  pause(id: SubscriptionId): Promise<Result<Subscription, AdminError>>;
  cancel(id: SubscriptionId): Promise<Result<Subscription, AdminError>>;
  /** ⛔ D-09 — requests a retry; the charge itself is undefined until billing decided. */
  retryPayment(id: SubscriptionId): Promise<Result<true, AdminError>>;
  history(id: SubscriptionId): Promise<readonly AuditEvent[]>;
}

/* ================================================================== *
 * Promotions
 * ================================================================== */

export interface AdminPromotionService {
  list(): Promise<readonly Promotion[]>;
  byId(id: string): Promise<Promotion | null>;
  create(input: PromotionInput): Promise<Result<Promotion, AdminError>>;
  update(id: string, input: PromotionInput): Promise<Result<Promotion, AdminError>>;
  deactivate(id: string): Promise<Result<true, AdminError>>;
}

/* ================================================================== *
 * Delivery
 * ================================================================== */

export interface AdminDeliveryService {
  config(): Promise<DeliveryConfig>;
  updateConfig(patch: Readonly<Record<string, unknown>>): Promise<Result<DeliveryConfig, AdminError>>;
}

/* ================================================================== *
 * Content
 * ================================================================== */

export interface ContentBlock {
  readonly id: string;
  readonly kind: string; // 'homepage_section' | 'announcement' | 'faq' | 'journal' | ...
  readonly title: string;
  readonly status: 'draft' | 'published';
  readonly updatedAt: number;
}

export interface AdminContentService {
  list(kind: string): Promise<readonly ContentBlock[]>;
  update(id: string, patch: Readonly<Record<string, unknown>>): Promise<Result<ContentBlock, AdminError>>;
  publish(id: string): Promise<Result<true, AdminError>>;
  unpublish(id: string): Promise<Result<true, AdminError>>;
}

/* ================================================================== *
 * Settings & staff
 * ================================================================== */

export interface StoreSettings {
  readonly storeName: string;
  readonly currency: string; // 'KES' — fixed for this market
  readonly contactEmail: string;
  readonly contactPhone: string;
  readonly orderNumberPrefix: string;
  readonly maintenanceMode: boolean;
  /** ⛔ Tax config — D-16. Held but never applied until confirmed. */
  readonly taxEnabled: boolean;
}

export interface AdminSettingsService {
  get(): Promise<StoreSettings>;
  update(patch: Partial<StoreSettings>): Promise<Result<StoreSettings, AdminError>>;
  featureFlags(): Promise<Readonly<Record<string, boolean>>>;
  toggleFlag(flag: string, on: boolean): Promise<Result<true, AdminError>>;
}

export interface AdminStaffService {
  list(): Promise<readonly StaffMember[]>;
  invite(email: string, name: string, role: Role): Promise<Result<StaffMember, AdminError>>;
  changeRole(id: string, role: Role): Promise<Result<StaffMember, AdminError>>;
  deactivate(id: string): Promise<Result<true, AdminError>>;
}

/* ================================================================== *
 * Audit
 * ================================================================== */

export interface AdminAuditService {
  list(filters: Readonly<Record<string, string>>): Promise<readonly AuditEvent[]>;
}

/* ================================================================== *
 * The admin composition root
 * ================================================================== */

export interface AdminAdapters {
  readonly adminAuth: AdminAuthService;
  readonly dashboard: AdminDashboardService;
  readonly reporting: AdminReportingService;
  readonly adminProducts: AdminProductService;
  readonly adminInventory: AdminInventoryService;
  readonly adminOrders: AdminOrderService;
  readonly adminPayments: AdminPaymentService;
  readonly adminCustomers: AdminCustomerService;
  readonly adminSubscriptions: AdminSubscriptionService;
  readonly promotions: AdminPromotionService;
  readonly adminDelivery: AdminDeliveryService;
  readonly content: AdminContentService;
  readonly settings: AdminSettingsService;
  readonly staff: AdminStaffService;
  readonly audit: AdminAuditService;
}

export type { StaffMember, Role, Permission, AuditEvent, AuditAction };
