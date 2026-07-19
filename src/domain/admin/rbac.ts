/**
 * ROLE-BASED ACCESS CONTROL
 *
 * ⚠ THE MOST IMPORTANT SENTENCE IN THIS FILE:
 *   **THESE CHECKS ARE A UX CONVENIENCE. THEY ARE NOT SECURITY.**
 *
 *   Everything here decides what a staff member SEES — which nav items, which
 *   buttons, which pages don't 403. None of it PROTECTS anything, because it all
 *   runs in a browser the user controls. A determined user can flip any of these
 *   booleans in devtools.
 *
 *   THE BACKEND MUST ENFORCE EVERY PERMISSION INDEPENDENTLY, on every request,
 *   from the session — never trusting a field the client sent. The frontend
 *   guard and the backend guard are two separate implementations of the same
 *   matrix; this file is the frontend one, and it exists so staff don't see
 *   buttons that would just fail. The permission matrix doc (`38_...`) is the
 *   shared source of truth both must implement.
 *
 * ⚠ FAIL CLOSED. An unknown role, or a permission not in the matrix, is DENIED.
 *   The default answer to "can this person do this?" is no.
 */

/* ================================================================== *
 * Roles — ⛔ D-57 (who actually holds these is a client decision)
 * ================================================================== */

export const ROLES = [
  'super_admin',
  'store_manager',
  'order_manager',
  'inventory_manager',
  'content_editor',
  'customer_care',
  'marketing',
  'finance_analyst', // read-only analyst / finance
] as const;

export type Role = (typeof ROLES)[number];

export const roleLabel = (r: Role): string =>
  ({
    super_admin: 'Super Administrator',
    store_manager: 'Store Manager',
    order_manager: 'Order Manager',
    inventory_manager: 'Inventory Manager',
    content_editor: 'Content Editor',
    customer_care: 'Customer Care',
    marketing: 'Marketing',
    finance_analyst: 'Finance / Analyst (read-only)',
  })[r];

export const roleDescription = (r: Role): string =>
  ({
    super_admin: 'Full control, including staff and settings. Use sparingly.',
    store_manager: 'Runs the store day to day — products, orders, inventory, promotions.',
    order_manager: 'Processes and fulfils orders; cannot change products or prices.',
    inventory_manager: 'Adjusts stock and manages batches; read-only on orders.',
    content_editor: 'Edits site content and the journal; no commercial access.',
    customer_care: 'Helps customers — views orders and profiles, resends notifications.',
    marketing: 'Manages promotions and marketing content; no order or finance access.',
    finance_analyst: 'Reads reports and payments; changes nothing.',
  })[r];

/* ================================================================== *
 * Permissions — the verbs, grouped by resource
 * ================================================================== */

/**
 * ⚠ NAMED AS resource.action. This is the vocabulary the backend must mirror
 *   exactly, so a frontend `can('order.refund')` and a backend middleware
 *   `require('order.refund')` are checking the SAME string.
 */
