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

/** DELETE /api/itineraries/{id} — soft delete. 204 No Content이므로 본문 파싱하지 않는다. */
export async function deleteItinerary(id: number): Promise<void> {
  const res = await authFetch(`/api/itineraries/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('일정 삭제에 실패했습니다.');
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

/** 백엔드 PlaceResponse (검색 결과 항목) */
interface PlaceSearchItem {
  id: number;
  name: string;
  address: string;
  latitude: number;   // BigDecimal → JSON number
  longitude: number;
  category: string;    // Foursquare 원시 계층 문자열 — 표시/분기용으로 신뢰 금지
  region: string | null;
}

/** GET /api/places/search?keyword=&lat=&lng=&radius=
 *  백엔드는 ApiResponse<PageResponse<PlaceResponse>> 를 반환하므로 content를 꺼내 매핑한다. */
export async function searchPlaces(keyword: string): Promise<WizardPlace[]> {
  if (!keyword.trim()) return [];
  const res = await authFetch(
    `/api/places/search?keyword=${encodeURIComponent(keyword)}`,
  );
  if (!res.ok) return [];
  const page = await parseJson<PageResponse<PlaceSearchItem>>(res);
  return page.content.map((p) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    latitude: Number(p.latitude),
    longitude: Number(p.longitude),
    // category는 "Dining and Drinking > ..." 형태의 원시 taxonomy — 프론트 Category enum과 불일치, 표시/분기 금지
    category: p.category,
    region: p.region ?? undefined,
  }));
}

/** POST /api/itineraries/{id}/finalize — 일정 확정 */
export async function finalizeItinerary(id: number): Promise<Itinerary> {
  const res = await authFetch(`/api/itineraries/${id}/finalize`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('일정 확정에 실패했습니다.');
  return parseJson<Itinerary>(res);
}
