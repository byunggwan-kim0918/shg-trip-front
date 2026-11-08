import { getSessionToken, createSessionCookie } from './session';

export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

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

/** cookies는 BFF가 브라우저로 넘겨야 할 Set-Cookie 목록이다. */
export interface AuthFetchResult {
  response: Response;
  cookies: string[];
}

/**
 * 401이면 refresh_token 쿠키로 1회 갱신 후 재시도하고, 새 __session + refresh_token Set-Cookie를 cookies에 담는다.
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

  const refreshResult = await tryRefresh(request);
  if (!refreshResult) {
    return { response: res, cookies: outCookies };
  }

  outCookies.push(...refreshResult.cookies);

  const retryRes = await backendFetch(path, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${refreshResult.accessToken}`,
    },
  });

  return { response: retryRes, cookies: outCookies };
}

/** 성공 시 새 accessToken과 브라우저에 넘길 Set-Cookie 목록을 반환한다. */
async function tryRefresh(
  request: Request,
): Promise<{ accessToken: string; cookies: string[] } | null> {
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

  cookies.push(createSessionCookie(newAccessToken));

  const setCookieHeaders = refreshRes.headers.getSetCookie?.() ?? [];
  cookies.push(...setCookieHeaders);

  return { accessToken: newAccessToken, cookies };
}
