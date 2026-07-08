// lib/types/itinerary.ts
// 백엔드 응답 구조 기준 타입 정의

export type TripMode = 'AUTO' | 'MANUAL';

export type Theme = 'healing' | 'activity' | 'food' | 'culture' | 'shopping' | 'nature' | 'adventure' | 'romance' | 'family' | 'budget' | 'luxury' | 'photo' | 'walking' | 'ocean' | 'mountain' | 'nightview' | 'local' | 'art' | 'festival' | 'pet';

export type Category = 'attraction' | 'restaurant' | 'cafe' | 'accommodation' | 'experience' | 'shopping' | 'nightlife' | 'nature' | 'museum' | 'theme_park' | 'spa' | 'market' | 'beach' | 'temple' | 'street_food' | 'viewpoint' | 'trail';

export type TripPace = 'tight' | 'normal' | 'relaxed';

export type TransportPref = 'walk' | 'car' | 'any';

/** 백엔드 TransportationMode enum 값 */
export type TransportType = 'WALK' | 'CAR' | 'BUS' | 'TRAIN' | 'SUBWAY' | 'TAXI' | 'BIKE' | 'FLIGHT';

/** 백엔드 Itinerary status enum 값 */
export type ItineraryStatus = 'DRAFT' | 'FINALIZED' | 'ARCHIVED';

/** 백엔드 PlaceResponse */
export interface Place {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  region: string | null;
  country: string | null;
  rating: number | null;
  priceLevel: number | null;
  openingHours: string | null;
  imageUrl: string | null;
}

/** 백엔드 AlternativeOptionResponse */
export interface AlternativeOption {
  id: number;
  optionOrder: number;
  place: Place;
  notes: string | null;
  estimatedCost: number | null;
}

/** 백엔드 ItineraryStepResponse */
export interface ItineraryStep {
  id: number;
  stepOrder: number;
  dayNumber: number;
  startTime: string | null;   // "09:00"
  endTime: string | null;     // "11:00"
  place: Place | null;
  transportationMode: TransportType | null;
  transportationDuration: number | null;  // 분
  transportationDistance: number | null;  // km
  transportationCost: number | null;
  notes: string | null;
  userNotes: string | null;
  estimatedCost: number | null;
  alternatives: AlternativeOption[];
}

/** 백엔드 ItineraryResponse */
export interface Itinerary {
  id: number;
  title: string | null;
  destination: string;
  startDate: string;   // "2026-05-01"
  endDate: string;     // "2026-05-03"
  totalBudget: number | null;
  estimatedCost: number | null;
  coverImage: string | null;
  tags: string[];
  status: ItineraryStatus;
  steps: ItineraryStep[];
}

/** 백엔드 ItinerarySummaryResponse (목록용) */
export interface ItinerarySummary {
  id: number;
  title: string | null;
  destination: string;
  startDate: string;
  endDate: string;
  status: ItineraryStatus;
  createdAt: string;
  coverImage: string | null;
}

/** 위자드 입력 데이터 (프론트 전용) */
export interface WizardData {
  mode: 'auto' | 'manual';
  destination: string;
  themes: Theme[];
  categories: Category[];
  pace: TripPace;
  transportPref: TransportPref;
  budget: number | null;
  startDate: string | null;
  endDate: string | null;
  description: string;
  selectedPlaces: WizardPlace[];  // Manual 모드 전용 (검색 결과 임시 저장용)
}

/** 위자드 장소 선택용 임시 타입 (Place 검색 결과) */
export interface WizardPlace {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  /** 표준 지역명(예: "Seoul", "Jeju"). 여행지-장소 지역 일치 경고에 사용. 자유입력 장소는 undefined */
  region?: string;
}

/** 백엔드 ItineraryGenerateRequest */
export interface ItineraryGenerateRequest {
  mode: 'AUTO' | 'MANUAL';
  destination: string;
  themes: string[];
  categories: string[];
  pace: string;
  transportPref: string;
  budget: number | null;
  startDate: string;
  endDate: string;
  description: string | null;
  selectedPlaceIds: number[];
}

/** steps[]를 dayNumber 기준으로 그룹핑한 뷰 전용 타입 */
export interface DayGroup {
  dayNumber: number;
  steps: ItineraryStep[];
}

/**
 * story(가이드북 문장 = step.notes)가 아직 비동기로 채워지는 중인지 판정.
 * 새 파이프라인은 구조 일정을 먼저 저장(notes=null)하고 Haiku가 비동기로 notes를 채운다.
 * DRAFT 상태에서 notes가 비어있는 step이 하나라도 있으면 생성 중으로 본다
 * (FINALIZED/fallback 경로는 이미 notes가 채워져 있어 false).
 */
export function hasPendingStory(itin: Itinerary): boolean {
  if (itin.status !== 'DRAFT') return false;
  return itin.steps.some((s) => !s.notes || s.notes.trim().length === 0);
}

/**
 * 장소 사진(place.imageUrl)이 아직 비동기로 채워지는 중인지 판정.
 * 백엔드는 일정 저장 시 imageUrl=null로 두고 Google/S3 이미지를 비동기로 업로드한다.
 * DRAFT 상태에서 place가 있는데 imageUrl이 비어있는 step이 하나라도 있으면 채워지는 중으로 본다.
 * (일부 장소는 매칭 실패로 끝내 null일 수 있어 폴링은 max attempts로 종료된다.)
 */
export function hasPendingImage(itin: Itinerary): boolean {
  if (itin.status !== 'DRAFT') return false;
  return itin.steps.some((s) => s.place != null && !s.place.imageUrl);
}

/** steps[]를 dayNumber 기준으로 그룹핑 */
export function groupStepsByDay(steps: ItineraryStep[]): DayGroup[] {
  const map = new Map<number, ItineraryStep[]>();
  for (const step of steps) {
    const list = map.get(step.dayNumber) ?? [];
    list.push(step);
    map.set(step.dayNumber, list);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([dayNumber, daySteps]) => ({
      dayNumber,
      steps: daySteps.sort((a, b) => a.stepOrder - b.stepOrder),
    }));
}
