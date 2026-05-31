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

async function parseJson<T>(res: Response): Promise<T> {
  const body: ApiResponse<T> = await res.json();
  if (!body.success) {
    throw new Error(body.error?.message ?? '알 수 없는 오류가 발생했습니다.');
  }
  return body.data;
}

/** POST /api/itineraries/generate → { jobId } */
export async function startItineraryGeneration(req: ItineraryGenerateRequest): Promise<string> {
  const res = await authFetch('/api/itineraries/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error('일정 생성 요청에 실패했습니다.');
  const data = await parseJson<{ jobId: string }>(res);
  return data.jobId;
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
  if (!res.ok) throw new Error('대안 선택에 실패했습니다.');
  return parseJson<Itinerary>(res);
}

/** PUT /api/itineraries/{id} — 순서 변경 시 title/tags 포함 전송 */
export async function updateItinerary(
  id: number,
  payload: { title?: string | null; tags?: string[] },
): Promise<Itinerary> {
  const res = await authFetch(`/api/itineraries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('일정 수정에 실패했습니다.');
  return parseJson<Itinerary>(res);
}

/** GET /api/places/search?keyword=&lat=&lng=&radius= */
export async function searchPlaces(keyword: string): Promise<WizardPlace[]> {
  if (!keyword.trim()) return [];
  const res = await authFetch(
    `/api/places/search?keyword=${encodeURIComponent(keyword)}`,
  );
  if (!res.ok) return [];
  const data = await parseJson<WizardPlace[]>(res);
  return data;
}

/** POST /api/itineraries/{id}/finalize — 일정 확정 */
export async function finalizeItinerary(id: number): Promise<Itinerary> {
  const res = await authFetch(`/api/itineraries/${id}/finalize`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('일정 확정에 실패했습니다.');
  return parseJson<Itinerary>(res);
}
