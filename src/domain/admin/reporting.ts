/**
 * REPORTING & DASHBOARD METRICS
 *
 * ⚠ SHAPES AND A CSV CONTRACT — NOT INVENTED NUMBERS.
 *
 *   This module defines what a report LOOKS LIKE and how it EXPORTS. The actual
 *   figures come from the backend against real data. The mock produces plausible
 *   demo numbers so the UI is buildable, and every such number is clearly demo
 *   data, never presented as real business performance. [NN-05]
 *
 * ⚠ ANYTHING DEPENDING ON A BLOCKED DECISION IS `Unavailable`, NOT ZERO.
 *   Revenue depends on approved prices (⛔ D-14) and tax status (⛔ D-16). A
 *   dashboard that shows "KES 0 revenue" because prices aren't set is worse than
 *   one that says "awaiting price confirmation" — the first looks like failure,
 *   the second tells the truth.
 */

import { type Money } from '../shared';
import { type Pending } from '../catalogue';

/* ================================================================== *
 * Dashboard metrics
 * ================================================================== */

/**
 * ⚠ The dashboard is the brief's "not a decorative dashboard" test. Every metric
 *   here maps to a real operational question a manager asks each morning.
 */
export interface DashboardMetrics {
  // Revenue — ⛔ Pending, because it depends on approved prices (D-14) + tax (D-16).
  readonly revenueToday: Pending<Money>;
  readonly revenue7d: Pending<Money>;
  readonly revenue30d: Pending<Money>;
  readonly averageOrderValue: Pending<Money>;

  // Orders — these are COUNTS, which don't depend on price, so they're real.
  readonly ordersToday: number;
  readonly orders7d: number;
  readonly ordersPaid: number;
  readonly ordersPending: number;
  readonly ordersPendingFulfilment: number;

  // Payment split — counts by provider.
  readonly mpesaCount: number;
  readonly cardCount: number;
  readonly failedPayments: number;

  // Customers.
  readonly newCustomers7d: number;
  readonly returningCustomers7d: number;

  // Operational alerts.
  readonly lowStockCount: number;
  readonly outOfStockCount: number;

  // Subscription health.
  readonly subscriptionsActive: number;
  readonly subscriptionsPaused: number;
  readonly subscriptionsPastDue: number;
  readonly renewalsUpcoming7d: number;
}

export interface ProductPerformanceRow {
  readonly variantId: string;
  readonly name: string;
  readonly unitsSold: number;
  /** ⛔ Revenue Pending — depends on price (D-14). */
  readonly revenue: Pending<Money>;
}

export interface ActivityEntry {
  readonly at: number;
  readonly summary: string;
  readonly kind: 'order' | 'payment' | 'stock' | 'customer' | 'admin';
}

/* ================================================================== *
 * Reports — the catalogue
 * ================================================================== */

