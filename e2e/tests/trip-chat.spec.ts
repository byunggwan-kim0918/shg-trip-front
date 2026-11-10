import type { Page, Route } from '@playwright/test';
import { test, expect } from '../fixtures/auth';

/**
 * 대화형 여행 입력 화면 동작. 대화 API는 대역으로 바꿔 Haiku를 부르지 않는다.
 * 실제 Haiku·생성 연동은 trip-chat-haiku.spec.ts(@haiku)에서 본다.
 */

type Json = Record<string, unknown>;

const CITY = {
  id: 'q-city', slot: 'CITY', kind: 'BASE', lead: null, title: '어디로 떠나볼까요?',
  description: '도시 이름만 적어도 좋아요. 떠올린 여행이 있다면 함께 들려주세요.',
  placeholder: '가고 싶은 곳을 적어주세요', examples: ['부산', '제주에서 조용히 쉬고 싶어', '강릉으로 친구랑 여행 갈 거야'],
  examplesOpen: false, tool: null, prefill: null,
};
const MOOD = {
  id: 'q-mood', slot: 'MOOD', kind: 'BASE', lead: '부산 여행을 생각하고 있군요.', title: '이번 여행에서 뭘 하고 싶어요?',
  description: '꼭 멋진 계획이 없어도 괜찮아요. 떠오르는 느낌이면 충분해요.', placeholder: '예: 바다 보면서 느긋하게 쉬고 싶어',
  examples: ['낮에는 쉬고 저녁에는 야경 보고 싶어', '맛있는 거 먹고 골목 구경할래', '아직 잘 모르겠어'],
  examplesOpen: false, tool: null, prefill: null,
};
const WALK_FOLLOW_UP = {
  id: 'q-walk', slot: 'TRANSPORT', kind: 'FOLLOW_UP', lead: '걷는 쪽으로 생각 중이군요.', title: '먼 곳은 택시나 버스도 괜찮아요?',
  description: '가까운 곳만 걸어서 둘러봐도 좋아요.', placeholder: '예: 멀면 택시도 괜찮아',
  examples: ['가까운 곳만 걸어 다닐래', '멀면 다른 교통편도 괜찮아'], examplesOpen: true, tool: 'UNKNOWN', prefill: null,
};
const LONG_ANSWER = '부산에 남자친구랑 11월 20일부터 25일까지 가는데, 차 없이 낭만적으로 쉬다 오고 싶어. '
  + '해운대 근처에서 자고 싶고 블루라인파크는 꼭 타보고 싶고 해산물은 잘 못 먹어서 다른 음식 위주면 좋겠어.';

const ROWS = [
  { slot: 'CITY', label: '여행지', value: '부산', notes: [], filled: true },
  { slot: 'DATES', label: '날짜', value: '11월 20일(금) ~ 25일(수) · 5박 6일', notes: [], filled: true },
  { slot: 'COMPANY', label: '동행', value: '남자친구랑 둘이', notes: [], filled: true },
  { slot: 'MOOD', label: '취향', value: '바다 보면서 느긋하게 쉬기', notes: ['느긋한 일정 · 바다/해변·힐링 위주로 찾아요 (제안)'], filled: true },
  { slot: 'TRANSPORT', label: '이동', value: '도보 중심 · 멀면 택시나 버스', notes: ['버스·지하철 노선과 시간표는 반영되지 않아요. 이동 시간은 차 기준으로 추정해요.'], filled: true },
  { slot: 'ANCHORS', label: '정해둔 것', value: '숙소는 해운대 쪽 · 꼭 갈 곳: 블루라인파크', notes: ['숙소 위치는 참고만 해요.', '해운대 블루라인파크 · 일정에 꼭 넣어요.'], filled: true },
];

function chat(over: Json): Json {
  return {
    id: '7b1c7c1e-0000-4000-8000-000000000001', version: 1, status: 'ASKING', question: CITY, lastExchange: null,
    history: [], summary: { rows: ROWS.map((r) => ({ ...r, value: '아직 미정', notes: [], filled: false })), fixes: [], ready: false },
    back: null, pending: null, jobId: null, days: null, ...over,
  };
}

