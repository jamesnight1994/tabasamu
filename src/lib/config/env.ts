/**
 * ENVIRONMENT CONFIGURATION
 *
 * ⚠ NN-03: NO SECRET EVER ENTERS THE FRONTEND BUNDLE.
 *
 * Only `NEXT_PUBLIC_*` variables are readable by the client. Every payment
 * credential, API secret and webhook signing key is SERVER-ONLY and is
 * accessed exclusively through `serverEnv()`, which throws if called in the
 * browser.
 *
 * Verified at build time by `scripts/check-secrets.mjs`, which scans the
 * built bundle for credential-shaped strings and FAILS THE BUILD on a hit.
 */

import { z } from 'zod';

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
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_ADAPTERS: process.env.NEXT_PUBLIC_ADAPTERS,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
    NEXT_PUBLIC_ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED,
    NEXT_PUBLIC_LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL,
  });
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
 *   `NEXT_PUBLIC_*` value (e.g. toggling analytics on) and have the next
 *   `clientEnv()` re-read `process.env`. Never called in application code —
 *   the cache is correct at runtime, where env is fixed for the process.
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
