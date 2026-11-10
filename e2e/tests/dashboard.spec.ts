import { test, expect } from '../fixtures/auth';

/** 인증된 대시보드 + 헤더 위젯. 변형 없는 안전 검증 (실데이터 무변경). */
test.describe('dashboard & header (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/trips');
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
    await page.getByLabel('여행 검색', { exact: true }).fill('제주');
    // 검색 결과는 <li> 안의 <button> (사이드바 링크는 <a>라 구분됨)
    await expect(page.locator('li button').first()).toBeVisible({ timeout: 5000 });
  });

  test('avatar menu opens with 로그아웃', async ({ page }) => {
    await page.getByLabel('사용자 메뉴').first().click();
    // 아바타 드롭다운의 로그아웃 버튼은 aria-label이 없다 (사이드바 것과 구분)
    await expect(page.locator('button:not([aria-label])', { hasText: '로그아웃' })).toBeVisible();
  });

  test('목록을 불러오는 동안 빈 상태 대신 골격을 보여준다', async ({ page }) => {
    await page.route('**/api/proxy/itineraries?**', async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      await route.continue();
    });
    await page.goto('/app/trips');
    await expect(page.getByLabel('여행 목록을 불러오는 중')).toBeVisible();
    await expect(page.getByLabel('내 여행을 불러오는 중')).toBeVisible();
    await expect(page.getByText('여행이 쌓여요')).toHaveCount(0);
  });

  test('목록을 못 불러오면 빈 상태가 아니라 다시 시도를 보여준다', async ({ page }) => {
    let fail = true;
    await page.route('**/api/proxy/itineraries?**', (route) => (fail
      ? route.fulfill({ status: 500, contentType: 'application/json',
        body: JSON.stringify({ success: false, data: null, error: { code: 'COMMON_001', message: 'x' } }) })
      : route.continue()));
    await page.goto('/app/trips');

    await expect(page.getByText('내 여행을 불러오지 못했어요')).toBeVisible();
    await expect(page.getByText('목록을 불러오지 못했어요.')).toBeVisible();
    await expect(page.getByText('여행이 쌓여요')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: '어디로 떠나볼까요?' })).toHaveCount(0);
    await page.screenshot({ path: test.info().outputPath('list-error.png') });

    fail = false;
    await page.getByRole('button', { name: '다시 시도' }).last().click();
    await expect(page.getByRole('heading', { name: '내 여행', exact: true })).toBeVisible();
  });

  test('my-trips list renders trip cards with menus', async ({ page }) => {
    await page.goto('/app/trips');
    await expect(page.locator('button[aria-label="일정 메뉴"]').first()).toBeVisible({ timeout: 6000 });
  });
});
