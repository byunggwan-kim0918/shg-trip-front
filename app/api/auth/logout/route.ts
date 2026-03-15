import { NextRequest, NextResponse } from 'next/server';
import { deleteSessionCookie } from '@/lib/server/session';
import { BACKEND_URL } from '@/lib/server/backendFetch';

export async function POST(request: NextRequest) {
  const incomingCookie = request.headers.get('cookie') ?? '';

  // Spring에 로그아웃 요청 (refresh_token 쿠키 전달)
  try {
    await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: incomingCookie,
      },
    });
  } catch (error) {
    console.error('Spring logout request failed:', error);
  }

  const response = NextResponse.json({ data: { success: true } });

  // __session 쿠키 삭제
  response.headers.append('Set-Cookie', deleteSessionCookie());

  // refresh_token 쿠키 삭제 (headers.append와 response.cookies 혼용 방지)
  response.headers.append(
    'Set-Cookie',
    'refresh_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
  );

  return response;
}
