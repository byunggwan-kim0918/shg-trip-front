import { NextRequest, NextResponse } from 'next/server';
import { deleteSessionCookie } from '@/lib/server/session';
import { BACKEND_URL } from '@/lib/server/backendFetch';

export async function POST(request: NextRequest) {
  const incomingCookie = request.headers.get('cookie') ?? '';

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

  response.headers.append('Set-Cookie', deleteSessionCookie());

  response.headers.append(
    'Set-Cookie',
    'refresh_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
  );

  return response;
}