export const REPORT_TYPES = [
  'sales',
  'product',
  'customer',
  'payment',
  'discount',
  'subscription',
  'inventory',
  'delivery',
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export const reportLabel = (t: ReportType): string =>
  ({
    sales: 'Sales',
    product: 'Product performance',
    customer: 'Customers',
    payment: 'Payments',
    discount: 'Discounts',
    subscription: 'Subscriptions',
    inventory: 'Inventory',
    delivery: 'Delivery',
  })[t];

export interface DateRange {
  readonly from: number; // epoch ms
  readonly to: number;
}

/**
 * ⚠ A REPORT IS COLUMNS + ROWS + A CSV CONTRACT.
 *   The generic shape means one CSV exporter serves every report. Each report
 *   type declares its columns; the backend fills the rows. Money columns carry a
 *   `Pending` marker so a blocked value exports as "awaiting confirmation", not
 *   a fabricated figure.
 */
export interface ReportColumn {
  readonly key: string;
  readonly label: string;
  readonly type: 'text' | 'number' | 'money' | 'date';
}

export interface ReportSchema {
  readonly type: ReportType;
  readonly columns: readonly ReportColumn[];
}

export interface ReportResult {
  readonly schema: ReportSchema;
  readonly range: DateRange;
  readonly rows: readonly Readonly<Record<string, string | number>>[];
  /** ⛔ Notes on which columns are blocked (e.g. "revenue awaiting D-14"). */
  readonly caveats: readonly string[];
}

/* ================================================================== *
 * CSV contract
 * ================================================================== */

/**
 * ⚠ THE CSV CONTRACT. A single, tested serialiser used by every export.
 *
 *   The subtle correctness here is ESCAPING: a field containing a comma, a
 *   quote, or a newline must be quoted and its quotes doubled, or the CSV
 *   corrupts silently — and a corrupt finance export is discovered at the worst
 *   possible time. This is exactly the kind of thing that belongs in the domain,
 *   tested, not improvised in a component.
 */
export const escapeCsvField = (value: string | number): string => {
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

export const toCsv = (
  columns: readonly ReportColumn[],
  rows: readonly Readonly<Record<string, string | number>>[]
): string => {
  const header = columns.map((c) => escapeCsvField(c.label)).join(',');
  const body = rows.map((row) =>
    columns.map((c) => escapeCsvField(row[c.key] ?? '')).join(',')
  );
  // ⚠ CRLF line endings — Excel on Windows (the finance team's tool) expects them.
  return [header, ...body].join('\r\n');
};

/** The column schemas per report type — the reporting-schema doc renders these. */
export const REPORT_SCHEMAS: Record<ReportType, readonly ReportColumn[]> = {
  sales: [
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'orders', label: 'Orders', type: 'number' },
    { key: 'units', label: 'Units', type: 'number' },
    { key: 'revenue', label: 'Revenue', type: 'money' }, // ⛔ D-14
  ],
  product: [
    { key: 'name', label: 'Product', type: 'text' },
    { key: 'sku', label: 'SKU', type: 'text' },
    { key: 'units', label: 'Units sold', type: 'number' },
    { key: 'revenue', label: 'Revenue', type: 'money' }, // ⛔ D-14
  ],
  customer: [
    { key: 'name', label: 'Customer', type: 'text' },
    { key: 'orders', label: 'Orders', type: 'number' },
    { key: 'ltv', label: 'Lifetime value', type: 'money' }, // ⛔ D-14
    { key: 'joined', label: 'Joined', type: 'date' },
  ],
  payment: [
    { key: 'reference', label: 'Reference', type: 'text' },
    { key: 'provider', label: 'Provider', type: 'text' },
    { key: 'status', label: 'Status', type: 'text' },
    { key: 'amount', label: 'Amount', type: 'money' },
    { key: 'date', label: 'Date', type: 'date' },
  ],
  discount: [
    { key: 'code', label: 'Code', type: 'text' },
    { key: 'used', label: 'Times used', type: 'number' },
    { key: 'status', label: 'Status', type: 'text' },
  ],
  subscription: [
    { key: 'id', label: 'Subscription', type: 'text' },
    { key: 'status', label: 'Status', type: 'text' },
    { key: 'frequency', label: 'Frequency', type: 'text' },
    { key: 'cycles', label: 'Cycles', type: 'number' },
  ],
  inventory: [
    { key: 'name', label: 'Product', type: 'text' },
    { key: 'sku', label: 'SKU', type: 'text' },
    { key: 'onHand', label: 'On hand', type: 'number' },
    { key: 'reserved', label: 'Reserved', type: 'number' },
    { key: 'available', label: 'Available', type: 'number' },
  ],
  delivery: [
    { key: 'zone', label: 'Zone', type: 'text' },
    { key: 'orders', label: 'Orders', type: 'number' },
    { key: 'fee', label: 'Fee', type: 'money' }, // ⛔ D-22
  ],
};
