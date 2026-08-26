import { ADMIN_ROUTES } from './api-paths';

const PUBLIC_ADMIN_PREFIXES = [ADMIN_ROUTES.login, ADMIN_ROUTES.forgotPassword] as const;

/**
 * Maps legacy /admin entry URLs to real dashboard routes.
 * Auth pages live under /admin/*; the app shell lives under /dashboard/*.
 */
export function resolveAdminReturnUrl(pathname: string | null | undefined): string {
  const fallback = ADMIN_ROUTES.dashboard;
  if (!pathname) return fallback;

  const path = pathname.split('?')[0]?.split('#')[0] ?? fallback;

  if (path === ADMIN_ROUTES.dashboard || path.startsWith(`${ADMIN_ROUTES.dashboard}/`)) {
    return path;
  }

  if (path === '/admin' || path === '/admin/') {
    return fallback;
  }

  if (path.startsWith('/admin/dashboard')) {
    const suffix = path.slice('/admin/dashboard'.length);
    return suffix ? `${ADMIN_ROUTES.dashboard}${suffix}` : fallback;
  }

  if (path.startsWith('/admin/')) {
    const isPublicAuth = PUBLIC_ADMIN_PREFIXES.some((prefix) => path.startsWith(prefix));
    if (isPublicAuth) return fallback;
    return fallback;
  }

  return fallback;
}

export function shouldRewriteAdminEntryPath(pathname: string): boolean {
  const path = pathname.split('?')[0] ?? pathname;
  return path === '/admin' || path === '/admin/' || path.startsWith('/admin/dashboard');
}
