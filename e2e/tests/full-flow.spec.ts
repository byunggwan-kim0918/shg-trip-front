import { test, expect } from '../fixtures/auth';
import { mintSessionCookie } from '../fixtures/session';

/**
 * @generation — 실제 AI 생성을 포함한 전체 사용자 플로우.
 * 스로어웨이 일정을 자연어로 생성 → 대안선택 → 제목편집 → 공유 → 확정 → 스톱삭제,
 * 마지막에 생성한 일정을 자동 삭제(afterAll)해 실데이터를 남기지 않는다.
 * 기본 `npm run e2e`에서는 --grep-invert @generation 으로 제외된다 (쿼터/비용 절약).
 */
const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const SENTENCE =
  '2026년 8월 22일부터 8월 24일까지 제주도 커플 여행, 자연이랑 맛집 위주로 여유롭게, 예산 100만원';

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

  test('create a trip via natural language (real AI generation)', async ({ page }) => {
    test.setTimeout(280_000); // 실제 AI 생성은 보통 10~30초지만, 폴백 경로/지연 시 느려질 수 있음
    await page.goto('/main/plan/new');
    await page.getByLabel('여행 문장 입력').fill(SENTENCE);
    await page.waitForTimeout(1000); // 디바운스 파싱이 먼저 끝나면 동기 PARSED 프리필 경로를 탄다

    await page.getByRole('button', { name: /AI로 일정 만들기/ }).click();

    // WizardLayout은 5스텝을 모두 DOM에 렌더하는 translateX 캐러셀 → ConfirmStep의 생성 버튼이
    // 화면 밖이어도 항상 클릭 가능하다. builder가 재파싱으로 위저드에 "날짜"를 채워 ConfirmStep으로
    // 점프하기 전에 클릭하면 handleGenerate가 조용히 무시된다. 요약에 기간(N박M일)이 뜬 것 =
    // 스토어에 startDate/endDate가 실제로 들어갔다는 뜻이므로, 이를 게이트로 삼아 레이스를 제거한다.
    await expect(page.getByText(/\d+박\s?\d+일/).first()).toBeVisible({ timeout: 30_000 });

    const overQuota = await page.getByRole('button', { name: /생성 한도 초과/ }).count();
    test.skip(overQuota > 0, '30일 생성 쿼터 소진 — 생성 플로우 건너뜀');

    await page.getByRole('button', { name: '이대로 일정 만들기' }).click();
    // 생성 진입 실패(데이터 부족으로 위저드에 머무름) 조기 감지 → 190초 무한대기 방지.
    await expect(page).toHaveURL(/\/main\/itinerary\/(loading|\d)/, { timeout: 12_000 });
    await page.waitForURL(/\/main\/itinerary\/\d+/, { timeout: 250_000 });
    itineraryId = Number(page.url().match(/\/main\/itinerary\/(\d+)/)![1]);
    expect(itineraryId).toBeGreaterThan(0);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('select an alternative place', async ({ page }) => {
    test.skip(!itineraryId, '생성 실패로 건너뜀');
    await page.goto(`/main/itinerary/${itineraryId}`);
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
    await page.goto(`/main/itinerary/${itineraryId}`);
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
    await page.goto(`/main/itinerary/${itineraryId}`);
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
    await page.goto(`/main/itinerary/${itineraryId}`);
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
    await page.goto(`/main/itinerary/${itineraryId}`);
    await page.getByRole('button', { name: '일정 편집' }).click();
    const del = page.getByRole('button', { name: '스톱 삭제' });
    const n = await del.count();
    test.skip(n === 0, '삭제 가능한 스톱 없음');
    await del.first().click();
    await page.getByRole('button', { name: '삭제' }).last().click();
    await expect(page.getByRole('button', { name: '스톱 삭제' })).toHaveCount(n - 1, { timeout: 8000 });
  });
});
