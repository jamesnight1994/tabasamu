/**
 * Runtime public config injected by docker-entrypoint.prod.sh → /runtime-env.js.
 * Local `yarn dev` falls back to NEXT_PUBLIC_* from .env.local.
 */

export type TabasamuRuntimeEnv = {
  appEnv: string;
  appUrl: string;
  apiUrl: string;
  adapters: string;
  analyticsEnabled: string;
  logLevel: string;
  medusaPublishableKey: string;
};

declare global {
  interface Window {
    __TABASAMU__?: Partial<TabasamuRuntimeEnv>;
  }
}

const fromWindow = (): Partial<TabasamuRuntimeEnv> => {
  if (typeof window === 'undefined') return {};
  return window.__TABASAMU__ ?? {};
};

/** Prefer TABASAMU_* (Docker/Portainer), then NEXT_PUBLIC_* (local .env.local). */
export const resolvePublicEnv = (): {
  NEXT_PUBLIC_APP_URL: string | undefined;
  NEXT_PUBLIC_APP_ENV: string | undefined;
  NEXT_PUBLIC_ADAPTERS: string | undefined;
  NEXT_PUBLIC_API_URL: string | undefined;
  NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: string | undefined;
  NEXT_PUBLIC_ANALYTICS_ENABLED: string | undefined;
  NEXT_PUBLIC_LOG_LEVEL: string | undefined;
} => {
  const w = fromWindow();
  const isServer = typeof window === 'undefined';

  const pick = (
    _runtimeKey: keyof TabasamuRuntimeEnv,
    tabasamu: string | undefined,
    nextPublic: string | undefined,
    windowVal: string | undefined
  ): string | undefined => {
    // Browser: runtime-env.js wins when present (Portainer recreate).
    if (!isServer && windowVal !== undefined && windowVal !== '') return windowVal;
    // Docker/Portainer process env (server always; also jsdom/tests).
    if (tabasamu !== undefined && tabasamu !== '') return tabasamu;
    if (nextPublic !== undefined && nextPublic !== '') return nextPublic;
    return undefined;
  };

  return {
    NEXT_PUBLIC_APP_URL: pick(
      'appUrl',
      process.env.TABASAMU_PUBLIC_APP_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      w.appUrl
    ),
    NEXT_PUBLIC_APP_ENV: pick(
      'appEnv',
      process.env.TABASAMU_APP_ENV,
      process.env.NEXT_PUBLIC_APP_ENV,
      w.appEnv
    ),
    NEXT_PUBLIC_ADAPTERS: pick(
      'adapters',
      process.env.TABASAMU_ADAPTERS,
      process.env.NEXT_PUBLIC_ADAPTERS,
      w.adapters
    ),
    NEXT_PUBLIC_API_URL: pick(
      'apiUrl',
      process.env.TABASAMU_PUBLIC_API_URL,
      process.env.NEXT_PUBLIC_API_URL,
      w.apiUrl
    ),
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: pick(
      'medusaPublishableKey',
      process.env.TABASAMU_MEDUSA_PUBLISHABLE_KEY,
      process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
      w.medusaPublishableKey
    ),
    NEXT_PUBLIC_ANALYTICS_ENABLED: pick(
      'analyticsEnabled',
      process.env.TABASAMU_ANALYTICS_ENABLED,
      process.env.NEXT_PUBLIC_ANALYTICS_ENABLED,
      w.analyticsEnabled
    ),
    NEXT_PUBLIC_LOG_LEVEL: pick(
      'logLevel',
      process.env.TABASAMU_LOG_LEVEL,
      process.env.NEXT_PUBLIC_LOG_LEVEL,
      w.logLevel
    ),
  };
};

/** Nest URL for server-side fetches (SSR, BFF). Never exposed to the browser. */
export const resolveNestApiUrl = (): string => {
  const nest = process.env.NEST_API_URL?.trim();
  if (nest) return nest.replace(/\/$/, '');
  const publicUrl =
    process.env.TABASAMU_PUBLIC_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    '';
  return publicUrl.replace(/\/$/, '');
};

export const isNonProductionAppEnv = (env: string | undefined): boolean =>
  env === 'development' || env === 'staging';
