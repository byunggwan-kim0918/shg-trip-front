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
  // SSE(text/event-stream)는 body를 버퍼링하지 않고 스트리밍으로 전달
  // 이미지 등 바이너리 응답은 arrayBuffer로 전달 (text 변환 시 깨짐 방지)
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

  // 204/205/304는 스펙상 body를 가질 수 없음 — 전달 시 Response 생성자가 예외를 던진다
  const isNoBodyStatus = springRes.status === 204 || springRes.status === 205 || springRes.status === 304;

  const response = new NextResponse(isNoBodyStatus ? null : responseBody, {
    status: springRes.status,
    headers: {
      'Content-Type': resContentType,
      ...(isSSE && {
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',  // nginx 버퍼링 비활성화
      }),
      ...(isBinary && {
        'Cache-Control': 'public, max-age=86400',  // 이미지 1일 캐싱
      }),
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
