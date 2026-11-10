'use client';

import { useEffect } from 'react';
import './globals.css';

const CHUNK_LOAD_ERROR = /ChunkLoadError|Loading (CSS )?chunk|Failed to load chunk/;
const RELOAD_AT_KEY = 'chunk-reload-at';
// 새로고침 뒤에도 같은 청크가 없으면 무한 새로고침이 된다.
const RELOAD_COOLDOWN_MS = 10_000;

function reloadOnceForChunkError(error: Error) {
  if (!CHUNK_LOAD_ERROR.test(`${error.name} ${error.message}`)) return;
  try {
    const last = Number(sessionStorage.getItem(RELOAD_AT_KEY) ?? 0);
    if (Date.now() - last < RELOAD_COOLDOWN_MS) return;
    sessionStorage.setItem(RELOAD_AT_KEY, String(Date.now()));
  } catch {
    return;
  }
  window.location.reload();
}

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    reloadOnceForChunkError(error);
  }, [error]);

  return (
    <html lang="ko">
      <head>
        <title>화면을 불러오지 못했어요 · SHG trip</title>
      </head>
      <body className="antialiased">
        <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
          <div className="flex w-full max-w-[380px] flex-col items-start text-left">
            <h1 className="text-[23px] font-extrabold tracking-[-0.02em] text-foreground">
              화면을 불러오지 못했어요
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              잠시 후 다시 시도해 주세요. 계속되면 홈에서 다시 들어와 주세요.
            </p>
            <div className="mt-8 flex gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-[10px] bg-accent px-5 py-3 text-sm font-bold text-accent-fg transition-[filter] hover:brightness-105"
              >
                다시 시도
              </button>
              <button
                type="button"
                onClick={() => window.location.assign('/')}
                className="rounded-[10px] px-5 py-3 text-sm font-bold text-muted hover:text-foreground"
              >
                홈으로 가기
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
