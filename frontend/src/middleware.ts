import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  resolveAdminReturnUrl,
  shouldRewriteAdminEntryPath,
} from './lib/admin/admin-return-url';

const COOKIE_NAME = 'tabasamu.admin.token';
const LOGIN = '/admin/login';
const DASHBOARD = '/dashboard';

const PUBLIC_ADMIN_PATHS = [LOGIN, '/admin/forgot-password'];

function apiCspOrigin(): string | null {
  const raw = (
    process.env.TABASAMU_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ''
  ).trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

function useHttpsHardening(): boolean {
  const appEnv =
    process.env.TABASAMU_APP_ENV || process.env.NEXT_PUBLIC_APP_ENV || '';
  const isProd =
    (process.env.NODE_ENV === 'production' &&
      appEnv !== 'development' &&
      appEnv !== 'staging') ||
    appEnv === 'production';
  const appUrl = (
    process.env.TABASAMU_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ''
  ).trim();
  return isProd && appUrl.startsWith('https://');
}

/** Apply Portainer-updatable CSP / HSTS on the response. */
function applySecurityHeaders(response: NextResponse): NextResponse {
  const origin = apiCspOrigin();
  const httpsHardening = useHttpsHardening();

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: http://localhost:9000 http://127.0.0.1:9000${origin ? ` ${origin}` : ''}`,
    `font-src 'self'`,
    `connect-src 'self' http://localhost:9000 http://127.0.0.1:9000${origin ? ` ${origin}` : ''}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    ...(httpsHardening ? [`upgrade-insecure-requests`] : []),
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set(
    'Strict-Transport-Security',
    httpsHardening ? 'max-age=63072000; includeSubDomains; preload' : 'max-age=0'
  );
  return response;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (shouldRewriteAdminEntryPath(pathname)) {
    const destination = resolveAdminReturnUrl(pathname);
    if (destination !== pathname) {
      if (token) {
        return applySecurityHeaders(
          NextResponse.redirect(new URL(destination, req.url))
        );
      }

      const loginUrl = new URL(LOGIN, req.url);
      loginUrl.searchParams.set('returnUrl', destination);
      return applySecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  const isPublicAdmin = PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p));
  const isProtected =
    pathname.startsWith(DASHBOARD) || (pathname.startsWith('/admin') && !isPublicAdmin);

  if (token && pathname === LOGIN) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL(DASHBOARD, req.url))
    );
  }

  if (!token && isProtected) {
    const loginUrl = new URL(LOGIN, req.url);
    loginUrl.searchParams.set('returnUrl', resolveAdminReturnUrl(pathname));
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  // Admin auth matchers + storefront (CSP). Skip static / runtime-env.
  matcher: [
    '/dashboard/:path*',
    '/admin',
    '/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico|runtime-env\\.js|fonts/|brand/|products/|api/).*)',
  ],
};
