import { test, expect } from '../fixtures/auth';
import { mintSessionCookie } from '../fixtures/session';

/**
 * @generation — 실제 생성을 포함한 전체 사용자 플로우.
 * 스로어웨이 일정을 대화로 입력해 생성 → 대안선택 → 제목편집 → 공유 → 확정 → 스톱삭제,
 * 마지막에 생성한 일정을 자동 삭제(afterAll)해 실데이터를 남기지 않는다.
 * 기본 `npm run e2e`에서는 --grep-invert @generation 으로 제외된다 (쿼터/비용 절약).
 */
const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const SENTENCE = '12월 18일부터 20일까지 제주도 커플 여행, 자연이랑 맛집 위주로 여유롭게, 차 빌릴 거야';

test.describe('@generation full user flow', () => {
  test.describe.configure({ mode: 'serial' });
  let itineraryId: number | null = null;

  test.afterAll(async () => {
    if (itineraryId == null) return;
    // 정리: 생성한 스로어웨이만 삭제 (우리 id로 가드).
    try {
      await fetch(`${BASE}/api/proxy/itineraries/${itineraryId}`, {
        method: 'DELETE',
        headers: { cookie: `__session=${mintSessionCookie()}` },
      });
    } catch {
      /* best effort */
    }
  });

  test('create a trip through the conversation (real generation)', async ({ page }) => {
    test.setTimeout(320_000);
    await page.request.delete('/api/proxy/trip-chats/current');
    await page.goto('/app/trips/new');
    const input = page.getByLabel('답변', { exact: true });
    const review = page.getByRole('heading', { name: '생각한 여행이 맞나요?' });
    const answered = () => page.waitForResponse((r) => r.url().includes('/answers'), { timeout: 30_000 });
    await input.fill(SENTENCE);
    await Promise.all([answered(), input.press('Enter')]);

    // 모델이 더 묻는 질문은 무난하게 답하고 확인 화면까지 간다.
    for (let i = 0; i < 8; i++) {
      await expect(review.or(input)).toBeVisible({ timeout: 30_000 });
      if (await review.isVisible()) break;
      const none = page.getByRole('button', { name: '정해둔 건 없어요' });
      const unknown = page.getByRole('button', { name: '아직 모르겠어요' });
      if (await none.isVisible()) await Promise.all([answered(), none.click()]);
      else if (await unknown.isVisible()) await Promise.all([answered(), unknown.click()]);
      else {
        await input.fill('상관없어');
        await Promise.all([answered(), input.press('Enter')]);
      }
    }
    await expect(review).toBeVisible();
    await page.screenshot({ path: test.info().outputPath('review-before-generate.png'), fullPage: true });

    const generate = page.getByRole('button', { name: /이 내용으로 (일정|다시) 만들기/ });
    test.skip(await generate.isDisabled(), '생성 한도 소진 또는 보완할 조건이 있어 생성 플로우 건너뜀');
    await generate.click();
    await expect(page).toHaveURL(/\/app\/trips\/(generating|\d)/, { timeout: 12_000 });
    await page.waitForURL(/\/app\/trips\/\d+/, { timeout: 250_000 });
    itineraryId = Number(page.url().match(/\/app\/trips\/(\d+)/)![1]);
    expect(itineraryId).toBeGreaterThan(0);
    await expect(page.locator('h1').first()).toBeVisible();

    // 일정이 만들어지면 대화는 보관돼 다음 "새 여행"은 새 대화로 시작한다.
    const current = await (await page.request.get('/api/proxy/trip-chats/current')).json();
    expect(current.data).toBeNull();
  });

  test('select an alternative place', async ({ page }) => {
    test.skip(!itineraryId, '생성 실패로 건너뜀');
    await page.goto(`/app/trips/${itineraryId}`);
    await expect(page.locator('h1').first()).toBeVisible(); // 타임라인 렌더 대기(생성 직후 로딩 회피)
    const toggle = page.locator('button', { hasText: /대안 \d+개 보기/ });
    await toggle.first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    test.skip((await toggle.count()) === 0, '대안이 있는 스텝 없음');
    await toggle.first().scrollIntoViewIfNeeded();
    await toggle.first().click();
    const cards = page.locator('div:has(> p:text-is("이 시간대 대안"))').locator('button');
    await expect(cards.first()).toBeVisible();
    await cards.first().click();
    await expect(page.getByText('대안을 변경하지 못했어요')).toHaveCount(0);
  });

  test('edit title & tags persists to the server', async ({ page }) => {
    test.skip(!itineraryId, '생성 실패로 건너뜀');
    await page.goto(`/app/trips/${itineraryId}`);
    await page.getByRole('button', { name: '제목·태그 편집' }).click();
    const title = `E2E 수정 ${Date.now()}`;
    await page.locator('input[type="text"]').first().fill(title);
    await page.getByRole('button', { name: /저장|완료|수정/ }).last().click();
    await expect(page.locator('h1').first()).toContainText('E2E 수정');
    const res = await page.request.get(`/api/proxy/itineraries/${itineraryId}`);
    expect((await res.json()).data.title).toContain('E2E 수정');
  });

  test('share creates a public link that renders anonymously', async ({ page, browser }) => {
    test.skip(!itineraryId, '생성 실패로 건너뜀');
    await page.goto(`/app/trips/${itineraryId}`);
    await page.getByRole('button', { name: /^공유/ }).click();
    await expect(page.getByText(/공유 링크/)).toBeVisible({ timeout: 6000 });
    const shareUrl = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
    expect(shareUrl).toMatch(/\/shared\//);

    const anon = await browser.newContext();
    const pub = await anon.newPage();
    await pub.goto(shareUrl);
    await expect(pub.locator('body')).toContainText(/Day|일정|제주/);
    await anon.close();
  });

  test('finalize marks the trip 확정됨', async ({ page }) => {
    test.skip(!itineraryId, '생성 실패로 건너뜀');
    await page.goto(`/app/trips/${itineraryId}`);
    await expect(page.locator('h1').first()).toBeVisible();
    // 생성 직후 비동기 story/이미지 백필이 엔티티 version을 올려 확정이 낙관락 충돌로 조용히
    // 실패할 수 있다(handleFinalize의 catch가 삼킴). 백필이 가라앉을 때까지 클릭을 재시도한다.
    await expect(async () => {
      const fin = page.getByRole('button', { name: /^일정 확정/ });
      if (await fin.count()) await fin.first().click();
      await expect(page.getByText('확정됨')).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 45_000 });
  });

  test('edit mode deletes a stop', async ({ page }) => {
    test.skip(!itineraryId, '생성 실패로 건너뜀');
    await page.goto(`/app/trips/${itineraryId}`);
    await page.getByRole('button', { name: '일정 편집' }).click();
    const del = page.getByRole('button', { name: '스톱 삭제' });
    const n = await del.count();
    test.skip(n === 0, '삭제 가능한 스톱 없음');
    await del.first().click();
    await page.getByRole('button', { name: '삭제' }).last().click();
    await expect(page.getByRole('button', { name: '스톱 삭제' })).toHaveCount(n - 1, { timeout: 8000 });
  });
});
