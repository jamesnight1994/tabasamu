import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'tabasamu.admin.token';
const LOGIN = '/admin/login';
const DASHBOARD = '/dashboard';

const PUBLIC_ADMIN_PATHS = [LOGIN, '/admin/forgot-password'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;

  const isPublicAdmin = PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p));
  const isProtected =
    pathname.startsWith(DASHBOARD) || (pathname.startsWith('/admin') && !isPublicAdmin);

  if (token && pathname === LOGIN) {
    return NextResponse.redirect(new URL(DASHBOARD, req.url));
  }

  if (!token && isProtected) {
    const loginUrl = new URL(LOGIN, req.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
