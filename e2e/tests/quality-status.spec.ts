import type { Page, Route } from '@playwright/test';
import { test, expect } from '../fixtures/auth';

/**
 * 저장 관문의 '조정 필요' 표시와 미차감 생성 한도. 일정·목록·대화·생성 API는 대역으로 바꿔 생성 없이 본다.
 */

type Json = Record<string, unknown>;
type Quality = 'OK' | 'NEEDS_ADJUSTMENT' | undefined;

const ID = 9001;
const BANNER = '조정이 필요한 일정이에요';
const DAY2_NOTICE = '2일차 점심과 저녁이 같은 종류예요(할매국밥·돼지국밥 본점). 한 곳을 대안으로 바꿔 보세요.';
const TRIP_NOTICE = "꼭 가고 싶다고 한 '광안리해수욕장'을(를) 일정에 넣지 못했어요.";
const KOREAN = 'Dining and Drinking > Restaurant > Korean Restaurant';
const BEACH = 'Landmarks and Outdoors > Beach';

function place(id: number, name: string, category: string, lat: number, lng: number): Json {
  return {
    id, name, address: '부산 테스트로 1', latitude: lat, longitude: lng, category, region: 'Busan', country: 'KR',
    rating: null, priceLevel: null, openingHours: null, imageUrl: null,
  };
}

const PORK = place(15, '돼지국밥 본점', KOREAN, 35.152, 129.059);
const GALBI = place(14, '해운대 암소갈비', KOREAN, 35.162, 129.165);

function step(id: number, day: number, order: number, start: string, end: string, p: Json, alternatives: Json[] = []): Json {
  return {
    id, stepOrder: order, dayNumber: day, startTime: start, endTime: end, place: p,
    transportationMode: order === 1 ? null : 'CAR', transportationDuration: order === 1 ? null : 12,
    transportationDistance: order === 1 ? null : 4.2, transportationCost: null,
    notes: '설명', userNotes: null, estimatedCost: 10000, alternatives,
  };
}

function itinerary(quality: Quality, dinner: Json, status = 'DRAFT'): Json {
  const body: Json = {
    id: ID, title: '부산 바다 2일', destination: '부산', startDate: '2026-12-04', endDate: '2026-12-05',
    totalBudget: null, estimatedCost: null, coverImage: null, tags: [], status,
    qualityNotices: quality === 'NEEDS_ADJUSTMENT' ? [DAY2_NOTICE, TRIP_NOTICE] : [],
    steps: [
      step(1, 1, 1, '10:00', '11:30', place(11, '해운대해수욕장', BEACH, 35.159, 129.160)),
      step(2, 1, 2, '12:00', '13:00', place(12, '해운대 밀면', KOREAN, 35.163, 129.163)),
      step(3, 2, 3, '12:00', '13:00', place(13, '할매국밥', KOREAN, 35.115, 129.040)),
      step(4, 2, 4, '18:00', '19:00', dinner, [
        { id: 41, optionOrder: 1, place: GALBI, notes: null, estimatedCost: 30000 },
      ]),
    ],
  };
  if (quality) body.qualityStatus = quality;
  return body;
}

function summary(id: number, title: string, startDate: string, status: string, quality: Quality): Json {
  return {
    id, title, destination: '부산', startDate, endDate: startDate, status, qualityStatus: quality,
    createdAt: '2026-11-14T10:00:00+09:00', coverImage: null, tags: [],
  };
}

const ok = (data: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data, error: null }) });

async function mockApis(page: Page, opts: { detail?: Json; list?: Json[] } = {}) {
  await page.route('**/api/auth/session', (route: Route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ data: { isAuthenticated: true, user: { id: 1, email: 'e2e@invalid', nickname: 'e2e', profileImage: null, provider: 'kakao' } } }),
  }));
  const list = opts.list ?? [summary(ID, '부산 바다 2일', '2026-12-04', 'DRAFT', 'NEEDS_ADJUSTMENT')];
  await page.route((url) => url.pathname === '/api/proxy/itineraries', (route: Route) =>
    route.fulfill(ok({ content: list, totalElements: list.length, totalPages: 1, number: 0, size: 20 })));
  await page.route(`**/api/proxy/itineraries/${ID}`, (route: Route) =>
    route.fulfill(ok(opts.detail ?? itinerary('NEEDS_ADJUSTMENT', PORK))));
  await page.route(`**/api/proxy/itineraries/${ID}/steps/4/select-alternative`, (route: Route) =>
    route.fulfill(ok(itinerary('OK', GALBI))));
}

