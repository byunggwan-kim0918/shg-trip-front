import type { Page, Route } from '@playwright/test';
import { test, expect } from '../fixtures/auth';

/**
 * 이야기 작성 상태(storyStatus)와 장소 보강(enrichingPlaceIds)에 따른 결과 화면 재조회.
 * 일정 API는 대역으로 바꾸고, 재조회마다 서버 상태를 시나리오대로 넘겨 새로고침 없이 바뀌는지 본다.
 */

type Json = Record<string, unknown>;

const ID = 9130;
const DRAFT_TITLE = '나고야 3박 4일';
const STORY_TITLE = '나고야 장어와 성 산책';
const REASON = '장어 덮밥을 세 가지로 나눠 먹는 나고야식을 맛본다';
const WRITING = '가이드 스토리를 작성하고 있어요…';
const INTRO_PENDING = '장소 소개를 준비하고 있어요…';
const OSU_INTRO = '전자상가와 노포가 섞인 나고야 대표 상점가.';

function place(id: number, name: string, extra: Json = {}): Json {
  return {
    id, name, address: '名古屋市中区', latitude: 35.16 + id / 1000, longitude: 136.9, category: 'Landmarks and Outdoors',
    region: 'Nagoya', country: 'JP', rating: null, priceLevel: null, openingHours: null, imageUrl: null, ...extra,
  };
}

function step(id: number, order: number, start: string, p: Json, notes: string | null, placeNote: string | null = null): Json {
  return {
    id, stepOrder: order, dayNumber: 1, startTime: start, endTime: start.replace(/:00$/, ':50'), place: p,
    transportationMode: order === 1 ? null : 'WALK', transportationDuration: order === 1 ? null : 10,
    transportationDistance: order === 1 ? null : 0.8, transportationCost: null, notes, placeNote,
    userNotes: null, estimatedCost: null, alternatives: [], travelEstimated: false,
  };
}

interface State {
  title?: string;
  status?: 'DRAFT' | 'FINALIZED';
  storyStatus?: 'PENDING' | 'DONE' | 'FAILED' | null;
  stories?: boolean;
  enriching?: boolean;
}

/** 운영 130번처럼 넣은 이유가 한 스텝에만 먼저 들어간 나고야 일정. */
function itinerary(s: State): Json {
  const story = (text: string) => (s.stories ? text : null);
  const osu = place(3, '大須商店街', s.enriching
    ? {}
    : { nameKo: '오스 상점가', description: OSU_INTRO });
  return {
    id: ID, title: s.title ?? DRAFT_TITLE, destination: '나고야', startDate: '2026-12-05', endDate: '2026-12-08',
    totalBudget: null, estimatedCost: null, coverImage: null, tags: [], status: s.status ?? 'DRAFT', qualityNotices: [],
    steps: [
      step(1, 1, '09:00', place(1, '大須観音', { nameKo: '오스칸논' }), story('오스칸논 관음당에서 하루를 연다')),
      step(2, 2, '11:00', place(2, '今井総本家', { nameKo: '이마이 소혼케' }), s.stories ? '장어 덮밥 이야기' : REASON),
      step(3, 3, '13:00', osu, story('오스 상점가 골목을 걷는다'), 'Shopping Mall'),
    ],
    enrichingPlaceIds: s.enriching ? [3] : [],
    ...(s.storyStatus === undefined ? {} : { storyStatus: s.storyStatus }),
  };
}

const ok = (data: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data, error: null }) });

/** 상세 조회가 돌려줄 서버 상태. 테스트가 화면을 확인한 뒤 바꿔 비동기 작업이 끝나는 순간을 정한다. */
interface Server {
  state: State;
  gets: number;
}

async function mockApis(page: Page, initial: State, onUpdate?: (body: Json) => Json): Promise<Server> {
  const server: Server = { state: initial, gets: 0 };
  await page.route('**/api/auth/session', (route: Route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ data: { isAuthenticated: true, user: { id: 1, email: 'e2e@invalid', nickname: 'e2e', profileImage: null, provider: 'kakao' } } }),
  }));
  await page.route((url) => url.pathname === '/api/proxy/itineraries', (route: Route) => route.fulfill(ok({
    content: [{ id: ID, title: DRAFT_TITLE, destination: '나고야', startDate: '2026-12-05', endDate: '2026-12-08',
      status: 'DRAFT', createdAt: '2026-11-26T10:00:00+09:00', coverImage: null, tags: [] }],
    totalElements: 1, totalPages: 1, number: 0, size: 20,
  })));
  await page.route(`**/api/proxy/itineraries/${ID}`, (route: Route) => {
    if (route.request().method() === 'PUT' && onUpdate) {
      return route.fulfill(ok(onUpdate(route.request().postDataJSON() as Json)));
    }
    server.gets += 1;
    return route.fulfill(ok(itinerary(server.state)));
  });
  return server;
}

const heading = (page: Page) => page.getByRole('heading', { level: 1 });
const sidebarTitle = (page: Page, title: string) => page.locator('aside').getByText(title);

