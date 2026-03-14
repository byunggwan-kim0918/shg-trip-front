import { NextRequest, NextResponse } from 'next/server';

const AUTH_PAGES = ['/', '/login', '/callback'];
const PROTECTED_PAGES = ['/main', '/onboarding'];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const hasRefreshToken = request.cookies.has('refresh_token');

  // force=true: 클라이언트에서 refresh 실패 → 쿠키 강제 삭제 후 /login으로
  if (searchParams.get('force') === 'true') {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('refresh_token');
    return response;
  }

  // 로그인된 유저가 랜딩/로그인 페이지 접근 → /main으로 리다이렉트
  if (hasRefreshToken) {
    const isAuthPage = pathname === '/' || AUTH_PAGES.some((p) => p !== '/' && pathname.startsWith(p));
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/main', request.url));
    }
  }

  // 비로그인 유저가 보호된 페이지 접근 → /login으로 리다이렉트
  if (!hasRefreshToken && PROTECTED_PAGES.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/callback/:path*', '/main/:path*', '/onboarding/:path*'],
};
