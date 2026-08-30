import { clientEnv } from '../config/env';
import { isNonProductionAppEnv } from '../config/runtime-env';

export const DEV_BYPASS_TOKEN = '__admin_dev_bypass__';

/**
 * Admin login bypass for local + staging VM testing.
 * Gated by APP_ENV only (development | staging). Production never enables this.
 * Nest admin calls go through /api/admin/nest (BFF) — API key stays server-side.
 */
export function isAdminDevBypassEnabled(): boolean {
  return isNonProductionAppEnv(clientEnv().NEXT_PUBLIC_APP_ENV);
}

/** When bypass is on, admin Nest CRUD uses the same-origin BFF (no client API key). */
export function shouldUseAdminNestBff(): boolean {
  return isAdminDevBypassEnabled();
}

export function isDevBypassSession(token: string | null | undefined): boolean {
  return token === DEV_BYPASS_TOKEN;
}

export function buildDevBypassStaff(email: string) {
  return {
    id: 'dev-bypass',
    email,
    name: 'Dev Admin (bypass)',
    roles: ['admin'],
  };
}

/** @deprecated Client never holds ADMIN_API_KEY — BFF injects it. Always null. */
export function getDevBypassApiKey(): string | null {
  return null;
}

export function isActiveDevBypassSession(token: string | null | undefined): boolean {
  return isAdminDevBypassEnabled() && isDevBypassSession(token);
}
