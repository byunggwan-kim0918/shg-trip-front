/**
 * 로그인 후 돌아갈 경로. OAuth는 redirect_uri가 고정이라 쿼리로 실어 보낼 수 없어
 * 로그인 버튼을 누를 때 sessionStorage에 두고 콜백에서 꺼낸다.
 */
export const RETURN_TO_PARAM = 'returnTo';
const RETURN_TO_STORAGE_KEY = 'shg_login_return_to';

/**
 * 같은 오리진의 /main 하위 상대 경로만 통과시킨다(open redirect 방지).
 * `//evil.com`, `/\evil.com`은 브라우저가 프로토콜 상대 URL로 해석하므로 URL 파싱 결과로 판정한다.
 */
export function sanitizeReturnTo(value: string | null | undefined): string | null {
  if (!value || value.length > 512 || !value.startsWith('/')) return null;
  if (/[\\\u0000-\u001f]/.test(value)) return null;

  const base = 'http://return-to.invalid';
  let url: URL;
  try {
    url = new URL(value, base);
  } catch {
    return null;
  }
  if (url.origin !== base) return null;
  if (url.pathname !== '/main' && !url.pathname.startsWith('/main/')) return null;

  return `${url.pathname}${url.search}`;
}

export function saveReturnTo(value: string | null): void {
  try {
    const safe = sanitizeReturnTo(value);
    if (safe) sessionStorage.setItem(RETURN_TO_STORAGE_KEY, safe);
    else sessionStorage.removeItem(RETURN_TO_STORAGE_KEY);
  } catch {
    /* 저장소 차단 시 /main으로 떨어진다 */
  }
}

export function consumeReturnTo(): string | null {
  try {
    const value = sessionStorage.getItem(RETURN_TO_STORAGE_KEY);
    sessionStorage.removeItem(RETURN_TO_STORAGE_KEY);
    return sanitizeReturnTo(value);
  } catch {
    return null;
  }
}
