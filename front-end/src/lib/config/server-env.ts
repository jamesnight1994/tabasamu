import 'server-only';

/**
 * SERVER-ONLY ENVIRONMENT
 *
 * ⚠ `import 'server-only'` makes this a BUILD ERROR if any client component
 *   ever imports it — the failure is loud, immediate, and impossible to miss,
 *   rather than a silent credential leak discovered in production.
 *
 * ⛔ Every value below is a PLACEHOLDER. None has been supplied by the client,
 *    and none is invented. Each traces to an open decision:
 *      D-31 / D-32  M-PESA shortcode + Daraja credentials
 *      D-34 / D-35  card rail credentials — and whether Stripe is viable at all
 *      D-40 / D-41  email + SMS providers
 */

import { z } from 'zod';

/**
 * ⛔ Every value below is a PLACEHOLDER. None has been supplied, and none is
 *    invented. See `.env.example`. Related open decisions:
 *      D-31 / D-32  M-PESA shortcode + Daraja credentials
 *      D-34 / D-35  card rail credentials — and whether Stripe is viable at all
 *      D-40 / D-41  email + SMS providers
 */
const serverSchema = z.object({
  // --- M-PESA / Daraja ---  ⛔ D-31, D-32
  MPESA_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
  MPESA_CONSUMER_KEY: z.string().optional(),
  MPESA_CONSUMER_SECRET: z.string().optional(),
  MPESA_PASSKEY: z.string().optional(),
  MPESA_SHORTCODE: z.string().optional(),
  MPESA_CALLBACK_URL: z.string().optional(),

  // --- card rail ---  ⛔ D-34, D-35 — Stripe may not settle KES for a KE entity
  CARD_PROVIDER: z.enum(['none', 'stripe', 'flutterwave', 'pesapal', 'dpo']).default('none'),
  CARD_PUBLIC_KEY: z.string().optional(),
  CARD_SECRET_KEY: z.string().optional(),
  CARD_WEBHOOK_SECRET: z.string().optional(),

  // --- notifications ---  ⛔ D-40, D-41
  EMAIL_PROVIDER: z.string().optional(),
  EMAIL_API_KEY: z.string().optional(),
  SMS_PROVIDER: z.string().optional(),
  SMS_API_KEY: z.string().optional(),

  // --- backend ---
  API_BASE_URL: z.string().optional(),
  API_SERVICE_TOKEN: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  SESSION_SECRET: z.string().optional(),
  /** Prefer for server-side fetches inside Docker (e.g. http://medusa:9000). */
  MEDUSA_BACKEND_URL: z.string().optional(),
  /** Server fallback; prefer NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY in the browser. */
  MEDUSA_PUBLISHABLE_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

export const serverEnv = (): ServerEnv => {
  if (typeof window !== 'undefined') {
    throw new Error(
      'serverEnv() was called in the browser. Secrets must never reach the client bundle. [NN-03]'
    );
  }
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid server environment:\n${parsed.error.message}`);
  }
  return parsed.data;
};

