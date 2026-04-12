/**
 * 백엔드 API 이미지 URL을 BFF 프록시 경로로 변환.
 * <img src>는 authFetch를 거치지 않으므로 /api/proxy/ 경로로 직접 요청해야 함.
 * 예: /api/places/1/photo → /api/proxy/places/1/photo
 */
export function proxyImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('/api/') && !url.startsWith('/api/proxy/')) {
    return url.replace(/^\/api\//, '/api/proxy/');
  }
  return url;
}
