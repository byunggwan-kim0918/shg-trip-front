import { NextRequest, NextResponse } from 'next/server';
import { authBackendFetch } from '@/lib/server/backendFetch';

/**
 * 쿠키 정리 같은 BFF 처리가 붙어 있어 전용 라우트로만 불러야 하는 백엔드 경로.
 * 프록시로 탈퇴가 성공하면 세션 쿠키가 남아 화면이 로그인 상태로 남는다.
 */
const BFF_ONLY_PATHS = new Set(['/api/users/me/withdrawal']);

/** fetch가 보내기 전에 정규화하는 것과 같게 맞춰 "..", 중복 슬래시, 대소문자로 목록을 피하지 못하게 한다. */
function normalizePath(path: string): string {
  return new URL(path, 'http://bff.invalid').pathname.replace(/\/{2,}/g, '/').replace(/\/$/, '').toLowerCase();
}

async function handleProxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  // 라우트 파라미터는 한 번 디코딩된 값이라 %가 남아 있으면 이중 인코딩이다. 백엔드가 한 번 더 풀어
  // 차단 목록에 없는 모양으로 같은 경로에 닿을 수 있어 거부한다.
  if (path.some((segment) => segment.includes('%'))) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
  const backendPath = `/api/${path.join('/')}`;

  if (BFF_ONLY_PATHS.has(normalizePath(backendPath))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

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
    `${backendPath}${request.nextUrl.search}`,
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
