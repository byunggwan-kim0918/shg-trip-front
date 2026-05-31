// lib/types/itinerary.ts
// 백엔드 응답 구조 기준 타입 정의

export type TripMode = 'AUTO' | 'MANUAL';

export type Theme = 'healing' | 'activity' | 'food' | 'culture' | 'shopping' | 'nature' | 'adventure' | 'romance' | 'family' | 'budget' | 'luxury' | 'photo' | 'walking' | 'ocean' | 'mountain' | 'nightview' | 'local' | 'art' | 'festival' | 'pet';

export type Category = 'attraction' | 'restaurant' | 'cafe' | 'accommodation' | 'experience' | 'shopping' | 'nightlife' | 'nature' | 'museum' | 'theme_park' | 'spa' | 'market' | 'beach' | 'temple' | 'street_food' | 'viewpoint' | 'trail';

export type TripPace = 'tight' | 'normal' | 'relaxed';

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
}

/** 백엔드 ItineraryGenerateRequest */
export interface ItineraryGenerateRequest {
  mode: 'AUTO' | 'MANUAL';
  destination: string;
  themes: string[];
  categories: string[];
  pace: string;
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
