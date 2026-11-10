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
  /** 생성 시 해소하지 못한 품질 문제(숙소 미배정·식사 누락 등). 과거 데이터엔 없다. */
  qualityNotices?: string[];
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
  tags: string[];
}

export interface DayGroup {
  dayNumber: number;
  steps: ItineraryStep[];
}

/**
 * 구조 일정을 먼저 저장(notes=null)하고 story가 한 트랜잭션으로 모든 스텝의 notes를 채운다.
 * 그래서 하나라도 채워졌으면 story는 끝난 것이다. 대안으로 바꾼 스텝은 notes가 없어도 영영 채워지지 않는다.
 */
export function hasPendingStory(itin: Itinerary): boolean {
  if (itin.status !== 'DRAFT' || itin.steps.length === 0) return false;
  return itin.steps.every((s) => !s.notes || s.notes.trim().length === 0);
}

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
