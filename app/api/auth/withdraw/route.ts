import { NextRequest, NextResponse } from 'next/server';
import { deleteSessionCookie } from '@/lib/server/session';
import { authBackendFetch } from '@/lib/server/backendFetch';

/**
 * 되돌릴 수 없는 요청이라 SameSite 쿠키에만 기대지 않고 같은 출처인지 한 번 더 본다.
 * ALB가 TLS를 끝내 서버 쪽 프로토콜은 http로 보이므로 host만 비교한다.
 */
function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { response: springRes, cookies } = await authBackendFetch(
    '/api/users/me',
    { method: 'DELETE', body: await request.text() },
    request,
  );

  // 401은 이미 탈퇴됐거나 세션이 끝난 경우라 다시 시도해도 성공할 수 없으니 쿠키를 같이 지운다.
  if (!springRes.ok && springRes.status !== 401) {
    const res = new NextResponse(await springRes.text(), {
      status: springRes.status,
      headers: { 'Content-Type': springRes.headers.get('content-type') || 'application/json' },
    });
    for (const cookie of cookies) res.headers.append('Set-Cookie', cookie);
    return res;
  }

  const response = new NextResponse(null, { status: springRes.ok ? 204 : 401 });
  response.headers.append('Set-Cookie', deleteSessionCookie());
  response.headers.append('Set-Cookie', 'refresh_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
  return response;
}
