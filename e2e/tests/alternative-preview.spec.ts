import type { Page, Route } from '@playwright/test';
import { test, expect } from '../fixtures/auth';

/** 대안 설명·스텝 장소 설명과 바꾸기 전 미리보기. 일정·미리보기·선택 API는 대역으로 바꿔 생성 없이 본다. */

type Json = Record<string, unknown>;

const ID = 9201;
const KOREAN = 'Dining and Drinking > Restaurant > Korean Restaurant';
const BEACH = 'Landmarks and Outdoors > Beach';
const TEMPLE = 'Landmarks and Outdoors > Spiritual Center > Buddhist Temple';
const HOTEL = 'Travel and Transportation > Lodging > Resort';
const TEMPLE_INTRO = '石佛寺는 바위에 새긴 불상으로 알려진 절입니다.';
const KINKAKU_INTRO = '鹿苑寺라고도 부르는 금박 누각이 연못에 비치는 절입니다.';
const LODGING_INTRO = '편안한 휴식을 제공하는 프리미엄 리조트입니다.';
const NOODLE_NOTE = '면 요리 · 지금 장소에서 600m';
const RAW_FISH_NOTE = '회 · 지금 장소에서 8.5km · 널리 알려진 곳';
const NEW_NOTICE = '1일차 점심이 영업시간 밖이에요. 다른 대안을 골라 보세요.';

function place(id: number, name: string, category: string, lat: number, lng: number): Json {
  return {
    id, name, address: '부산 테스트로 1', latitude: lat, longitude: lng, category, region: 'Busan', country: 'KR',
    rating: null, priceLevel: null, openingHours: null, imageUrl: null,
  };
}

const MILMYEON_INTRO = '해운대 시장 골목의 밀면 전문점입니다.';
const KALGUKSU_INTRO = '바지락을 넣은 칼국수를 내는 해운대의 국숫집입니다.';
const MILMYEON = { ...place(12, '해운대 밀면', KOREAN, 35.163, 129.163), description: MILMYEON_INTRO };
const KALGUKSU = { ...place(41, '해운대 칼국수', KOREAN, 35.161, 129.158), description: KALGUKSU_INTRO };
const HOE_INTRO = '민락수변공원 앞 바닷가에 자리한 회센터입니다. 1층에서 고른 활어를 위층 식당에서 바로 손질해 먹을 수 있고, 창가 자리에서는 광안대교가 보입니다. 해가 지면 다리 조명이 켜져 저녁 시간에 특히 붐비고, 주말에는 자리를 잡기까지 기다려야 할 수 있습니다.';
const HOE = { ...place(42, '민락 회센터', KOREAN, 35.155, 129.131), description: HOE_INTRO };

function step(id: number, day: number, order: number, start: string, end: string, p: Json, extra: Json = {}): Json {
  return {
    id, stepOrder: order, dayNumber: day, startTime: start, endTime: end, place: p,
    transportationMode: order === 1 ? null : 'CAR', transportationDuration: order === 1 ? null : 12,
    transportationDistance: order === 1 ? null : 4.2, transportationCost: null,
    notes: '바다를 따라 걷는 아침이에요.', placeNote: null, userNotes: null, estimatedCost: 10000, alternatives: [],
    ...extra,
  };
}

