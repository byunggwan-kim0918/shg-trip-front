import { test, expect } from '../fixtures/auth';

/** 인증된 대시보드 + 헤더 위젯. 변형 없는 안전 검증 (실데이터 무변경). */
test.describe('dashboard & header (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/main');
  });

  test('dashboard loads with content and avatar', async ({ page }) => {
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page.getByLabel('사용자 메뉴').first()).toBeVisible();
  });

  test('theme toggle flips light/dark', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /다크 모드로 전환|라이트 모드로 전환/ });
    const nameBefore = await toggle.getAttribute('aria-label');
    const nameAfter = nameBefore === '다크 모드로 전환' ? '라이트 모드로 전환' : '다크 모드로 전환';
    await toggle.click();
    await expect(page.getByRole('button', { name: nameAfter })).toBeVisible();
  });

  test('header search returns matching trips', async ({ page }) => {
    await page.getByLabel('여행 검색').fill('제주');
    // 검색 결과는 <li> 안의 <button> (사이드바 링크는 <a>라 구분됨)
    await expect(page.locator('li button').first()).toBeVisible({ timeout: 5000 });
  });

  test('avatar menu opens with 로그아웃', async ({ page }) => {
    await page.getByLabel('사용자 메뉴').first().click();
    // 아바타 드롭다운의 로그아웃 버튼은 aria-label이 없다 (사이드바 것과 구분)
    await expect(page.locator('button:not([aria-label])', { hasText: '로그아웃' })).toBeVisible();
  });

  test('my-trips list renders trip cards with menus', async ({ page }) => {
    await page.goto('/main/my-trips');
    await expect(page.locator('button[aria-label="일정 메뉴"]').first()).toBeVisible({ timeout: 6000 });
  });
});
