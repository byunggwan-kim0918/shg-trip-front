import { NextRequest, NextResponse } from 'next/server';
import { RETURN_TO_PARAM, sanitizeReturnTo } from '@/lib/auth/returnTo';

const AUTH_PAGES = ['/', '/login'];
const PROTECTED_PAGES = ['/main', '/onboarding'];

function loginUrl(request: NextRequest, returnTo: string | null): URL {
  const url = new URL('/login', request.url);
  if (returnTo) url.searchParams.set(RETURN_TO_PARAM, returnTo);
  return url;
}

export function middleware(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;
  // NEXT_PUBLIC_ 변수는 빌드 타임 인라인 — Edge Runtime에서 런타임 변경 불가.
  // 미들웨어 레벨 DEMO 우회는 제거하고 클라이언트(AuthGuard)에서만 처리.
  const hasSession = request.cookies.has('__session');
  const returnTo = sanitizeReturnTo(searchParams.get(RETURN_TO_PARAM));

  // force=true: 세션 만료 → 쿠키 강제 삭제 후 /login으로
  if (searchParams.get('force') === 'true') {
    const response = NextResponse.redirect(loginUrl(request, returnTo));
    response.cookies.delete('__session');
    response.cookies.delete('refresh_token');
    return response;
  }

  // 로그인된 유저가 랜딩/로그인 페이지 접근 → /main으로 리다이렉트
  if (hasSession) {
    const isAuthPage = pathname === '/' || AUTH_PAGES.some((p) => p !== '/' && pathname.startsWith(p));
    if (isAuthPage) {
      return NextResponse.redirect(new URL(returnTo ?? '/main', request.url));
    }
  }

  // 비로그인 유저가 보호된 페이지 접근 → /login으로 리다이렉트
  if (!hasSession && PROTECTED_PAGES.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(loginUrl(request, sanitizeReturnTo(pathname + search)));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/callback/:path*', '/main/:path*', '/onboarding/:path*'],
};
