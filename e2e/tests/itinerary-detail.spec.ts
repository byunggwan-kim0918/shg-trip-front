import { test, expect } from '../fixtures/auth';

/**
 * 일정 상세 — 읽기 전용(비변형) 검증. 실데이터를 바꾸지 않으므로 반복 실행 안전.
 * 변형 동작(대안 선택/편집/삭제)은 full-flow.spec.ts의 스로어웨이 일정에서 검증한다.
 */
test.describe('itinerary detail (read-only)', () => {
  test('renders + day tabs + alternative panel expands', async ({ page }) => {
    const res = await page.request.get('/api/proxy/itineraries?page=0&size=1');
    const first = (await res.json())?.data?.content?.[0];
    test.skip(!first, '테스트 유저에 일정이 없어 건너뜀');

    await page.goto(`/main/itinerary/${first.id}`);
    await expect(page.locator('h1').first()).toBeVisible();

    // Day 탭 전환 (비변형)
    const tabs = page.getByRole('tab');
    if ((await tabs.count()) > 1) {
      await tabs.nth(1).click();
      await expect(tabs.nth(1)).toBeVisible();
    }

    // 대안 패널 펼치기 (비변형 — 선택은 하지 않음)
    const altToggle = page.locator('button', { hasText: /대안 \d+개 보기/ });
    if (await altToggle.count()) {
      await altToggle.first().scrollIntoViewIfNeeded();
      await altToggle.first().click();
      await expect(page.locator('p', { hasText: '이 시간대 대안' }).first()).toBeVisible();
    }
  });

  test('card "···" menu opens with a 삭제 item', async ({ page }) => {
    await page.goto('/main/my-trips');
    const menu = page.locator('button[aria-label="일정 메뉴"]').first();
    await expect(menu).toBeVisible({ timeout: 6000 });
    await menu.click();
    await expect(page.locator('div.absolute button', { hasText: '삭제' }).first()).toBeVisible();
  });
});
