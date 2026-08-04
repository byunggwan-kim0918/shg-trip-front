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

  test('protected /main redirects anonymous user to /login', async ({ page }) => {
    await page.goto('/main');
    await expect(page).toHaveURL(/\/login/);
  });
});
