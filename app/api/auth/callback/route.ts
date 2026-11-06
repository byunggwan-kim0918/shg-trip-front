import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/server/backendFetch';
import { createSessionCookie } from '@/lib/server/session';

// response.cookies와 headers.append('Set-Cookie')를 섞으면 Next.js가 쿠키를 덮어쓴다.

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { provider, code } = body;

  if (!provider || !code) {
    return NextResponse.json(
      { error: 'provider and code are required' },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get('oauth_state')?.value;
  const clientState = body.state;

  if (!savedState || savedState !== clientState) {
    return NextResponse.json(
      { error: 'Invalid OAuth state' },
      { status: 400 },
    );
  }

  let springRes: Response;
  try {
    springRes = await backendFetch('/api/auth/oauth/callback', {
      method: 'POST',
      body: JSON.stringify({ provider, code }),
    });
  } catch {
    // 백엔드 미기동(ECONNREFUSED 등)은 스택트레이스를 노출하지 않고 502로 응답한다.
    return NextResponse.json(
      { error: 'Unable to reach authentication server' },
      { status: 502 },
    );
  }

  if (!springRes.ok) {
    const errorData = await springRes.json().catch(() => null);
    return NextResponse.json(
      { error: errorData?.error?.message || 'Authentication failed' },
      { status: springRes.status },
    );
  }

  const springData = await springRes.json();
  const { accessToken, isNewUser, user } = springData.data;

  const response = NextResponse.json({
    data: { isNewUser, user },
  });

  response.headers.append('Set-Cookie', createSessionCookie(accessToken));

  const setCookieHeaders = springRes.headers.getSetCookie?.() ?? [];
  for (const setCookie of setCookieHeaders) {
    response.headers.append('Set-Cookie', setCookie);
  }

  response.headers.append(
    'Set-Cookie',
    'oauth_state=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
  );

  return response;
}
