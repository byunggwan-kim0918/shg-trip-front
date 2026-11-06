/** JWT는 BFF가 관리하고 401이면 서버가 refresh하므로 클라이언트는 Authorization 헤더·refresh를 다루지 않는다. */

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

export function forceLogout() {
  fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  }).finally(() => {
    window.location.href = '/login';
  });
}

/** /api/auth/는 이미 BFF 핸들러라 변환하지 않는다. */
function toProxyUrl(url: string): string {
  if (!url.startsWith('/')) return url;
  if (url.startsWith('/api/auth/')) return url;
  if (url.startsWith('/api/')) return url.replace(/^\/api\//, '/api/proxy/');
  return url;
}
