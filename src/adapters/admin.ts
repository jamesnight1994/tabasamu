/**
 * THE ADMIN COMPOSITION ROOT
 *
 * ⚠ Same G2 seam as the storefront: mock today, http when the backend arrives.
 *   The admin adapters are SEPARATE from the storefront ones because they carry
 *   privileged operations that must be independently authorised server-side.
 *   Keeping them separate makes it impossible to accidentally hand a storefront
 *   component an admin mutation.
 */

import type { AdminAdapters } from '../ports/admin';
import { clientEnv } from '../lib/config/env';
import { createMockAdminAdapters } from './mock/admin';
import { createHttpAdminAdapters } from './http/admin';

let cached: AdminAdapters | null = null;

export const getAdminAdapters = (): AdminAdapters => {
  if (cached) return cached;
  cached = clientEnv().NEXT_PUBLIC_ADAPTERS === 'http'
    ? createHttpAdminAdapters()
    : createMockAdminAdapters();
  return cached;
};

export const setAdminAdapters = (a: AdminAdapters): void => { cached = a; };
export const resetAdminAdapters = (): void => { cached = null; };
