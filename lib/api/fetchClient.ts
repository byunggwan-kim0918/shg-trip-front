/**
 * BFF 프록시를 통한 인증 API 요청 래퍼.
 * - 서버 측에서 JWT를 관리하므로 클라이언트는 Authorization 헤더를 다루지 않음
 * - 쿠키 기반 인증 (credentials: 'include')
 * - 401 응답 시 서버에서 refresh를 시도하므로 클라이언트에서 refresh 로직 불필요
 */

/**
 * 인증이 필요한 API 호출 래퍼.
 * /api/ 경로를 /api/proxy/로 변환하여 BFF를 거치도록 한다.
 * (/api/auth/는 이미 BFF 핸들러이므로 변환하지 않음)
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const proxyUrl = toProxyUrl(url);

  const res = await fetch(proxyUrl, {
    ...options,
    credentials: 'include',
  });

  if (res.status === 401) {
    forceLogout();
    return new Promise(() => {});
  }

  return res;
}

/** BFF 로그아웃 → 쿠키 삭제 → 로그인 페이지 이동 */
export function forceLogout() {
  fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  }).finally(() => {
    window.location.href = '/login';
  });
}

/**
 * /api/... → /api/proxy/... 변환.
 * /api/auth/는 BFF 핸들러이므로 변환하지 않는다.
 */
function toProxyUrl(url: string): string {
  if (!url.startsWith('/')) return url;
  if (url.startsWith('/api/auth/')) return url;
  if (url.startsWith('/api/')) return url.replace(/^\/api\//, '/api/proxy/');
  return url;
}