function itinerary(lunch: Json): Json {
  return {
    id: ID, title: '부산 바다 2일', destination: '부산', startDate: '2026-12-04', endDate: '2026-12-05',
    totalBudget: null, estimatedCost: null, coverImage: null, tags: [], status: 'DRAFT',
    qualityNotices: [],
    steps: [
      step(1, 1, 1, '10:00', '11:30', place(11, '해운대해수욕장', BEACH, 35.159, 129.160), { placeNote: '해변 · 널리 알려진 곳' }),
      step(2, 1, 2, '12:00', '13:00', lunch, {
        notes: null,
        placeNote: '냉면·밀면',
        alternatives: [
          { id: 141, optionOrder: 1, place: KALGUKSU, notes: NOODLE_NOTE, estimatedCost: 9000 },
          { id: 142, optionOrder: 2, place: HOE, notes: RAW_FISH_NOTE, estimatedCost: 30000 },
        ],
      }),
      step(3, 1, 3, '14:00', '15:30', { ...place(13, '동백섬', BEACH, 35.153, 129.152), description: '해안 산책로를 걷기에 适합니다.' }, {
        transportationDuration: 8, transportationDistance: 2.0, notes: null, placeNote: '섬 · 널리 알려진 곳',
      }),
      step(4, 2, 4, '12:00', '13:00', HOE, { placeNote: '회' }),
      step(5, 2, 5, '14:00', '15:00', { ...place(51, '석불사 (石佛寺)', TEMPLE, 35.226, 129.071), description: TEMPLE_INTRO }, {
        notes: null, placeNote: '사찰·신사',
      }),
      step(6, 2, 6, '16:00', '17:00', { ...place(61, '金閣寺', TEMPLE, 35.039, 135.729), country: 'JP', nameKo: '킨카쿠지', description: KINKAKU_INTRO }, {
        notes: null, placeNote: '사찰·신사 · 널리 알려진 곳',
      }),
      step(7, 2, 7, '20:00', '21:00', { ...place(71, '해운대 리조트', HOTEL, 35.160, 129.163), description: LODGING_INTRO }, {
        notes: null, placeNote: null,
      }),
    ],
  };
}

const ok = (data: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data, error: null }) });
const leg = (mode: string, durationMin: number, distanceKm: number) => ({ mode, durationMin, distanceKm, cost: null });

const PREVIEWS: Record<number, Json> = {
  141: {
    incoming: { before: leg('CAR', 12, 4.2), after: leg('WALK', 18, 1.2) },
    outgoing: { before: leg('CAR', 8, 2.0), after: leg('CAR', 10, 2.9) },
    costBefore: 10000, costAfter: 9000, openAtTime: false, closedThatDay: false, alreadyOnDay: null,
    resolvedNotices: [], newNotices: [NEW_NOTICE],
  },
  142: {
    incoming: { before: leg('CAR', 12, 4.2), after: leg('CAR', 18, 7.9) },
    outgoing: { before: leg('CAR', 8, 2.0), after: leg('CAR', 8, 2.0) },
    costBefore: null, costAfter: 30000, openAtTime: false, closedThatDay: true, alreadyOnDay: 2,
    resolvedNotices: [], newNotices: [],
  },
};

async function mockApis(page: Page, opts: { previewStatus?: number; selectStatus?: number; selectGate?: Promise<void> } = {}) {
  const { previewStatus = 200, selectStatus = 200, selectGate } = opts;
  const calls = { select: 0 };
  await page.route('**/api/auth/session', (route: Route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ data: { isAuthenticated: true, user: { id: 1, email: 'e2e@invalid', nickname: 'e2e', profileImage: null, provider: 'kakao' } } }),
  }));
  await page.route((url) => url.pathname === '/api/proxy/itineraries', (route: Route) =>
    route.fulfill(ok({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 })));
  await page.route(`**/api/proxy/itineraries/${ID}`, (route: Route) => route.fulfill(ok(itinerary(MILMYEON))));
  await page.route(`**/api/proxy/itineraries/${ID}/steps/2/alternatives/*/preview`, (route: Route) => {
    if (previewStatus !== 200) {
      return route.fulfill({
        status: previewStatus, contentType: 'application/json',
        body: JSON.stringify({ success: false, data: null, error: { code: 'X', message: '대안 장소를 찾을 수 없습니다.' } }),
      });
    }
    const altId = Number(new URL(route.request().url()).pathname.split('/').at(-2));
    return route.fulfill(ok(PREVIEWS[altId]));
  });
  await page.route(`**/api/proxy/itineraries/${ID}/steps/2/select-alternative`, async (route: Route) => {
    calls.select += 1;
    await selectGate;
    if (selectStatus !== 200) {
      return route.fulfill({
        status: selectStatus, contentType: 'application/json',
        body: JSON.stringify({ success: false, data: null, error: { code: 'X', message: '잠시 후 다시 시도해 주세요.' } }),
      });
    }
    return route.fulfill(ok(itinerary(KALGUKSU)));
  });
  return calls;
}

