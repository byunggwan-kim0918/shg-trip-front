import { NextRequest, NextResponse } from 'next/server';
import { authBackendFetch } from '@/lib/server/backendFetch';

async function handleProxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const backendPath = `/api/${path.join('/')}`;

  // 요청 body 추출 (GET/HEAD는 body 없음)
  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text();
  }

  // Content-Type 전달
  const headers: Record<string, string> = {};
  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  const { response: springRes, cookies } = await authBackendFetch(
    backendPath,
    {
      method: request.method,
      headers,
      body: body || undefined,
    },
    request,
  );

  // Spring 응답을 그대로 전달
  const responseBody = await springRes.text();
  const response = new NextResponse(responseBody, {
    status: springRes.status,
    headers: {
      'Content-Type': springRes.headers.get('content-type') || 'application/json',
    },
  });

  // refresh 과정에서 발생한 Set-Cookie 전달
  for (const cookie of cookies) {
    response.headers.append('Set-Cookie', cookie);
  }

  return response;
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
