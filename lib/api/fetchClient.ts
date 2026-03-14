/**
 * 인증이 필요한 API 요청을 위한 공통 fetch 래퍼.
 * - access token을 Authorization 헤더에 자동 첨부
 * - 401 응답 시 refresh 시도 → 성공하면 재요청, 실패하면 /login으로 리다이렉트
 * - 동시 다발적 401에 대한 refresh 요청 중복 방지 (single-flight)
 */

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) return null;

    const { data } = await res.json();
    sessionStorage.setItem('access_token', data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

/** refresh 요청 중복 방지 (single-flight pattern) */
export function getRefreshPromise(): Promise<string | null> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = refreshAccessToken().finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });
  }
  return refreshPromise!;
}

export function forceLogout() {
  sessionStorage.removeItem('access_token');

  // 백엔드에 로그아웃 요청 (쿠키 삭제는 서버가 처리)
  fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  }).finally(() => {
    // force=true → middleware에서 쿠키 강제 삭제
    window.location.href = '/login?force=true';
  });
}

/** 인증 API 호출 래퍼. 401 시 자동 refresh → 재요청 → 실패 시 forceLogout */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const accessToken = sessionStorage.getItem('access_token');

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (res.status !== 401) return res;

  // 401 → refresh 시도
  const newToken = await getRefreshPromise();
  if (!newToken) {
    forceLogout();
    return res;
  }

  // 새 토큰으로 재요청
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
      Authorization: `Bearer ${newToken}`,
    },
  });
}
