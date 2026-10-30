import { NextRequest, NextResponse } from 'next/server';
import { getSessionToken, deleteSessionCookie, createSessionCookie } from '@/lib/server/session';
import { BACKEND_URL } from '@/lib/server/backendFetch';

const UNAUTHENTICATED = { data: { isAuthenticated: false, user: null } };

/**
 * 미인증 응답은 항상 __session을 지운다. 쿠키가 남아 있으면 미들웨어가 /login을 /main으로
 * 되돌려 AuthGuard와 서로 튕기며 빈 화면에 갇힌다.
 */
function unauthenticated(): NextResponse {
  const response = NextResponse.json(UNAUTHENTICATED);
  response.headers.append('Set-Cookie', deleteSessionCookie());
  return response;
}

/** 인증 여부를 판단할 수 없는 상태. 쿠키는 유지하고 AuthGuard가 재시도 화면을 띄운다. */
function unavailable(status = 503): NextResponse {
  return NextResponse.json({ error: 'Session verification failed' }, { status });
}

export async function GET(request: NextRequest) {
  const accessToken = await getSessionToken();

  if (!accessToken) {
    // 복호화 실패(키 교체·손상)도 여기로 온다
    return unauthenticated();
  }

  let springRes: Response;
  try {
    springRes = await fetch(`${BACKEND_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    return unavailable();
  }

  if (springRes.ok) {
    const springData = await springRes.json();
    return NextResponse.json({
      data: { isAuthenticated: true, user: springData.data },
    });
  }

  if (springRes.status !== 401) {
    return springRes.status >= 500 ? unavailable(springRes.status) : unauthenticated();
  }

  // 401 → refresh 시도
  const incomingCookie = request.headers.get('cookie') ?? '';
  let refreshRes: Response;
  try {
    refreshRes = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: incomingCookie },
    });
  } catch {
    return unavailable();
  }

  if (!refreshRes.ok) {
    return refreshRes.status >= 500 ? unavailable(refreshRes.status) : unauthenticated();
  }

  const refreshData = await refreshRes.json();
  const newAccessToken: string = refreshData.data.accessToken;
  // refresh_token은 이미 회전됐으므로 이후 결과와 상관없이 새 쿠키를 브라우저에 넘긴다
  const rotatedCookies = [
    createSessionCookie(newAccessToken),
    ...(refreshRes.headers.getSetCookie?.() ?? []),
  ];
  const withRotatedCookies = (response: NextResponse) => {
    for (const setCookie of rotatedCookies) response.headers.append('Set-Cookie', setCookie);
    return response;
  };

  let retryRes: Response;
  try {
    retryRes = await fetch(`${BACKEND_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${newAccessToken}` },
    });
  } catch {
    return withRotatedCookies(unavailable());
  }

  if (!retryRes.ok) {
    return retryRes.status >= 500 ? withRotatedCookies(unavailable(retryRes.status)) : unauthenticated();
  }

  const retryData = await retryRes.json();
  return withRotatedCookies(
    NextResponse.json({ data: { isAuthenticated: true, user: retryData.data } }),
  );
}