async function mockQuota(page: Page, unbilledUsed: number) {
  await page.route('**/api/proxy/itineraries/generation-quota', (route: Route) => route.fulfill(ok({
    used: 1, limit: 5, resetAt: '2026-12-14T14:05:55+09:00', blockedUntil: null,
    unbilledUsed, unbilledLimit: 3, unbilledResetAt: '2026-11-15T14:07:24+09:00',
  })));
}

const ROWS = [
  { slot: 'CITY', label: '여행지', value: '부산', notes: [], filled: true },
  { slot: 'DATES', label: '날짜', value: '12월 4일(금) ~ 5일(토) · 1박 2일', notes: [], filled: true },
  { slot: 'COMPANY', label: '동행', value: '여자친구랑', notes: [], filled: true },
  { slot: 'MOOD', label: '취향', value: '바다랑 맛집', notes: [], filled: true },
  { slot: 'TRANSPORT', label: '이동', value: '자동차 이용', notes: [], filled: true },
  { slot: 'ANCHORS', label: '정해둔 것', value: '아직 미정', notes: [], filled: true },
];

async function mockReviewChat(page: Page) {
  await page.route('**/api/proxy/trip-chats**', (route: Route) => route.fulfill(ok({
    id: '7b1c7c1e-0000-4000-8000-000000000001', version: 1, status: 'REVIEW', question: null, lastExchange: null,
    history: [], summary: { rows: ROWS, fixes: [], ready: true }, back: null, pending: null, jobId: null, days: null,
  })));
}

/** 생성 화면이 막 시작한 작업에 붙자마자 서버가 관문 거부를 보낸 상황. */
async function openRejectedGeneration(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('shg.newTripJob', JSON.stringify({ jobId: 'job-rejected', days: 2, chatId: null }));
  });
  await page.route('**/api/proxy/itineraries/generate/job-rejected/stream', (route: Route) => route.fulfill({
    status: 200, contentType: 'text/event-stream',
    body: 'event: error\ndata: {"errorCode":"PLANNING_011","status":"error","message":"마지막 날 출발 시각까지 공항·역에 닿는 일정을 만들 수 없어 저장하지 않았어요. 출발 시간을 확인한 뒤 다시 만들어 주세요. 30일 생성 횟수는 차감되지 않았어요."}\n\n',
  }));
  await page.goto('/app/trips/generating');
  await expect(page.getByText(/출발 시간을 확인한 뒤 다시 만들어 주세요/)).toBeVisible();
}

