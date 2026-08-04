import { test as base, expect } from '@playwright/test';
import { mintSessionCookie } from './session';

/**
 * 인증된 테스트. context에 위조된 __session 쿠키를 주입해 실제 로그인 유저처럼 동작한다.
 * 공유 링크 복사 검증을 위해 clipboard 권한도 부여한다.
 */
export const test = base.extend({
  context: async ({ context, baseURL }, use) => {
    const url = new URL(baseURL ?? 'http://localhost:3000');
    await context.addCookies([
      {
        name: '__session',
        value: mintSessionCookie(),
        domain: url.hostname,
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    try {
      await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: url.origin });
    } catch {
      /* 일부 브라우저는 미지원 — 무시 */
    }
    await use(context);
  },
});

export { expect };
