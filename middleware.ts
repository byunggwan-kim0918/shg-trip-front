import { NextRequest, NextResponse } from 'next/server';
import { RETURN_TO_PARAM, sanitizeReturnTo } from '@/lib/auth/returnTo';
import { APP_ROOT, ROUTES } from '@/lib/routes';

const AUTH_PAGES = ['/', '/login'];
const PROTECTED_PAGES = [APP_ROOT, '/onboarding'];

function loginUrl(request: NextRequest, returnTo: string | null): URL {
  const url = new URL('/login', request.url);
  if (returnTo) url.searchParams.set(RETURN_TO_PARAM, returnTo);
  return url;
}

export function middleware(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;
  // NEXT_PUBLIC_ 변수는 빌드 타임에 인라인돼 Edge Runtime에서 바꿀 수 없으므로
  // DEMO 우회는 클라이언트(AuthGuard)에서만 한다.
  const hasSession = request.cookies.has('__session');
  const returnTo = sanitizeReturnTo(searchParams.get(RETURN_TO_PARAM));

  // 세션 만료 시 쿠키를 강제로 지우고 /login으로 보낸다.
  if (searchParams.get('force') === 'true') {
    const response = NextResponse.redirect(loginUrl(request, returnTo));
    response.cookies.delete('__session');
    response.cookies.delete('refresh_token');
    return response;
  }

  if (hasSession) {
    const isAuthPage = pathname === '/' || AUTH_PAGES.some((p) => p !== '/' && pathname.startsWith(p));
    if (isAuthPage) {
      return NextResponse.redirect(new URL(returnTo ?? ROUTES.trips, request.url));
    }
  }

  if (!hasSession && PROTECTED_PAGES.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(loginUrl(request, sanitizeReturnTo(pathname + search)));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/callback/:path*', '/app/:path*', '/onboarding/:path*'],
};
