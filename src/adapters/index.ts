/**
 * THE COMPOSITION ROOT
 *
 * This is the ONLY place in the application where a concrete adapter is
 * chosen. Everything above this line depends on the PORT INTERFACES, never on
 * an implementation.
 *
 * ⚠ THE G2 HANDOVER IS A ONE-LINE ENVIRONMENT CHANGE:
 *      NEXT_PUBLIC_ADAPTERS=mock  →  NEXT_PUBLIC_ADAPTERS=http
 *
 *   The acceptance test for the handover is that the full flow suite runs
 *   green against BOTH, with zero changes above this file. If it does not,
 *   backend logic has leaked upward — and that is caught here, not in
 *   production. [R-13, NN-06]
 */

import type { Adapters } from '../ports';
import { clientEnv } from '../lib/config/env';
import { createMockAdapters } from './mock';
import { createHttpAdapters } from './http';

let cached: Adapters | null = null;

export const getAdapters = (): Adapters => {
  if (cached) return cached;
  const mode = clientEnv().NEXT_PUBLIC_ADAPTERS;
  cached = mode === 'http'
    ? createHttpAdapters()
    : createMockAdapters();
  return cached;
};

/** Test seam — inject a stub set. */
export const setAdapters = (a: Adapters): void => {
  cached = a;
};

export const resetAdapters = (): void => {
  cached = null;
};
