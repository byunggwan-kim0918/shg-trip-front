/** 백엔드 TransportationMode 값. DRIVE는 차로 국내 도시를 옮기는 구간이다. */
export type TransportType = 'WALK' | 'CAR' | 'BUS' | 'TRAIN' | 'SUBWAY' | 'TAXI' | 'BIKE' | 'FLIGHT' | 'DRIVE';

/** 백엔드 Itinerary status enum 값 */
export type ItineraryStatus = 'DRAFT' | 'FINALIZED' | 'ARCHIVED';

/** 백엔드 QualityStatus. NEEDS_ADJUSTMENT는 핵심 품질 기준에 못 미쳐 편집이 필요한 일정이고 생성 횟수를 쓰지 않았다. */
export type QualityStatus = 'OK' | 'NEEDS_ADJUSTMENT';

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
  /** 위키미디어 공용 사진의 저작자·라이선스·원본 파일 페이지. TourAPI 사진과 과거 응답엔 없다. */
  imageCredit?: string | null;
  imageLicense?: string | null;
  imageSourceUrl?: string | null;
  /** 해외 장소의 한국어 이름. 국내 장소와 과거 응답엔 없다. 화면 표시는 lib/utils/placeName을 거친다. */
  nameKo?: string | null;
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
  /** coverImage의 출처. 의미는 Place.imageCredit 등과 같다. */
  coverImageCredit?: string | null;
  coverImageLicense?: string | null;
  coverImageSourceUrl?: string | null;
  tags: string[];
  status: ItineraryStatus;
  /** 백엔드 배포 전 응답엔 없다. 없으면 OK로 본다. */
  qualityStatus?: QualityStatus;
  /** 해소하지 못한 품질 문제 안내("N일차 본문. 할 일."). 편집하면 서버가 지금 일정 기준으로 다시 만든다. */
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
  qualityStatus?: QualityStatus;
  createdAt: string;
  coverImage: string | null;
  coverImageCredit?: string | null;
  coverImageLicense?: string | null;
  coverImageSourceUrl?: string | null;
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
