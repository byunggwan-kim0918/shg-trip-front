import { NextRequest, NextResponse } from 'next/server';
import { createSessionCookie, deleteSessionCookie } from '@/lib/server/session';
import { BACKEND_URL } from '@/lib/server/backendFetch';

export async function POST(request: NextRequest) {
  const incomingCookie = request.headers.get('cookie') ?? '';

  const springRes = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      Cookie: incomingCookie,
    },
  });

  if (!springRes.ok) {
    const response = NextResponse.json(
      { error: 'Refresh failed' },
      { status: 401 },
    );
    response.headers.append('Set-Cookie', deleteSessionCookie());
    return response;
  }

  const springData = await springRes.json();
  const newAccessToken: string = springData.data.accessToken;

  const response = NextResponse.json({ data: { success: true } });

  // 새 __session 쿠키
  response.headers.append('Set-Cookie', createSessionCookie(newAccessToken));

  // Spring의 새 refresh_token Set-Cookie 전달
  const setCookieHeaders = springRes.headers.getSetCookie?.() ?? [];
  for (const setCookie of setCookieHeaders) {
    response.headers.append('Set-Cookie', setCookie);
  }

  return response;
}
