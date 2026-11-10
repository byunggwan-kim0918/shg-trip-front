import { test, expect } from '@playwright/test';

/** 비인증 공개 surface — 세션 없이 접근 가능한 화면과 라우팅 가드. */
test.describe('public surface (anonymous)', () => {
  test('landing page renders without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e.message)));
    await page.goto('/');
    await expect(page).toHaveTitle(/SHG trip/i);
    await expect(page.locator('body')).not.toBeEmpty();
    expect(errors, `page errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('login page shows a login control', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button').first()).toBeVisible();
  });

  test('protected /app redirects anonymous user to /login', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveURL(/\/login/);
  });

  test('/app은 여행 목록으로 보낸다', async ({ request }) => {
    const res = await request.get('/app', { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    expect(res.headers().location).toBe('/app/trips');
  });

  test('옛 /main 주소는 쿼리를 유지한 채 새 주소로 영구 이동한다', async ({ request }) => {
    const cases: Array<[string, string]> = [
      ['/main', '/app/trips'],
      ['/main/my-trips', '/app/trips'],
      ['/main/plan/new?focus=CITY', '/app/trips/new?focus=CITY'],
      ['/main/itinerary/loading', '/app/trips/generating'],
      ['/main/itinerary/42', '/app/trips/42'],
      ['/main/whatever', '/app/trips'],
    ];
    for (const [from, to] of cases) {
      const res = await request.get(from, { maxRedirects: 0 });
      expect(res.status(), from).toBe(308);
      expect(res.headers().location, from).toBe(to);
    }
  });
});
