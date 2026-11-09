import { authFetch } from '@/lib/api/fetchClient';
import type {
  Itinerary,
  ItinerarySummary,
  ItineraryGenerateRequest,
  WizardPlace,
} from '@/lib/types/itinerary';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: null | { code: string; message: string };
}

/** 비2xx 응답의 서버 메시지(ApiResponse.error.message). 본문이 없거나 JSON이 아니면 fallback. */
async function errorMessage(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => null)) as ApiResponse<unknown> | null;
  return body?.error?.message ?? fallback;
}

/** 스텝 편집 실패. 404·409는 다른 탭·기기에서 일정이 바뀌어 화면이 낡았다는 뜻이다. */
export class StepEditError extends Error {
  constructor(message: string, readonly stale: boolean) {
    super(message);
  }
}

async function stepEditError(res: Response, fallback: string): Promise<StepEditError> {
  return new StepEditError(await errorMessage(res, fallback), res.status === 404 || res.status === 409);
}

async function parseJson<T>(res: Response): Promise<T> {
  const body: ApiResponse<T> = await res.json();
  if (!body.success) {
    throw new Error(body.error?.message ?? '알 수 없는 오류가 발생했습니다.');
  }
  return body.data;
}

/** rate-limit·쿼터 거부(PLANNING_003/004)를 일반 실패와 구분해 호출부가 차단 안내를 띄우게 한다. */
export class GenerationRejectedError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'GenerationRejectedError';
    this.code = code;
  }
}

/** POST /api/itineraries/generate → { jobId } */
export async function startItineraryGeneration(req: ItineraryGenerateRequest): Promise<string> {
  const res = await authFetch('/api/itineraries/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    // 429(차단·쿼터 초과) 등은 error.code를 담아 던져 호출부가 구분하게 한다.
    const body = (await res.json().catch(() => null)) as ApiResponse<unknown> | null;
    const code = body?.error?.code;
    const message = body?.error?.message ?? '일정 생성 요청에 실패했습니다.';
    if (code) throw new GenerationRejectedError(code, message);
    throw new Error(message);
  }
  const data = await parseJson<{ jobId: string }>(res);
  return data.jobId;
}

/** 생성 쿼터/차단 상태 (백엔드 GenerationQuotaResponse). */
export interface GenerationQuota {
  used: number;
  limit: number;
  resetAt: string | null;  // ISO. 쿼터 창 리셋(첫 생성 +30일)
  blockedUntil: string | null;  // ISO. 검증 실패 차단 해제 시각
}

/** GET /api/itineraries/generation-quota */
export async function fetchGenerationQuota(): Promise<GenerationQuota> {
  const res = await authFetch('/api/itineraries/generation-quota');
  if (!res.ok) throw new Error('생성 한도를 불러오지 못했습니다.');
  return parseJson<GenerationQuota>(res);
}

/** GET /api/itineraries/{id} */
export async function fetchItinerary(id: number): Promise<Itinerary> {
  const res = await authFetch(`/api/itineraries/${id}`);
  if (!res.ok) throw new Error('일정을 불러오는데 실패했습니다.');
  return parseJson<Itinerary>(res);
}

/** GET /api/itineraries (페이지네이션) */
export async function fetchMyItineraries(page = 0, size = 20): Promise<PageResponse<ItinerarySummary>> {
  const res = await authFetch(`/api/itineraries?page=${page}&size=${size}`);
  if (!res.ok) throw new Error('일정 목록을 불러오는데 실패했습니다.');
  return parseJson<PageResponse<ItinerarySummary>>(res);
}

/** DELETE /api/itineraries/{id}. 204 No Content라 본문을 파싱하지 않는다. */
export async function deleteItinerary(id: number): Promise<void> {
  const res = await authFetch(`/api/itineraries/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await errorMessage(res, '일정 삭제에 실패했습니다.'));
}

/** PATCH /api/itineraries/{id}/steps/{stepId}/select-alternative */
export async function selectAlternative(
  itineraryId: number,
  stepId: number,
  alternativeId: number,
): Promise<Itinerary> {
  const res = await authFetch(
    `/api/itineraries/${itineraryId}/steps/${stepId}/select-alternative`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alternativeId }),
    },
  );
  if (!res.ok) throw await stepEditError(res, '대안 선택에 실패했습니다.');
  return parseJson<Itinerary>(res);
}

/**
 * PATCH /api/itineraries/{id}/steps/reorder
 * orderedStepIds는 해당 day 전체 스텝 id를 새 순서대로. 응답은 갱신된 전체 일정.
 */
export async function reorderSteps(
  itineraryId: number,
  dayNumber: number,
  orderedStepIds: number[],
): Promise<Itinerary> {
  const res = await authFetch(`/api/itineraries/${itineraryId}/steps/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dayNumber, orderedStepIds }),
  });
  if (!res.ok) throw await stepEditError(res, '순서 변경에 실패했습니다.');
  return parseJson<Itinerary>(res);
}

