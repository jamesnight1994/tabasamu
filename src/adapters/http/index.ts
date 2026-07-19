/**
 * HTTP ADAPTERS
 *
 * ⚠ NOT OPERATIONAL. NOT CONNECTED. NOT TESTED. [NN-04]
 *
 * This is the SHAPE of the real adapter set, written now so that the
 * handover at Gate G2 is a swap and not a rewrite. Every method throws
 * `NotImplemented` rather than returning a plausible-looking fake, because a
 * silently-fake HTTP adapter is worse than an absent one: it would let the
 * G2 acceptance test pass against nothing.
 *
 * The backend developer implements these against the endpoint contract in
 * `docs/12_Backend_Handover_Requirements.md`.
 */

import type { Adapters } from '../../ports';
import { AppError } from '../../lib/errors';

const notImplemented = (method: string): never => {
  throw new AppError(
    'SERVER',
    'This part of the site is not connected yet.',
    new Error(
      `HttpAdapters.${method} is not implemented. The backend does not exist yet (Gate G2). [NN-04]`
    )
  );
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const stub = (name: string): any =>
  new Proxy(
    {},
    {
      get: (_t, method: string) => () => notImplemented(`${name}.${String(method)}`),
    }
  );
/* eslint-enable @typescript-eslint/no-explicit-any */

export const createHttpAdapters = (): Adapters => ({
  products: stub('products'),
  collections: stub('collections'),
  bundles: stub('bundles'),
  inventory: stub('inventory'),
  carts: stub('carts'),
  delivery: stub('delivery'),
  discounts: stub('discounts'),
  orders: stub('orders'),
  payments: stub('payments'),
  checkout: stub('checkout'),
  notifications: stub('notifications'),
  auth: stub('auth'),
  customer: stub('customer'),
  addresses: stub('addresses'),
  subscriptions: stub('subscriptions'),
  preferences: stub('preferences'),
});