export const PERMISSIONS = [
  // dashboard
  'dashboard.view',
  // products
  'product.view', 'product.create', 'product.edit', 'product.archive', 'product.duplicate',
  // inventory
  'inventory.view', 'inventory.adjust', 'inventory.export',
  // orders
  'order.view', 'order.fulfil', 'order.cancel', 'order.refund', 'order.create_manual', 'order.note',
  // payments
  'payment.view', 'payment.reconcile', 'payment.export',
  // customers
  'customer.view', 'customer.note', 'customer.manage_consent', 'customer.handle_data_request',
  // subscriptions
  'subscription.view', 'subscription.manage', 'subscription.retry_payment',
  // promotions
  'promotion.view', 'promotion.create', 'promotion.edit', 'promotion.deactivate',
  // delivery
  'delivery.view', 'delivery.edit',
  // content
  'content.view', 'content.edit', 'content.publish',
  // settings
  'settings.view', 'settings.edit', 'settings.feature_flags',
  // staff (super admin only)
  'staff.view', 'staff.manage',
  // reporting
  'report.view', 'report.export',
  // audit
  'audit.view',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/* ================================================================== *
 * The matrix — role → permissions
 *
 * ⚠ This is the single source of truth the backend must replicate. Read it as
 *   "what is the LEAST this role needs?", not "what can we give them?". Every
 *   grant is a deliberate decision; the finance analyst is read-only on purpose.
 * ================================================================== */

// Helpers to keep the matrix readable.
const ALL: readonly Permission[] = PERMISSIONS;

const VIEW_ONLY: readonly Permission[] = [
  'dashboard.view', 'product.view', 'inventory.view', 'order.view',
  'payment.view', 'customer.view', 'subscription.view', 'promotion.view',
  'delivery.view', 'content.view', 'settings.view', 'report.view',
];

const MATRIX: Record<Role, readonly Permission[]> = {
  // Full control. The only role that can touch staff and feature flags.
  super_admin: ALL,

  // Runs the store, but NOT staff management or feature flags (those are
  // super-admin-only, because they change who can do what and what's live).
  store_manager: [
    'dashboard.view',
    'product.view', 'product.create', 'product.edit', 'product.archive', 'product.duplicate',
    'inventory.view', 'inventory.adjust', 'inventory.export',
    'order.view', 'order.fulfil', 'order.cancel', 'order.refund', 'order.create_manual', 'order.note',
    'payment.view', 'payment.reconcile', 'payment.export',
    'customer.view', 'customer.note',
    'subscription.view', 'subscription.manage', 'subscription.retry_payment',
    'promotion.view', 'promotion.create', 'promotion.edit', 'promotion.deactivate',
    'delivery.view', 'delivery.edit',
    'content.view', 'content.edit', 'content.publish',
    'settings.view', 'settings.edit',
    'report.view', 'report.export',
    'audit.view',
  ],

  // Fulfilment focus. Can process orders and notes, view payments, but CANNOT
  // change products, prices, or refund (refunds move money → higher bar).
  order_manager: [
    'dashboard.view',
    'product.view',
    'inventory.view',
    'order.view', 'order.fulfil', 'order.cancel', 'order.create_manual', 'order.note',
    'payment.view',
    'customer.view', 'customer.note',
    'subscription.view',
    'delivery.view',
    'report.view',
  ],

  // Stock focus. Adjusts inventory and exports it; read-only on orders so they
  // can see demand, but changes nothing commercial.
  inventory_manager: [
    'dashboard.view',
    'product.view',
    'inventory.view', 'inventory.adjust', 'inventory.export',
    'order.view',
    'delivery.view',
    'report.view',
  ],

  // Content only. No commercial access at all.
  content_editor: [
    'dashboard.view',
    'content.view', 'content.edit', 'content.publish',
    'product.view', // to reference products in content
  ],

  // Customer-facing help. Sees orders/customers, resends notifications, handles
  // data requests and consent — but cannot refund or change products.
  customer_care: [
    'dashboard.view',
    'order.view', 'order.note',
    'customer.view', 'customer.note', 'customer.manage_consent', 'customer.handle_data_request',
    'subscription.view', 'subscription.manage',
    'product.view',
    'payment.view',
  ],

  // Promotions and marketing content. No order/finance/customer-PII beyond
  // consent for marketing purposes.
  marketing: [
    'dashboard.view',
    'promotion.view', 'promotion.create', 'promotion.edit', 'promotion.deactivate',
    'content.view', 'content.edit', 'content.publish',
    'product.view',
    'report.view',
  ],

  // ⚠ READ-ONLY. Every permission is a *.view or report.*. This role changes
  //   NOTHING — it is the safe default for a finance stakeholder or analyst.
  finance_analyst: [
    ...VIEW_ONLY,
    'payment.export',
    'report.view', 'report.export',
    'audit.view',
  ],
};

/* ================================================================== *
 * The check — pure, fail-closed
 * ================================================================== */

export interface StaffMember {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: Role;
  readonly active: boolean;
}

/**
 * ⚠ THE ONE FUNCTION EVERYTHING GUARDS WITH. Pure, total, fail-closed.
 *   An inactive staff member can do nothing. An unknown role can do nothing.
 */
export const can = (staff: StaffMember | null, permission: Permission): boolean => {
  if (!staff || !staff.active) return false;
  const granted = MATRIX[staff.role];
  if (!granted) return false; // unknown role → denied
  return granted.includes(permission);
};

/** Convenience: does this role have ANY of these permissions? (for nav visibility) */
export const canAny = (staff: StaffMember | null, permissions: readonly Permission[]): boolean =>
  permissions.some((p) => can(staff, p));

/** The full permission set for a role — used by the matrix doc + admin staff UI. */
export const permissionsForRole = (role: Role): readonly Permission[] => MATRIX[role] ?? [];

/** Is this permission a mutating (non-view) action? Drives "needs confirmation". */
export const isMutating = (permission: Permission): boolean =>
  !permission.endsWith('.view') && permission !== 'report.export' && permission !== 'payment.export' && permission !== 'inventory.export';

export const permissionLabel = (p: Permission): string => {
  const [resource, action] = p.split('.');
  return `${action.replace(/_/g, ' ')} ${resource.replace(/_/g, ' ')}`;
};
