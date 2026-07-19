/**
 * HTTP ADMIN ADAPTERS
 *
 * ⚠ NOT OPERATIONAL. NOT CONNECTED. NOT TESTED. [NN-04]
 *
 * The shape of the real admin backend, written so the handover is a swap. Every
 * method throws NotImplemented rather than returning a plausible fake — a fake
 * admin adapter that "works" would be actively dangerous, letting privileged
 * flows appear functional against nothing.
 *
 * ⚠ The backend that implements these MUST re-authorise every call from the
 *   server session (the frontend RBAC is UX only) and write an audit event for
 *   every mutation. See docs/38 (permission matrix) and docs/40 (audit catalogue).
 */

import type { AdminAdapters } from '../../ports/admin';
import { AppError } from '../../lib/errors';

const notImplemented = (method: string): never => {
  throw new AppError(
    'SERVER',
    'The admin backend is not connected yet.',
    new Error(`HttpAdminAdapters.${method} is not implemented (Gate G2). [NN-04]`)
  );
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const stub = (name: string): any =>
  new Proxy({}, { get: (_t, m: string) => () => notImplemented(`${name}.${String(m)}`) });
/* eslint-enable @typescript-eslint/no-explicit-any */

export const createHttpAdminAdapters = (): AdminAdapters => ({
  adminAuth: stub('adminAuth'),
  dashboard: stub('dashboard'),
  reporting: stub('reporting'),
  adminProducts: stub('adminProducts'),
  adminInventory: stub('adminInventory'),
  adminOrders: stub('adminOrders'),
  adminPayments: stub('adminPayments'),
  adminCustomers: stub('adminCustomers'),
  adminSubscriptions: stub('adminSubscriptions'),
  promotions: stub('promotions'),
  adminDelivery: stub('adminDelivery'),
  content: stub('content'),
  settings: stub('settings'),
  staff: stub('staff'),
  audit: stub('audit'),
});