function ok(data: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data, error: null }) };
}

function fail(status: number, code: string, message: string) {
  return { status, contentType: 'application/json', body: JSON.stringify({ success: false, data: null, error: { code, message } }) };
}

interface Call { method: string; path: string; body: Json | null }

/** 대화 API 대역. answer는 보낸 답에 따라 다음 응답을 정한다. */
async function mockTripChat(page: Page, opts: {
  current: Json | null | (() => Json | null);
  answer?: (body: Json, n: number) => ReturnType<typeof ok>;
  confirm?: () => ReturnType<typeof ok>;
}) {
  const calls: Call[] = [];
  let answers = 0;
  const current = () => (typeof opts.current === 'function' ? opts.current() : opts.current);
  await page.route('**/api/proxy/trip-chats**', async (route: Route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace('/api/proxy', '/api');
    const body = req.postData() ? (JSON.parse(req.postData()!) as Json) : null;
    calls.push({ method: req.method(), path, body });
    if (path.endsWith('/current') && req.method() === 'GET') return route.fulfill(ok(current()));
    if (path.endsWith('/answers')) return route.fulfill(opts.answer ? opts.answer(body!, answers++) : ok(current()));
    if (path.endsWith('/confirm')) return route.fulfill(opts.confirm ? opts.confirm() : ok(current()));
    if (path === '/api/trip-chats' && req.method() === 'POST') return route.fulfill(ok(chat({})));
    return route.fulfill(ok(current()));
  });
  return { calls, answerCalls: () => calls.filter((c) => c.path.endsWith('/answers')) };
}

async function shot(page: Page, name: string) {
  // 턴 전환 애니메이션이 끝난 화면을 남긴다. 대기 점처럼 무한 반복하는 것은 기다리지 않는다.
  await page.evaluate(() => Promise.all(document.getAnimations()
    .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
    .map((a) => a.finished.catch(() => undefined))));
  await page.screenshot({ path: test.info().outputPath(`${name}.png`), fullPage: true });
}