/** 재조회 간격(2.5초)의 두 배를 기다려도 조회가 늘지 않으면 재조회가 끝난 것이다. */
async function expectPollingStopped(page: Page, server: Server) {
  const settled = server.gets;
  await page.waitForTimeout(6000);
  expect(server.gets).toBe(settled);
}

/** 화면이 지금 상태로 한 번 더 조회할 때까지 기다린다. */
async function expectAnotherPoll(server: Server) {
  const before = server.gets;
  await expect.poll(() => server.gets, { timeout: 8000 }).toBeGreaterThan(before);
}

test.describe('story status', () => {
  test('넣은 이유가 먼저 있어도 PENDING이면 재조회하고, 끝나면 새로고침 없이 제목·설명이 바뀐다', async ({ page }) => {
    const server = await mockApis(page, { storyStatus: 'PENDING' });
    await page.goto(`/app/trips/${ID}`);

    await expect(heading(page)).toHaveText(DRAFT_TITLE);
    await expect(page.getByText(REASON)).toBeVisible();
    await expect(page.getByText(WRITING).first()).toBeVisible();
    await expectAnotherPoll(server);

    server.state = { storyStatus: 'DONE', stories: true, title: STORY_TITLE };
    await expect(heading(page)).toHaveText(STORY_TITLE, { timeout: 8000 });
    await expect(page.getByText('장어 덮밥 이야기')).toBeVisible();
    await expect(page.getByText('오스칸논 관음당에서 하루를 연다')).toBeVisible();
    await expect(page.getByText(REASON)).toHaveCount(0);
    await expect(page.getByText(WRITING)).toHaveCount(0);
    await expect(sidebarTitle(page, STORY_TITLE)).toBeVisible();
    await expectPollingStopped(page, server);
  });

  test('이야기가 실패하면 작성 중 표시를 거두고 임시 제목·넣은 이유를 그대로 둔 채 재조회를 멈춘다', async ({ page }) => {
    const server = await mockApis(page, { storyStatus: 'PENDING' });
    await page.goto(`/app/trips/${ID}`);
    await expect(page.getByText(WRITING).first()).toBeVisible();

    server.state = { storyStatus: 'FAILED' };
    await expect(page.getByText(WRITING)).toHaveCount(0, { timeout: 8000 });
    await expect(heading(page)).toHaveText(DRAFT_TITLE);
    await expect(page.getByText(REASON)).toBeVisible();
    await expectPollingStopped(page, server);
  });

  test('이야기가 먼저 끝나도 보강 대기 장소는 계속 재조회해 소개를 채운다', async ({ page }) => {
    const server = await mockApis(page, { storyStatus: 'PENDING', enriching: true });
    await page.goto(`/app/trips/${ID}`);
    await expect(page.getByText('大須商店街')).toBeVisible();

    server.state = { storyStatus: 'DONE', stories: true, title: STORY_TITLE, enriching: true };
    await expect(heading(page)).toHaveText(STORY_TITLE, { timeout: 8000 });
    await expect(page.getByText(WRITING)).toHaveCount(0);
    await expectAnotherPoll(server);
    await expectAnotherPoll(server);
    await expect(page.getByText('大須商店街')).toBeVisible();

    server.state = { storyStatus: 'DONE', stories: true, title: STORY_TITLE };
    await expect(page.getByText('오스 상점가', { exact: true })).toBeVisible({ timeout: 8000 });
    await expectPollingStopped(page, server);
  });

  test('보강이 먼저 끝나도 이야기가 끝날 때까지 재조회한다', async ({ page }) => {
    const server = await mockApis(page, { storyStatus: 'PENDING', enriching: true });
    await page.goto(`/app/trips/${ID}`);
    await expect(page.getByText('大須商店街')).toBeVisible();

    server.state = { storyStatus: 'PENDING' };
    await expect(page.getByText('오스 상점가', { exact: true })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(WRITING).first()).toBeVisible();
    await expectAnotherPoll(server);
    await expectAnotherPoll(server);
    await expect(heading(page)).toHaveText(DRAFT_TITLE);

    server.state = { storyStatus: 'DONE', stories: true, title: STORY_TITLE };
    await expect(heading(page)).toHaveText(STORY_TITLE, { timeout: 8000 });
    await expect(page.getByText('오스 상점가 골목을 걷는다')).toBeVisible();
    await expectPollingStopped(page, server);
  });

  test('확정한 일정도 이야기가 PENDING이면 재조회를 멈추지 않는다', async ({ page }) => {
    const server = await mockApis(page, { status: 'FINALIZED', storyStatus: 'PENDING' });
    await page.goto(`/app/trips/${ID}`);

    await expect(page.getByText('확정됨')).toBeVisible();
    await expectAnotherPoll(server);
    await expectAnotherPoll(server);

    server.state = { status: 'FINALIZED', storyStatus: 'DONE', stories: true, title: STORY_TITLE };
    await expect(heading(page)).toHaveText(STORY_TITLE, { timeout: 8000 });
    await expect(page.getByText('장어 덮밥 이야기')).toBeVisible();
  });

  test('상태가 없는 옛 일정은 메모가 비어 있어도 기다리지 않는다', async ({ page }) => {
    const server = await mockApis(page, { storyStatus: null });
    await page.goto(`/app/trips/${ID}`);

    await expect(page.getByText(REASON)).toBeVisible();
    await expect(page.getByText(WRITING)).toHaveCount(0);
    await expectPollingStopped(page, server);
  });

  test('이야기를 기다리는 사이 사용자가 고친 제목은 끝난 뒤에도 남는다', async ({ page }) => {
    const MY_TITLE = '엄마랑 나고야';
    const server = await mockApis(page, { storyStatus: 'PENDING' },
      (body) => itinerary({ storyStatus: 'PENDING', title: String(body.title) }));
    await page.goto(`/app/trips/${ID}`);

    await page.getByRole('button', { name: '제목·태그 편집' }).click();
    const dialog = page.getByRole('dialog', { name: '일정 편집' });
    await dialog.getByPlaceholder('여행 제목').fill(MY_TITLE);
    await dialog.getByRole('button', { name: '저장' }).click();
    await expect(heading(page)).toHaveText(MY_TITLE);

    // 서버는 제목이 임시값일 때만 이야기 제목으로 바꾸므로 사용자가 고친 제목을 돌려준다.
    server.state = { storyStatus: 'DONE', stories: true, title: MY_TITLE };
    await expect(page.getByText('장어 덮밥 이야기')).toBeVisible({ timeout: 8000 });
    await expect(heading(page)).toHaveText(MY_TITLE);
  });

  test('태그만 고쳐 저장하면 이야기가 끝난 뒤 이야기 제목을 따른다', async ({ page }) => {
    const server = await mockApis(page, { storyStatus: 'PENDING' },
      (body) => ({ ...itinerary({ storyStatus: 'PENDING', title: String(body.title) }), tags: body.tags }));
    await page.goto(`/app/trips/${ID}`);

    await page.getByRole('button', { name: '제목·태그 편집' }).click();
    const dialog = page.getByRole('dialog', { name: '일정 편집' });
    await dialog.getByPlaceholder('태그 입력 후 Enter').fill('장어');
    await dialog.getByRole('button', { name: '태그 추가' }).click();
    await dialog.getByRole('button', { name: '저장' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(heading(page)).toHaveText(DRAFT_TITLE);

    server.state = { storyStatus: 'DONE', stories: true, title: STORY_TITLE };
    await expect(heading(page)).toHaveText(STORY_TITLE, { timeout: 8000 });
    await expect(sidebarTitle(page, STORY_TITLE)).toBeVisible();
  });

  test('제목 저장 전에 읽은 이야기 완료 응답이 저장 응답보다 늦게 와도 고친 제목을 되돌리지 않는다', async ({ page }) => {
    const MY_TITLE = '엄마랑 나고야';
    let releasePut: () => void = () => undefined;
    const putAnswered = new Promise<void>((resolve) => { releasePut = resolve; });
    let held = 0;
    let releasedHeld = false;
    // 저장은 이야기가 끝나기 전에 일정을 읽어 PENDING으로 답한다.
    const server = await mockApis(page, { storyStatus: 'PENDING' },
      (body) => itinerary({ storyStatus: 'PENDING', title: String(body.title) }));
    await page.goto(`/app/trips/${ID}`);
    await expect(page.getByText(WRITING).first()).toBeVisible();

    // 이야기가 제목을 바꾼 직후 읽은 조회는 저장 응답이 간 뒤에 도착하고, 그 뒤 조회는 저장된 사용자 제목을 읽는다.
    await page.route(`**/api/proxy/itineraries/${ID}`, async (route: Route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback();
        releasePut();
        return;
      }
      held += 1;
      if (held === 1) {
        await putAnswered;
        await new Promise((r) => setTimeout(r, 300));
        await route.fulfill(ok(itinerary({ storyStatus: 'DONE', stories: true, title: STORY_TITLE })));
        releasedHeld = true;
        return;
      }
      return route.fulfill(ok(itinerary({ storyStatus: 'DONE', stories: true, title: MY_TITLE })));
    });
    await expect.poll(() => held, { timeout: 8000 }).toBe(1);

    await page.getByRole('button', { name: '제목·태그 편집' }).click();
    const dialog = page.getByRole('dialog', { name: '일정 편집' });
    await dialog.getByPlaceholder('여행 제목').fill(MY_TITLE);
    await dialog.getByRole('button', { name: '저장' }).click();
    await expect(heading(page)).toHaveText(MY_TITLE);

    await expect.poll(() => releasedHeld, { timeout: 5000 }).toBe(true);
    await expect(page.getByText('장어 덮밥 이야기')).toBeVisible();
    await page.waitForTimeout(500);
    await expect(heading(page)).toHaveText(MY_TITLE);
    await expect(sidebarTitle(page, STORY_TITLE)).toHaveCount(0);
    expect(server.gets).toBeGreaterThan(0);
  });
});
