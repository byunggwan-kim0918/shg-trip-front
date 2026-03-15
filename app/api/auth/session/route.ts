import { NextRequest, NextResponse } from 'next/server';
import { getSessionToken, deleteSessionCookie, createSessionCookie } from '@/lib/server/session';
import { BACKEND_URL } from '@/lib/server/backendFetch';

const UNAUTHENTICATED = { data: { isAuthenticated: false, user: null } };

export async function GET(request: NextRequest) {
  const accessToken = await getSessionToken();

  if (!accessToken) {
    return NextResponse.json(UNAUTHENTICATED);
  }

  // Spring에 프로필 조회
  const springRes = await fetch(`${BACKEND_URL}/api/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (springRes.ok) {
    const springData = await springRes.json();
    return NextResponse.json({
      data: { isAuthenticated: true, user: springData.data },
    });
  }

  // 401 → refresh 시도
  if (springRes.status === 401) {
    const incomingCookie = request.headers.get('cookie') ?? '';

    const refreshRes = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: incomingCookie },
    });

    if (!refreshRes.ok) {
      const response = NextResponse.json(UNAUTHENTICATED);
      response.headers.append('Set-Cookie', deleteSessionCookie());
      return response;
    }

    const refreshData = await refreshRes.json();
    const newAccessToken: string = refreshData.data.accessToken;

    // 새 토큰으로 프로필 재조회
    const retryRes = await fetch(`${BACKEND_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${newAccessToken}` },
    });

    if (!retryRes.ok) {
      const response = NextResponse.json(UNAUTHENTICATED);
      response.headers.append('Set-Cookie', deleteSessionCookie());
      return response;
    }

    const retryData = await retryRes.json();
    const response = NextResponse.json({
      data: { isAuthenticated: true, user: retryData.data },
    });

    // 갱신된 쿠키 전달
    response.headers.append('Set-Cookie', createSessionCookie(newAccessToken));
    const setCookieHeaders = refreshRes.headers.getSetCookie?.() ?? [];
    for (const setCookie of setCookieHeaders) {
      response.headers.append('Set-Cookie', setCookie);
    }

    return response;
  }

  // 서버 에러 (5xx 등) → 인증 상태를 판단할 수 없으므로 에러로 응답
  return NextResponse.json(
    { error: 'Session verification failed' },
    { status: springRes.status },
  );
}
