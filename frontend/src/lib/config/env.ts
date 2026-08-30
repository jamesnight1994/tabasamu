/**
 * ENVIRONMENT CONFIGURATION
 *
 * ⚠ NN-03: NO SECRET EVER ENTERS THE FRONTEND BUNDLE.
 *
 * Public config is readable via `clientEnv()`. In Docker/Portainer, values come
 * from `TABASAMU_*` (written to `/runtime-env.js` at container start). Locally,
 * `NEXT_PUBLIC_*` from `.env.local` is used.
 *
 * Secrets (ADMIN_API_KEY, payment keys, …) are SERVER-ONLY via `serverEnv()`.
 *
 * Verified at build time by `scripts/check-secrets.mjs`, which scans the
 * built bundle for credential-shaped strings and FAILS THE BUILD on a hit.
 */

import { z } from 'zod';
import { resolvePublicEnv } from './runtime-env';

/* ---------------- client (safe, bundled) ---------------- */

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  /** 'mock' until the backend exists. Flipping this to 'http' IS the G2 handover. */
  NEXT_PUBLIC_ADAPTERS: z.enum(['mock', 'http']).default('mock'),
  NEXT_PUBLIC_API_URL: z.string().default(''),
  /** Medusa publishable key — safe for the browser (Store API). */
  NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: z.string().default(''),
  NEXT_PUBLIC_ANALYTICS_ENABLED: z.enum(['true', 'false']).default('false'),
  NEXT_PUBLIC_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),
});

export type ClientEnv = z.infer<typeof clientSchema>;

let _client: ClientEnv | null = null;

export const clientEnv = (): ClientEnv => {
  if (_client) return _client;
  const resolved = resolvePublicEnv();
  const parsed = clientSchema.safeParse(resolved);
  if (!parsed.success) {
    throw new Error(`Invalid client environment:\n${parsed.error.message}`);
  }
  _client = parsed.data;
  return _client;
};

export const isProduction = (): boolean => clientEnv().NEXT_PUBLIC_APP_ENV === 'production';
export const usingMocks = (): boolean => clientEnv().NEXT_PUBLIC_ADAPTERS === 'mock';

/**
 * ⚠ TEST-ONLY. Clears the memoised client env so a test can vary a
 *   `NEXT_PUBLIC_*` / `TABASAMU_*` value and have the next `clientEnv()`
 *   re-read. Never called in application code.
 */
export const resetClientEnv = (): void => {
  _client = null;
};

/**
 * ⚠ THE SERVER SCHEMA IS NOT IN THIS FILE.
 *
 *   It lives in `./server-env.ts`, which carries `import 'server-only'`.
 *
 *   WHY THE SPLIT MATTERS. This module is imported by the logger, which is
 *   imported by client components. If the server schema lived here too, the
 *   entire server-env schema would be pulled into the CLIENT bundle by that
 *   import chain — as `scripts/check-secrets.mjs` correctly detected.
 *
 *   Today that would only ship harmless field NAMES. But the moment anyone
 *   writes `MPESA_PASSKEY: z.string().default('...')`, that default becomes a
 *   real credential sitting in a public JavaScript file. Splitting the modules
 *   makes that mistake structurally impossible rather than merely discouraged.
 *   [NN-03]
 */
