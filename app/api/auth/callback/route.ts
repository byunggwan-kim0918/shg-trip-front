import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/server/backendFetch';
import { createSessionCookie } from '@/lib/server/session';

// NOTE: 이 파일에서 response.cookies API를 사용하지 않는다.
// response.headers.append('Set-Cookie', ...) 와 response.cookies를 혼용하면
// response.cookies가 수동 추가한 Set-Cookie 헤더를 덮어쓰는 Next.js 이슈가 있다.

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { provider, code } = body;

  if (!provider || !code) {
    return NextResponse.json(
      { error: 'provider and code are required' },
      { status: 400 },
    );
  }

  // oauth_state 쿠키 검증
  const cookieStore = await cookies();
  const savedState = cookieStore.get('oauth_state')?.value;
  const clientState = body.state;

  if (!savedState || savedState !== clientState) {
    return NextResponse.json(
      { error: 'Invalid OAuth state' },
      { status: 400 },
    );
  }

  // Spring에 OAuth 콜백 요청
  const springRes = await backendFetch('/api/auth/oauth/callback', {
    method: 'POST',
    body: JSON.stringify({ provider, code }),
  });

  if (!springRes.ok) {
    const errorData = await springRes.json().catch(() => null);
    return NextResponse.json(
      { error: errorData?.error?.message || 'Authentication failed' },
      { status: springRes.status },
    );
  }

  const springData = await springRes.json();
  const { accessToken, isNewUser, user } = springData.data;

  // 응답 생성 (accessToken은 클라이언트에 노출하지 않음)
  const response = NextResponse.json({
    data: { isNewUser, user },
  });

  // __session 쿠키 설정 (암호화된 accessToken)
  response.headers.append('Set-Cookie', createSessionCookie(accessToken));

  // Spring의 refresh_token Set-Cookie 전달
  const setCookieHeaders = springRes.headers.getSetCookie?.() ?? [];
  for (const setCookie of setCookieHeaders) {
    response.headers.append('Set-Cookie', setCookie);
  }

  // oauth_state 쿠키 삭제 (response.cookies API와 headers.append 혼용 시 덮어쓰기 문제 방지)
  response.headers.append(
    'Set-Cookie',
    'oauth_state=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
  );

  return response;
}
