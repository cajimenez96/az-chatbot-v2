import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const PUBLIC_PATHS = ['/login', '/register'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Strip locale prefix to check if the path is public
  const pathnameWithoutLocale = pathname.replace(/^\/(es|en)/, '') || '/';
  const isPublic = PUBLIC_PATHS.some((p) => pathnameWithoutLocale.startsWith(p));
  const hasSession = request.cookies.has('refresh_token');

  const intlResponse = intlMiddleware(request);

  // After locale handling, enforce auth redirects
  const resolvedLocale = intlResponse.headers.get('x-next-intl-locale') ?? routing.defaultLocale;

  if (!isPublic && !hasSession && !pathnameWithoutLocale.startsWith('/login')) {
    const url = request.nextUrl.clone();
    url.pathname = `/${resolvedLocale}/login`;
    return NextResponse.redirect(url);
  }

  if (isPublic && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = `/${resolvedLocale}/dashboard`;
    return NextResponse.redirect(url);
  }

  return intlResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
