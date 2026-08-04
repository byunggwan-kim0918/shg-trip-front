import { defineConfig, devices } from '@playwright/test';

/**
 * E2E 설정.
 * 전제: 프론트(:3000)·백엔드(:8080)·docker(postgres/redis) 실행 중.
 * 세션은 e2e/fixtures/session.ts가 .env.local / ../shg-trip-back/.env 의 시크릿으로 런타임 위조.
 *
 * 실행:
 *   npm run e2e        # 기본 — 생성/변형 없는 안전 검증 (실데이터 무변경, 쿼터 소모 X)
 *   npm run e2e:full   # 생성 포함 전체 플로우 (스로어웨이 자동 생성→검증→자동 삭제)
 *   npm run e2e:gen    # 생성 플로우만
 *   npm run e2e:report # 마지막 HTML 리포트 열기
 */
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e/tests',
  // 단일 테스트 유저·단일 서버 공유 → 직렬 실행으로 상호 간섭 방지.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    locale: 'ko-KR',
    viewport: { width: 1440, height: 950 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
