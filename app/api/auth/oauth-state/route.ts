import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST() {
  const state = crypto.randomUUID();

  const response = NextResponse.json({ data: { state } });

  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });

  return response;
}
