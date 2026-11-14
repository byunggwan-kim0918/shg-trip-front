import { authFetch } from '@/lib/api/fetchClient';
import type { Itinerary, ItinerarySummary } from '@/lib/types/itinerary';

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

/** 생성 쿼터/차단 상태 (백엔드 GenerationQuotaResponse). */
export interface GenerationQuota {
  used: number;
  limit: number;
  resetAt: string | null;  // ISO. 쿼터 창 리셋(첫 생성 +30일)
  blockedUntil: string | null;  // ISO. 검증 실패 차단 해제 시각
  /** 24시간 창에서 쿼터를 쓰지 않고 끝난 생성 수(조정 필요 저장·판정 거부). 백엔드 배포 전 응답엔 없다. */
  unbilledUsed?: number;
  unbilledLimit?: number;
  unbilledResetAt?: string | null;  // ISO. 미차감 창 리셋
}

/** 미차감 생성이 한도에 닿아 창이 끝날 때까지 생성이 막혔는지. */
export function isUnbilledBlocked(quota: GenerationQuota | null): boolean {
  return !!quota && quota.unbilledLimit != null && quota.unbilledLimit > 0
    && (quota.unbilledUsed ?? 0) >= quota.unbilledLimit;
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

/** POST /api/itineraries/{id}/finalize */
export async function finalizeItinerary(id: number): Promise<Itinerary> {
  const res = await authFetch(`/api/itineraries/${id}/finalize`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(await errorMessage(res, '일정 확정에 실패했습니다.'));
  return parseJson<Itinerary>(res);
}