/** DELETE /api/itineraries/{id}/steps/{stepId}. 응답은 갱신된 전체 일정. */
export async function deleteStep(itineraryId: number, stepId: number): Promise<Itinerary> {
  const res = await authFetch(`/api/itineraries/${itineraryId}/steps/${stepId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw await stepEditError(res, '일정 삭제에 실패했습니다.');
  return parseJson<Itinerary>(res);
}

/** PUT /api/itineraries/{id} */
export async function updateItinerary(
  id: number,
  payload: { title?: string | null; tags?: string[] },
): Promise<Itinerary> {
  const res = await authFetch(`/api/itineraries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await errorMessage(res, '일정 수정에 실패했습니다.'));
  return parseJson<Itinerary>(res);
}

/** 백엔드 PlaceResponse (검색 결과 항목) */
interface PlaceSearchItem {
  id: number;
  name: string;
  address: string;
  latitude: number;   // BigDecimal → JSON number
  longitude: number;
  category: string;  // Foursquare 원시 계층 문자열이라 프론트 Category와 다르다. 표시/분기에 쓰지 않는다
  region: string | null;
}

/** GET /api/places/search?keyword=&lat=&lng=&radius=
 *  백엔드는 ApiResponse<PageResponse<PlaceResponse>> 를 반환하므로 content를 꺼내 매핑한다. */
export async function searchPlaces(keyword: string): Promise<WizardPlace[]> {
  if (!keyword.trim()) return [];
  const res = await authFetch(
    `/api/places/search?keyword=${encodeURIComponent(keyword)}`,
  );
  // 실패를 빈 배열로 돌리면 화면이 "결과 없음"으로 보여 원인을 숨긴다.
  if (!res.ok) throw new Error('장소 검색에 실패했습니다.');
  const page = await parseJson<PageResponse<PlaceSearchItem>>(res);
  return page.content.map((p) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    latitude: Number(p.latitude),
    longitude: Number(p.longitude),
    category: p.category,
    region: p.region ?? undefined,
  }));
}

/** 공유 링크 생성 응답 (백엔드 ShareLinkResponse). */
export interface ShareLink {
  shareToken: string;
  expiresAt: string; // OffsetDateTime → ISO 문자열
}

/** POST /api/itineraries/{id}/share. 토큰+만료를 발급한다. */
export async function shareItinerary(id: number): Promise<ShareLink> {
  const res = await authFetch(`/api/itineraries/${id}/share`, { method: 'POST' });
  if (!res.ok) throw new Error('공유 링크 생성에 실패했습니다.');
  return parseJson<ShareLink>(res);
}

/** 자연어 문장 파싱 결과 (백엔드 SentenceParseResponse). 미추론 필드는 null/[]. */
export interface ParsedTrip {
  destination: string | null;
  startDate: string | null;  // "2026-07-25"
  endDate: string | null;
  party: string | null;      // "이해했어요" 패널 표시용 원문
  companion: string | null;
  partySize: number | null;
  arrivalTime: string | null; // "HH:mm"
  departureTime: string | null;
  themes: string[];
  categories: string[];
  pace: string | null;
  transportPref: string | null;
  budget: number | null;
}

/**
 * POST /api/itineraries/parse. 콘텐츠 실패도 백엔드가 200 + empty()로 주므로 2xx면 항상 파싱된다.
 * 비2xx(500자 초과 400 등)는 서버 메시지로 throw하고, abort 시 AbortError를 던진다.
 */
export async function parseTripSentence(
  sentence: string,
  signal?: AbortSignal,
): Promise<ParsedTrip> {
  const res = await authFetch('/api/itineraries/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sentence }),
    signal,
  });
  if (!res.ok) throw new Error(await errorMessage(res, '문장을 분석하지 못했어요.'));
  return parseJson<ParsedTrip>(res);
}

/** POST /api/itineraries/{id}/finalize */
export async function finalizeItinerary(id: number): Promise<Itinerary> {
  const res = await authFetch(`/api/itineraries/${id}/finalize`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(await errorMessage(res, '일정 확정에 실패했습니다.'));
  return parseJson<Itinerary>(res);
}