async function openAlternatives(page: Page) {
  await page.goto(`/app/trips/${ID}`);
  await page.locator('button', { hasText: /대안 2개/ }).click();
}

const altCard = (page: Page, name: string) => page.locator('button[aria-haspopup="dialog"]', { hasText: name });

test.describe('alternative preview', () => {
  test('대안 카드에 설명을 보이고, 이야기가 없는 스텝은 장소 소개를 보이며 깨진 소개는 짧은 설명으로 대신한다', async ({ page }) => {
    await mockApis(page);
    await openAlternatives(page);

    await expect(altCard(page, '해운대 칼국수')).toContainText(NOODLE_NOTE);
    await expect(altCard(page, '민락 회센터')).toContainText(RAW_FISH_NOTE);
    await expect(page.getByText(MILMYEON_INTRO)).toBeVisible();
    await expect(page.getByText('냉면·밀면', { exact: true })).toHaveCount(0);
    await expect(page.getByText('섬 · 널리 알려진 곳')).toBeVisible();
    await expect(page.getByText(/适합니다/)).toHaveCount(0);
    await expect(page.getByText('바다를 따라 걷는 아침이에요.').first()).toBeVisible();
    await expect(page.getByText('해변 · 널리 알려진 곳')).toHaveCount(0);

    // 이름을 따라 쓴 한자와 해외 장소의 한자는 깨진 글자로 보지 않고, 이야기가 있으면 소개보다 앞선다.
    await page.getByRole('tab', { name: /Day 2/ }).click();
    await expect(page.getByText(TEMPLE_INTRO)).toBeVisible();
    await expect(page.getByText(KINKAKU_INTRO)).toBeVisible();
    await expect(page.getByText(LODGING_INTRO)).toHaveCount(0);
    await expect(page.getByText(HOE_INTRO)).toHaveCount(0);
  });

  test('바꾸기 전에 이동 변화·영업 경고·새 안내를 보이고, 취소하면 바꾸지 않는다', async ({ page }) => {
    const calls = await mockApis(page);
    await openAlternatives(page);
    await altCard(page, '해운대 칼국수').click();

    const dialog = page.getByRole('dialog', { name: '이 장소로 바꿀까요?' });
    await expect(dialog.getByText(KALGUKSU_INTRO)).toBeVisible();
    await expect(dialog.getByRole('button', { name: '소개 더 보기' })).toHaveCount(0);
    await expect(dialog.getByText('해운대해수욕장에서 오는 길')).toBeVisible();
    await expect(dialog.getByText('차로 12분 · 4.2km')).toBeVisible();
    await expect(dialog.getByText('걸어서 18분 · 1.2km')).toBeVisible();
    await expect(dialog.getByText('동백섬까지 가는 길')).toBeVisible();
    await expect(dialog.getByText('직선거리 기준 추정')).toBeVisible();
    await expect(dialog.getByText('이동 시간이 8분 늘어요 · 거리는 2.1km 줄어요')).toBeVisible();
    await expect(dialog.getByText('장소 예상 비용 10,000원')).toBeVisible();
    await expect(dialog.getByText('머무는 시간(12:00 - 13:00)이 영업시간을 벗어나요.')).toBeVisible();
    await expect(dialog.getByText(NEW_NOTICE)).toBeVisible();
    await expect(dialog.getByRole('button', { name: '바꾸기' })).toBeFocused();

    await dialog.getByRole('button', { name: '취소' }).click();
    await expect(dialog).toHaveCount(0);
    expect(calls.select).toBe(0);
    await expect(page.getByRole('heading', { name: '해운대 밀면' })).toBeVisible();
  });

  test('휴무일·이미 있는 장소를 알리고, Esc로 닫은 뒤 다른 대안으로 바꾸면 스텝 카드로 포커스가 돌아온다', async ({ page }) => {
    const calls = await mockApis(page);
    await openAlternatives(page);
    await altCard(page, '민락 회센터').click();

    const dialog = page.getByRole('dialog', { name: '이 장소로 바꿀까요?' });
    await expect(dialog.getByText('이날은 쉬는 날이에요.')).toBeVisible();
    const more = dialog.getByRole('button', { name: '소개 더 보기' });
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    await more.click();
    await expect(dialog.getByRole('button', { name: '소개 접기' })).toHaveAttribute('aria-expanded', 'true');
    await expect(dialog.getByText('2일차 일정에 이미 있는 곳이에요.')).toBeVisible();
    await expect(dialog.getByText(/영업시간을 벗어나요/)).toHaveCount(0);
    await expect(dialog.getByText('이동 시간이 6분 늘어요 · 거리는 3.7km 늘어요')).toBeVisible();
    await expect(dialog.getByText('장소 예상 비용 30,000원')).toBeVisible();
    await expect(dialog.getByText(/(?<![\d,])0원/)).toHaveCount(0);

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await altCard(page, '해운대 칼국수').click();
    await dialog.getByRole('button', { name: '바꾸기' }).click();
    await expect(dialog).toHaveCount(0);
    expect(calls.select).toBe(1);
    await expect(page.getByRole('heading', { name: '해운대 칼국수' })).toBeVisible();
    await expect(page.locator('[data-step-id="2"]')).toBeFocused();
  });

  test('바꾸는 동안에는 버튼을 막고 Esc로 닫히지 않으며, 실패하면 창을 닫고 알린다', async ({ page }) => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const calls = await mockApis(page, { selectStatus: 500, selectGate: gate });
    await openAlternatives(page);
    await altCard(page, '해운대 칼국수').click();

    const dialog = page.getByRole('dialog', { name: '이 장소로 바꿀까요?' });
    await expect(dialog.getByText('직선거리 기준 추정')).toBeVisible();
    await dialog.getByRole('button', { name: '바꾸기' }).click();
    await expect(dialog.getByRole('button', { name: '바꾸는 중…' })).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();

    release();
    await expect(dialog).toHaveCount(0);
    expect(calls.select).toBe(1);
    await expect(page.getByText('대안을 변경하지 못했어요')).toBeVisible();
    await expect(page.getByRole('heading', { name: '해운대 밀면' })).toBeVisible();
  });

  test('미리보기를 못 받아도 바꿀 수 있다', async ({ page }) => {
    const calls = await mockApis(page, { previewStatus: 500 });
    await openAlternatives(page);
    await altCard(page, '해운대 칼국수').click();

    const dialog = page.getByRole('dialog', { name: '이 장소로 바꿀까요?' });
    await expect(dialog.getByText('달라지는 점을 불러오지 못했어요. 그래도 바꿀 수는 있어요.')).toBeVisible();
    await dialog.getByRole('button', { name: '바꾸기' }).click();
    await expect(dialog).toHaveCount(0);
    expect(calls.select).toBe(1);
  });

  test('다른 곳에서 일정이 바뀌어 대안이 없으면 창을 닫고 최신 일정을 다시 불러온다', async ({ page }) => {
    await mockApis(page, { previewStatus: 404 });
    await openAlternatives(page);
    await altCard(page, '해운대 칼국수').click();

    await expect(page.getByRole('dialog', { name: '이 장소로 바꿀까요?' })).toHaveCount(0);
    await expect(page.getByText('다른 곳에서 일정이 바뀌었어요. 최신 내용으로 다시 불러왔어요.')).toBeVisible();
    await expect(page.locator('[data-step-id="2"]')).toBeFocused();
  });
});
