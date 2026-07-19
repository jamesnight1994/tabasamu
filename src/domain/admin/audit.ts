/**
 * AUDIT LOG
 *
 * ⚠ EVERY CONSEQUENTIAL ADMIN ACTION LEAVES A RECORD. NO EXCEPTIONS.
 *
 *   The brief is explicit: consequential actions require an audit-log event.
 *   This module defines the CATALOGUE of those events and their shape. The rule
 *   the whole admin portal follows: if an action changes money, stock, an order
 *   state, a customer's data, a price, or who-can-do-what, it writes an
 *   `AuditEvent` — recording WHO did it, WHAT they did, to WHICH target, WHEN,
 *   and whether it can be undone.
 *
 * ⚠ APPEND-ONLY. Like the consent log in Phase 6, the audit log is never
 *   updated or deleted — that is the entire point of an audit log. ⛔ D-58
 *   (retention period + storage) is a client/legal decision; the shape is fixed
 *   here, the retention is not invented.
 *
 * ⚠ THE FRONTEND EMITS AN INTENT; THE BACKEND WRITES THE RECORD.
 *   A client-written audit log is worthless — the actor could forge it. The
 *   frontend calls an action; the BACKEND, which authenticated the actor,
 *   writes the audit event from the server-side session. This catalogue is the
 *   contract for what the backend must record.
 */

/* ================================================================== *
 * The catalogue — every auditable action
 * ================================================================== */

/**
 * ⚠ Named `resource.action`, matching the permission that authorises it. An
 *   auditor reading the log sees the same vocabulary as the permission matrix.
 */
export const AUDIT_ACTIONS = [
  // products
  'product.created', 'product.updated', 'product.archived', 'product.duplicated', 'product.published',
  // inventory
  'inventory.adjusted', 'inventory.batch_updated',
  // orders
  'order.created_manual', 'order.status_changed', 'order.cancelled', 'order.refund_requested',
  'order.note_added', 'order.notification_resent',
  // payments
  'payment.reconciled', 'payment.marked_reviewed', 'payment.refund_requested',
  // customers
  'customer.note_added', 'customer.consent_changed', 'customer.data_export_requested',
  'customer.deletion_requested', 'customer.status_changed',
  // subscriptions
  'subscription.paused_by_admin', 'subscription.cancelled_by_admin', 'subscription.payment_retried',
  'subscription.changed_by_admin',
  // promotions
  'promotion.created', 'promotion.updated', 'promotion.deactivated',
  // delivery
  'delivery.zone_changed', 'delivery.config_updated',
  // content
  'content.updated', 'content.published', 'content.unpublished',
  // settings
  'settings.updated', 'settings.feature_flag_toggled',
  // staff
  'staff.invited', 'staff.role_changed', 'staff.deactivated',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/**
 * ⚠ REVERSIBILITY IS RECORDED, because the brief asks for "reversible behaviour
 *   where practical". Some actions can be cleanly undone (deactivate a promo,
 *   unpublish content); some cannot (a refund that already moved money). The
 *   catalogue marks which, so the UI can offer an undo only where it is honest.
 */
export type Reversibility = 'reversible' | 'irreversible' | 'compensating';
// compensating = cannot be undone, but a counter-action exists (e.g. re-issue after cancel)

const REVERSIBILITY: Record<AuditAction, Reversibility> = {
  'product.created': 'reversible',
  'product.updated': 'reversible',
  'product.archived': 'reversible',
  'product.duplicated': 'reversible',
  'product.published': 'reversible',
  'inventory.adjusted': 'compensating', // undo = an opposite adjustment, itself logged
  'inventory.batch_updated': 'reversible',
  'order.created_manual': 'compensating', // cancel the created order
  'order.status_changed': 'compensating', // some transitions can't reverse; see order machine
  'order.cancelled': 'irreversible',
  'order.refund_requested': 'irreversible', // money movement
  'order.note_added': 'reversible',
  'order.notification_resent': 'irreversible', // the message already left
  'payment.reconciled': 'reversible',
  'payment.marked_reviewed': 'reversible',
  'payment.refund_requested': 'irreversible',
  'customer.note_added': 'reversible',
  'customer.consent_changed': 'compensating', // a new consent event, never a deletion
  'customer.data_export_requested': 'irreversible',
  'customer.deletion_requested': 'irreversible',
  'customer.status_changed': 'reversible',
  'subscription.paused_by_admin': 'reversible',
  'subscription.cancelled_by_admin': 'compensating', // reactivate = new subscription
  'subscription.payment_retried': 'irreversible',
  'subscription.changed_by_admin': 'reversible',
  'promotion.created': 'reversible',
  'promotion.updated': 'reversible',
  'promotion.deactivated': 'reversible',
  'delivery.zone_changed': 'reversible',
  'delivery.config_updated': 'reversible',
  'content.updated': 'reversible',
  'content.published': 'reversible',
  'content.unpublished': 'reversible',
  'settings.updated': 'reversible',
  'settings.feature_flag_toggled': 'reversible',
  'staff.invited': 'reversible',
  'staff.role_changed': 'reversible',
  'staff.deactivated': 'reversible',
};

export const reversibilityOf = (action: AuditAction): Reversibility => REVERSIBILITY[action];

/* ================================================================== *
 * The event
 * ================================================================== */

export interface AuditEvent {
  readonly id: string;
  readonly action: AuditAction;
  /** WHO — the staff member, resolved server-side from the session. */
  readonly actorId: string;
  readonly actorName: string;
  readonly actorRole: string;
  /** WHAT was touched — a stable reference, e.g. "order:TS-2042". */
  readonly target: string;
  /** A human summary for the log view. */
  readonly summary: string;
  /**
   * ⚠ BEFORE/AFTER for mutations, where it makes sense. Enables an auditor to
   *   see exactly what changed. Money values stay as-is (never rounded/faked).
   *   Sensitive fields (a customer's full PII) are NOT copied here — the target
   *   reference is enough to look them up with proper authorisation.
   */
  readonly before: string | null;
  readonly after: string | null;
  readonly at: number; // epoch ms
  readonly reversibility: Reversibility;
}

export const auditActionLabel = (action: AuditAction): string => {
  const [resource, ...rest] = action.split('.');
  return `${resource}: ${rest.join('.').replace(/_/g, ' ')}`;
};

/** Group the catalogue by resource — used by the audit catalogue doc + UI filter. */
export const auditActionsByResource = (): Record<string, readonly AuditAction[]> => {
  const out: Record<string, AuditAction[]> = {};
  for (const a of AUDIT_ACTIONS) {
    const resource = a.split('.')[0];
    (out[resource] ??= []).push(a);
  }
  return out;
};
