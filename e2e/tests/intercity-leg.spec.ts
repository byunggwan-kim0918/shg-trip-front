import type { Page, Route } from '@playwright/test';
import { test, expect } from '../fixtures/auth';

/** 도시를 옮기는 날의 첫 구간 표시. 일정 API는 대역으로 바꿔 생성 없이 본다. */

type Json = Record<string, unknown>;

const ID = 9101;
const SIGHT = 'Landmarks and Outdoors > Historic and Protected Site';

function place(id: number, name: string, region: string, lat: number, lng: number): Json {
  return {
    id, name, address: `${region} 테스트로 1`, latitude: lat, longitude: lng, category: SIGHT, region, country: 'KR',
    rating: null, priceLevel: null, openingHours: null, imageUrl: null,
  };
}

function step(id: number, day: number, order: number, start: string, p: Json, leg: Json | null): Json {
  return {
    id, stepOrder: order, dayNumber: day, startTime: start, endTime: start.replace(/:00$/, ':50'), place: p,
    transportationMode: leg?.mode ?? null, transportationDuration: leg?.minutes ?? null,
    transportationDistance: leg?.km ?? null, transportationCost: leg?.won ?? null,
    notes: '설명', userNotes: null, estimatedCost: 0, alternatives: [],
  };
}

const ITINERARY: Json = {
  id: ID, title: '강릉 경주 서울 3일', destination: '강릉, 경주', startDate: '2026-12-15', endDate: '2026-12-17',
  totalBudget: null, estimatedCost: null, coverImage: null, tags: [], status: 'DRAFT', qualityStatus: 'OK',
  qualityNotices: [],
  steps: [
    step(1, 1, 1, '10:00', place(11, '오죽헌', 'Gangneung', 37.779, 128.878), null),
    step(2, 2, 2, '13:00', place(21, '불국사', 'Gyeongju', 35.790, 129.332), { mode: 'DRIVE', minutes: 206, km: 280.8, won: 49800 }),
    step(3, 2, 3, '15:00', place(22, '첨성대', 'Gyeongju', 35.835, 129.219), { mode: 'CAR', minutes: 20, km: 14.1, won: 11300 }),
    step(4, 3, 4, '13:00', place(31, '경복궁', 'Seoul', 37.580, 126.977), { mode: 'TRAIN', minutes: 210, km: 356.2, won: 49300 }),
  ],
};

const ok = (data: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data, error: null }) });

async function mockApis(page: Page) {
  await page.route('**/api/auth/session', (route: Route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ data: { isAuthenticated: true, user: { id: 1, email: 'e2e@invalid', nickname: 'e2e', profileImage: null, provider: 'kakao' } } }),
  }));
  await page.route((url) => url.pathname === '/api/proxy/itineraries', (route: Route) =>
    route.fulfill(ok({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 })));
  await page.route(`**/api/proxy/itineraries/${ID}`, (route: Route) => route.fulfill(ok(ITINERARY)));
}

test.describe('intercity leg', () => {
  test('차로 도시를 옮기는 날은 첫 구간을 도시 이동으로 보이고 거리 경고를 띄우지 않는다', async ({ page }) => {
    await mockApis(page);
    await page.goto(`/app/trips/${ID}`);

    await page.getByRole('tab', { name: /Day 2/ }).click();
    await expect(page.getByText('차로 도시 이동 · 3시간 26분 (281km)')).toBeVisible();
    await expect(page.getByText('숙소에서 출발')).toHaveCount(0);

    await page.getByRole('tab', { name: /Day 3/ }).click();
    await expect(page.getByText('열차로 도시 이동 · 3시간 30분 (356km)')).toBeVisible();
    await expect(page.getByText('위치 확인 필요')).toHaveCount(0);
    await expect(page.getByText(/이동 거리가 비정상적으로 큰 구간이 있어요/)).toHaveCount(0);
  });
});
