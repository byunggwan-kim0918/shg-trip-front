import { getSessionToken, createSessionCookie } from './session';

export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

/**
 * Spring API에 요청을 보내는 기본 fetch 래퍼.
 * 인증 헤더 없이 순수 요청만 전달한다.
 */
export async function backendFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

/**
 * authBackendFetch의 결과.
 * Spring 응답 + BFF에서 브라우저로 전달해야 할 Set-Cookie 헤더 목록.
 */
export interface AuthFetchResult {
  response: Response;
  cookies: string[];
}

/**
 * 인증이 필요한 Spring API 요청.
 * - __session 쿠키에서 access token을 꺼내 Authorization 헤더에 추가
 * - 401 시 refresh_token 쿠키로 갱신 후 재시도 (1회)
 * - 갱신 시 새로운 __session + refresh_token Set-Cookie를 cookies 배열에 포함
 */
export async function authBackendFetch(
  path: string,
  options: RequestInit = {},
  request: Request,
): Promise<AuthFetchResult> {
  const accessToken = await getSessionToken();
  const outCookies: string[] = [];

  if (!accessToken) {
    return {
      response: new Response(JSON.stringify({ error: 'No session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
      cookies: outCookies,
    };
  }

  // 1차 요청
  const res = await backendFetch(path, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status !== 401) {
    return { response: res, cookies: outCookies };
  }

  // 401 → refresh 시도
  const refreshResult = await tryRefresh(request);
  if (!refreshResult) {
    return { response: res, cookies: outCookies };
  }

  outCookies.push(...refreshResult.cookies);

  // 새 토큰으로 재시도
  const retryRes = await backendFetch(path, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${refreshResult.accessToken}`,
    },
  });

  return { response: retryRes, cookies: outCookies };
}

/**
 * refresh_token 쿠키를 사용하여 Spring에 토큰 갱신 요청.
 * 성공 시 새 accessToken과 브라우저에 전달할 Set-Cookie 목록 반환.
 */
async function tryRefresh(
  request: Request,
): Promise<{ accessToken: string; cookies: string[] } | null> {
  // 브라우저에서 온 쿠키 중 refresh_token을 Spring에 전달
  const incomingCookie = request.headers.get('cookie') ?? '';

  const refreshRes = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      Cookie: incomingCookie,
    },
  });

  if (!refreshRes.ok) return null;

  const { data } = await refreshRes.json();
  const newAccessToken: string = data.accessToken;

  const cookies: string[] = [];

  // 새 __session 쿠키
  cookies.push(createSessionCookie(newAccessToken));

  // Spring이 보낸 refresh_token Set-Cookie 전달
  const setCookieHeaders = refreshRes.headers.getSetCookie?.() ?? [];
  cookies.push(...setCookieHeaders);

  return { accessToken: newAccessToken, cookies };
}