test.describe('quality status', () => {
  test('조정 필요 일정은 안내와 일차 바로가기를 보이고, 대안으로 기준을 채우면 배너와 목록 표시가 내려가며 풀렸다고 알린다', async ({ page }) => {
    await mockApis(page);
    await page.goto(`/app/trips/${ID}`);

    await expect(page.getByText(BANNER)).toBeVisible();
    await expect(page.getByText(/생성 횟수는 쓰지 않았어요/)).toBeVisible();
    await expect(page.getByRole('link', { name: /부산 바다 2일/ })).toContainText('조정 필요');

    await page.getByRole('button', { name: '2일차 안내 보기' }).click();
    await expect(page.getByRole('tab', { name: /Day 2/ })).toHaveAttribute('aria-selected', 'true');
    // 할 일 문장은 그 항목 바로 뒤에 붙는다.
    await expect(page.getByText('점심과 저녁이 같은 종류예요(할매국밥·돼지국밥 본점) · 한 곳을 대안으로 바꿔 보세요')).toBeVisible();
    await expect(page.getByText(TRIP_NOTICE.replace(/\.$/, ''))).toBeVisible();

    await page.locator('button', { hasText: /대안 1개/ }).click();
    await page.locator('button', { hasText: '해운대 암소갈비' }).click();

    await expect(page.getByText(BANNER)).toHaveCount(0);
    await expect(page.getByText('조정이 필요한 부분이 모두 풀렸어요 · 이제 기준을 채운 일정이에요')).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: /^조정이 필요한 부분이 모두 풀렸어요$/ })).toHaveCount(1);
    await expect(page.getByText('점심과 저녁이 같은 종류예요')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /부산 바다 2일/ })).not.toContainText('조정 필요');
  });

  test('확정하려 하면 조정이 남아 있다고 알린다', async ({ page }) => {
    await mockApis(page);
    await page.goto(`/app/trips/${ID}`);
    await page.getByRole('button', { name: '일정 확정' }).first().click();

    await expect(page.getByText(/조정이 필요한 부분이 남아 있어요\. 확정은 되돌릴 수 없어요/)).toBeVisible();
  });

  test('확정된 일정은 조정 필요 상태여도 배너와 목록 표시가 없다', async ({ page }) => {
    await mockApis(page, {
      detail: itinerary('NEEDS_ADJUSTMENT', PORK, 'FINALIZED'),
      list: [summary(ID, '부산 바다 2일', '2026-12-04', 'FINALIZED', 'NEEDS_ADJUSTMENT')],
    });
    await page.goto(`/app/trips/${ID}`);

    await expect(page.getByText('확정됨')).toBeVisible();
    await expect(page.getByText(BANNER)).toHaveCount(0);
    await expect(page.getByRole('link', { name: /부산 바다 2일/ })).not.toContainText('조정 필요');
  });

  test('품질 상태가 없는 옛 응답은 조정 필요로 보지 않는다', async ({ page }) => {
    await mockApis(page, { detail: itinerary(undefined, PORK) });
    await page.goto(`/app/trips/${ID}`);

    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.getByText(BANNER)).toHaveCount(0);
  });

  test('목록은 초안인 조정 필요 일정에만 표시를 붙인다', async ({ page }) => {
    await mockApis(page, {
      list: [
        summary(ID, '부산 바다 2일', '2026-12-04', 'DRAFT', 'NEEDS_ADJUSTMENT'),
        summary(9002, '확정한 경주 여행', '2026-12-20', 'FINALIZED', 'NEEDS_ADJUSTMENT'),
        summary(9003, '평범한 제주 여행', '2026-12-27', 'DRAFT', 'OK'),
      ],
    });
    await page.goto('/app/trips');

    const main = page.getByRole('main');
    await expect(main.getByText('부산 바다 2일')).toBeVisible();
    await expect(main.getByText('조정 필요', { exact: true })).toHaveCount(1);
  });

  test('이동 거리는 직선거리 기준 추정이라고 밝힌다', async ({ page }) => {
    await mockApis(page);
    await page.goto(`/app/trips/${ID}`);

    await expect(page.getByText('직선거리 기준 추정')).toBeVisible();
  });

  test('확인 화면은 기준 미달 생성 수를 함께 보이고, 한도에 닿으면 풀리는 시각을 알리며 만들기를 막는다', async ({ page }) => {
    await mockApis(page);
    await mockReviewChat(page);
    await mockQuota(page, 1);
    await page.goto('/app/trips/new');
    await expect(page.getByText(/기준 미달 1회\(3회면 24시간 멈춤\)/)).toBeVisible();
    await expect(page.getByRole('button', { name: /이 내용으로 일정 만들기/ })).toBeEnabled();

    await page.unroute('**/api/proxy/itineraries/generation-quota');
    await mockQuota(page, 3);
    await page.reload();
    await expect(page.getByText(/잠시 멈췄어요 · 11월 15일 14:07 이후 가능/).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /이 내용으로 일정 만들기/ })).toBeDisabled();
  });

  test('관문 거부로 미차감 한도에 닿으면 생성 실패 화면에서 다시 시도를 막는다', async ({ page }) => {
    await mockApis(page);
    await mockQuota(page, 3);
    await openRejectedGeneration(page);

    await expect(page.getByRole('button', { name: '확인' })).toBeVisible();
    await expect(page.getByRole('button', { name: '다시 시도' })).toHaveCount(0);
  });

  test('관문 거부여도 한도가 남아 있으면 다시 시도할 수 있다', async ({ page }) => {
    await mockApis(page);
    await mockQuota(page, 1);
    await openRejectedGeneration(page);

    await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible();
  });
});