test.describe('trip chat input', () => {
  test('첫 화면은 질문 하나와 입력창 하나, 예시는 접혀 있고 누르면 입력창만 채운다', async ({ page }) => {
    const api = await mockTripChat(page, { current: chat({}) });
    await page.goto('/app/trips/new');

    await expect(page.getByRole('heading', { name: '어디로 떠나볼까요?' })).toBeVisible();
    await expect(page.getByText('우리, 여행 이야기부터 해볼까요?')).toBeVisible();
    await expect(page.getByRole('button', { name: '제주에서 조용히 쉬고 싶어' })).toHaveCount(0);
    await shot(page, 'first-screen');

    await page.getByRole('button', { name: '막막하면 예시 보기' }).click();
    await page.getByRole('button', { name: '제주에서 조용히 쉬고 싶어' }).click();

    await expect(page.getByLabel('답변', { exact: true })).toHaveValue('제주에서 조용히 쉬고 싶어');
    expect(api.answerCalls()).toHaveLength(0);
  });

  test('Enter로 보내고, 한글 조합 중 Enter와 Shift+Enter로는 보내지 않는다', async ({ page }) => {
    const api = await mockTripChat(page, {
      current: chat({}),
      answer: (body) => ok(chat({ version: 2, question: MOOD, back: 'CITY',
        lastExchange: { question: '어디로 떠나볼까요?', answer: body.text }, history: [{ question: '어디로 떠나볼까요?', answer: body.text }] })),
    });
    await page.goto('/app/trips/new');
    const input = page.getByLabel('답변', { exact: true });
    await input.fill('부산');

    await input.evaluate((el) => el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, isComposing: true })));
    await input.press('Shift+Enter');
    await page.waitForTimeout(200);
    expect(api.answerCalls()).toHaveLength(0);
    await expect(input).toHaveValue('부산\n');

    await input.press('Enter');
    await expect(page.getByRole('heading', { name: '이번 여행에서 뭘 하고 싶어요?' })).toBeVisible();
    await expect(page.getByText('부산 여행을 생각하고 있군요.', { exact: true })).toBeVisible();
    expect(api.answerCalls()).toHaveLength(1);
    expect(api.answerCalls()[0].body).toMatchObject({ questionId: 'q-city', kind: 'text', text: '부산' });
  });

  test('해석이 실패하면 답을 입력창에 남기고, 다시 보내면 같은 요청 id를 쓴다', async ({ page }) => {
    const api = await mockTripChat(page, {
      current: chat({}),
      answer: (body, n) => n === 0
        ? fail(503, 'PLANNING_010', '답변을 정리하지 못했어요. 잠시 후 다시 보내주세요.')
        : ok(chat({ version: 2, question: MOOD, lastExchange: { question: '어디로 떠나볼까요?', answer: body.text } })),
    });
    await page.goto('/app/trips/new');
    const input = page.getByLabel('답변', { exact: true });
    await input.fill('부산');
    await input.press('Enter');

    await expect(page.getByText('답변을 정리하지 못했어요. 잠시 후 다시 보내주세요.', { exact: true })).toBeVisible();
    await expect(input).toHaveValue('부산');

    await page.getByRole('button', { name: '답변 보내기' }).click();
    await expect(page.getByRole('heading', { name: '이번 여행에서 뭘 하고 싶어요?' })).toBeVisible();
    const [first, second] = api.answerCalls();
    expect(second.body!.clientTurnId).toBe(first.body!.clientTurnId);
  });

  test('되묻기는 반응·질문·보조 문장·예시를 한 카드에 보이고 "아직 모르겠어요"로 넘길 수 있다', async ({ page }) => {
    const api = await mockTripChat(page, {
      current: chat({ version: 5, question: WALK_FOLLOW_UP, back: 'TRANSPORT',
        lastExchange: { question: '여행지에서는 어떻게 이동하나요?', answer: '흠 걸어서?' } }),
      answer: () => ok(chat({ version: 6, status: 'REVIEW', question: null, summary: { rows: ROWS, fixes: [], ready: true } })),
    });
    await page.goto('/app/trips/new');

    await expect(page.getByText('걷는 쪽으로 생각 중이군요.', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: '먼 곳은 택시나 버스도 괜찮아요?' })).toBeVisible();
    await expect(page.getByRole('button', { name: '멀면 다른 교통편도 괜찮아' })).toBeVisible();
    await expect(page.getByText('흠 걸어서?', { exact: true })).toBeVisible();
    await shot(page, 'follow-up');

    await page.getByRole('button', { name: '아직 모르겠어요' }).click();
    await expect(page.getByRole('heading', { name: '생각한 여행이 맞나요?' })).toBeVisible();
    expect(api.answerCalls()[0].body).toMatchObject({ questionId: 'q-walk', kind: 'unknown', text: null });
  });

  test('확인 화면은 확정·제안·반영 한계를 구분해 보이고, 누르기 전에는 생성하지 않는다', async ({ page }) => {
    let confirms = 0;
    await mockTripChat(page, {
      current: chat({ version: 9, status: 'REVIEW', question: null, history: [{ question: 'q', answer: 'a' }],
        summary: { rows: ROWS, fixes: [], ready: true } }),
      confirm: () => {
        confirms += 1;
        return ok(chat({ version: 11, status: 'CONFIRMED', question: null, jobId: 'job-test', days: 6,
          summary: { rows: ROWS, fixes: [], ready: true } }));
      },
    });
    await page.goto('/app/trips/new');

    await expect(page.getByRole('heading', { name: '생각한 여행이 맞나요?' })).toBeVisible();
    await expect(page.getByText('느긋한 일정 · 바다/해변·힐링 위주로 찾아요 (제안)')).toBeVisible();
    await expect(page.getByText(/노선과 시간표는 반영되지 않아요/)).toBeVisible();
    await expect(page.getByRole('button', { name: '이동 수정' })).toBeVisible();
    await shot(page, 'review');
    expect(confirms).toBe(0);

    await page.route('**/api/proxy/itineraries/generate/**', (route) => route.abort());
    await page.getByRole('button', { name: /이 내용으로 일정 만들기/ }).dblclick();
    await expect(page).toHaveURL(/\/app\/trips\/generating/);
    expect(confirms).toBe(1);
    // 생성이 끝나면 이 대화만 보관하도록 생성 화면이 대화 id를 넘겨받는다.
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem('shg_active_chat_id')))
      .toBe('7b1c7c1e-0000-4000-8000-000000000001');
  });

  test('생성에 필요한 날짜가 없으면 그 정보만 묻고 만들기 버튼을 막는다', async ({ page }) => {
    const rows = ROWS.map((r) => (r.slot === 'DATES' ? { ...r, value: '11월 중순쯤 · 날짜 미정' } : r));
    const fix = {
      questionId: 'fix:dates_missing', slot: 'DATES', title: '언제 떠날지 알려줄래요?',
      description: '11월 중순쯤이라고 했어요. 날짜를 알아야 일정을 만들 수 있어요.', placeholder: '예: 11월 20일부터 25일까지',
      examples: ['11월 13일(금)부터 15일(일)까지', '11월 14일(토)부터 15일(일)까지'],
    };
    const api = await mockTripChat(page, {
      current: chat({ version: 4, status: 'REVIEW', question: null, summary: { rows, fixes: [fix], ready: false } }),
      answer: () => ok(chat({ version: 5, status: 'REVIEW', question: null, summary: { rows: ROWS, fixes: [], ready: true } })),
    });
    await page.goto('/app/trips/new');

    await expect(page.getByLabel('언제 떠날지 알려줄래요?')).toBeVisible();
    await expect(page.getByRole('button', { name: /이 내용으로 일정 만들기/ })).toBeDisabled();
    await page.getByRole('button', { name: '11월 13일(금)부터 15일(일)까지' }).click();
    await page.getByRole('button', { name: '보내기', exact: true }).click();

    await expect(page.getByRole('button', { name: /이 내용으로 일정 만들기/ })).toBeEnabled();
    expect(api.answerCalls()[0].body).toMatchObject({ questionId: 'fix:dates_missing', text: '11월 13일(금)부터 15일(일)까지' });
  });

  test('긴 한국어 답이 줄바꿈되고 화면이 가로로 넘치지 않는다', async ({ page }) => {
    await mockTripChat(page, {
      current: chat({ version: 3, question: MOOD, back: 'CITY', lastExchange: { question: '어디로 떠나볼까요?', answer: LONG_ANSWER } }),
    });
    await page.goto('/app/trips/new');
    await expect(page.getByText(LONG_ANSWER)).toBeVisible();

    const overflow = await page.evaluate(() => {
      const main = document.querySelector('main')!;
      return { doc: document.documentElement.scrollWidth - document.documentElement.clientWidth, main: main.scrollWidth - main.clientWidth };
    });
    expect(overflow.doc).toBeLessThanOrEqual(0);
    expect(overflow.main).toBeLessThanOrEqual(0);
    const titleBox = await page.getByRole('heading', { name: '이번 여행에서 뭘 하고 싶어요?' }).boundingBox();
    expect(titleBox!.width).toBeGreaterThan(150);
    await shot(page, 'long-answer');
  });

  test('일정이 없으면 대시보드에서 바로 첫 질문을 보여준다', async ({ page }) => {
    await page.route('**/api/proxy/itineraries?**', (route) => route.fulfill(ok({
      content: [], totalElements: 0, totalPages: 0, number: 0, size: 20,
    })));
    await mockTripChat(page, { current: chat({}) });
    await page.goto('/app/trips');

    await expect(page.getByRole('heading', { name: '어디로 떠나볼까요?' })).toBeVisible();
    await expect(page.getByLabel('답변', { exact: true })).toBeVisible();
    await expect(page.getByText('직접 고를래요')).toHaveCount(0);
    await shot(page, 'dashboard-empty');
  });

  test('랜딩에서 적은 문장은 첫 질문의 답으로 보내고 지운다', async ({ page }) => {
    const sentence = '부산 11월 20일부터 25일까지 둘이';
    const api = await mockTripChat(page, {
      current: null,
      answer: (body) => ok(chat({ version: 2, question: MOOD, back: 'CITY',
        lastExchange: { question: '어디로 떠나볼까요?', answer: body.text }, history: [{ question: '어디로 떠나볼까요?', answer: body.text }] })),
    });
    await page.goto('/');
    await page.evaluate((s) => sessionStorage.setItem('shg.newTripSentence', s), sentence);
    await page.goto('/app/trips/new');

    await expect(page.getByRole('heading', { name: '이번 여행에서 뭘 하고 싶어요?' })).toBeVisible();
    expect(api.answerCalls()).toHaveLength(1);
    expect(api.answerCalls()[0].body).toMatchObject({ questionId: 'q-city', kind: 'text', text: sentence });
    expect(await page.evaluate(() => sessionStorage.getItem('shg.newTripSentence'))).toBeNull();
  });

  test('다른 탭에서 대화가 마무리됐으면 새로 시작하라고 알린다', async ({ page }) => {
    let gets = 0;
    await mockTripChat(page, {
      current: () => (gets++ === 0 ? chat({}) : null),
      answer: () => fail(409, 'PLANNING_009', '대화가 바뀌었어요.'),
    });
    await page.goto('/app/trips/new');
    const input = page.getByLabel('답변', { exact: true });
    await input.fill('부산');
    await input.press('Enter');

    await expect(page.getByText(/이 대화는 이미 마무리됐어요/)).toBeVisible();
  });

  test('새로고침 전에 보낸 답을 정리하는 중이면 끝날 때까지 기다렸다 이어간다', async ({ page }) => {
    let gets = 0;
    await mockTripChat(page, {
      current: () => (gets++ < 2
        ? chat({ version: 2, pending: '부산' })
        : chat({ version: 3, question: MOOD, back: 'CITY', lastExchange: { question: '어디로 떠나볼까요?', answer: '부산' } })),
    });
    await page.goto('/app/trips/new');

    await expect(page.getByText('부산', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: '어디로 떠나볼까요?' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: '이번 여행에서 뭘 하고 싶어요?' })).toBeVisible({ timeout: 8000 });
  });

  test('생성 화면에서 추가 조건을 고치러 오면 그 입력을 펼쳐 둔다', async ({ page }) => {
    await mockTripChat(page, {
      current: chat({ version: 9, status: 'REVIEW', question: null, history: [{ question: 'q', answer: 'a' }],
        summary: { rows: ROWS, fixes: [], ready: true } }),
    });
    await page.goto('/app/trips/new?focus=extras');

    await expect(page.getByPlaceholder(/첫날 오후 3시에 도착해/)).toBeVisible();
  });

  test('다크 모드에서도 같은 카드 구성으로 보인다', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await mockTripChat(page, {
      current: chat({ version: 5, question: WALK_FOLLOW_UP, back: 'TRANSPORT',
        lastExchange: { question: '여행지에서는 어떻게 이동하나요?', answer: '흠 걸어서?' } }),
    });
    await page.goto('/app/trips/new');

    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.getByRole('heading', { name: '먼 곳은 택시나 버스도 괜찮아요?' })).toBeVisible();
    await shot(page, 'follow-up-dark');
  });

  test('답변 모아보기는 나눈 이야기를 보여주고 Esc로 닫힌다', async ({ page }) => {
    await mockTripChat(page, {
      current: chat({ version: 3, question: MOOD, back: 'CITY',
        history: [{ question: '어디로 떠나볼까요?', answer: '부산 11월 20일부터 25일까지 남자친구랑 둘이' }],
        summary: { rows: ROWS.slice(0, 3).concat(ROWS.slice(3).map((r) => ({ ...r, value: '아직 미정', notes: [], filled: false }))), fixes: [], ready: false } }),
    });
    await page.goto('/app/trips/new');
    await page.getByRole('button', { name: '답변 모아보기' }).click();

    const dialog = page.getByRole('dialog', { name: '지금까지 나눈 이야기' });
    await expect(dialog.getByText('남자친구랑 둘이', { exact: true })).toBeVisible();
    await expect(dialog.getByText('아직 미정')).toHaveCount(0);
    await shot(page, 'history');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });
});
