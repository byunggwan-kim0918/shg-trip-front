import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { OAUTH_PURPOSE_COOKIE } from '@/lib/server/oauthPurpose';

const STATE_MAX_AGE_SECONDS = 600;

export async function POST(request: NextRequest) {
  const state = crypto.randomUUID();
  const body = await request.json().catch(() => null);
  const withdraw = body?.purpose === 'withdraw';

  const response = NextResponse.json({ data: { state } });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: STATE_MAX_AGE_SECONDS,
  };
  response.cookies.set('oauth_state', state, cookieOptions);
  // 로그인 시작은 이전 탈퇴 시도의 표시를 지워야 일반 로그인이 탈퇴로 처리되지 않는다.
  if (withdraw) {
    response.cookies.set(OAUTH_PURPOSE_COOKIE, 'withdraw', cookieOptions);
  } else {
    response.cookies.delete(OAUTH_PURPOSE_COOKIE);
  }

  return response;
}
