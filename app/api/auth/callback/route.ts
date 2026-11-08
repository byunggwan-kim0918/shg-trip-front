import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authBackendFetch, backendFetch } from '@/lib/server/backendFetch';
import { createSessionCookie, deleteSessionCookie } from '@/lib/server/session';
import { OAUTH_PURPOSE_COOKIE, clearOAuthPurposeCookie } from '@/lib/server/oauthPurpose';

const CLEAR_STATE_COOKIE = 'oauth_state=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax';

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

  if (cookieStore.get(OAUTH_PURPOSE_COOKIE)?.value === 'withdraw') {
    return withdraw(request, provider, code);
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

  response.headers.append('Set-Cookie', CLEAR_STATE_COOKIE);

  return response;
}

/** 재로그인으로 받은 code는 로그인 세션을 새로 만들지 않고 탈퇴 본인 확인에만 쓴다. */
async function withdraw(request: NextRequest, provider: string, code: string) {
  let result;
  try {
    result = await authBackendFetch(
      '/api/users/me/withdrawal',
      { method: 'POST', body: JSON.stringify({ provider, code }) },
      request,
    );
  } catch {
    return NextResponse.json({ error: 'Unable to reach authentication server' }, { status: 502 });
  }
  const { response: springRes, cookies: refreshedCookies } = result;

  const response = springRes.ok
    ? NextResponse.json({ data: { withdrawn: true } })
    : await withdrawalError(springRes);

  if (springRes.ok) {
    response.headers.append('Set-Cookie', deleteSessionCookie());
    response.headers.append('Set-Cookie', 'refresh_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
  } else {
    for (const cookie of refreshedCookies) response.headers.append('Set-Cookie', cookie);
  }
  response.headers.append('Set-Cookie', CLEAR_STATE_COOKIE);
  response.headers.append('Set-Cookie', clearOAuthPurposeCookie());
  return response;
}

async function withdrawalError(springRes: Response) {
  const error = (await springRes.json().catch(() => null))?.error;
  return NextResponse.json(
    { error: error?.message || 'Withdrawal failed', code: error?.code ?? null },
    { status: springRes.status },
  );
}
