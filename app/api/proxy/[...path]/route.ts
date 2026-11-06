import { NextRequest, NextResponse } from 'next/server';
import { authBackendFetch } from '@/lib/server/backendFetch';

async function handleProxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const backendPath = `/api/${path.join('/')}`;

  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text();
  }

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

  // SSE는 버퍼링하면 이벤트가 늦게 도착하므로 스트림 그대로 넘긴다.
  // 바이너리는 text로 바꾸면 깨지므로 arrayBuffer로 넘긴다.
  const resContentType = springRes.headers.get('content-type') || 'application/json';
  const isSSE = resContentType.includes('text/event-stream');
  const isBinary = resContentType.startsWith('image/') || resContentType === 'application/octet-stream';

  let responseBody: ReadableStream<Uint8Array> | ArrayBuffer | string | null;
  if (isSSE) {
    responseBody = springRes.body;
  } else if (isBinary) {
    responseBody = await springRes.arrayBuffer();
  } else {
    responseBody = await springRes.text();
  }

  // 204/205/304에 body를 넘기면 Response 생성자가 예외를 던진다.
  const isNoBodyStatus = springRes.status === 204 || springRes.status === 205 || springRes.status === 304;

  const response = new NextResponse(isNoBodyStatus ? null : responseBody, {
    status: springRes.status,
    headers: {
      'Content-Type': resContentType,
      ...(isSSE && {
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',  // nginx가 SSE를 버퍼링하지 않게 한다
      }),
      ...(isBinary && {
        'Cache-Control': 'public, max-age=86400',
      }),
    },
  });

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
