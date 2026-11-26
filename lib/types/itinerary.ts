/** 백엔드 TransportationMode 값. DRIVE는 차로 국내 도시를 옮기는 구간이다. */
export type TransportType = 'WALK' | 'CAR' | 'BUS' | 'TRAIN' | 'SUBWAY' | 'TAXI' | 'BIKE' | 'FLIGHT' | 'DRIVE';

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
  /** 보강 배치가 만든 짧은 소개. 화면 표시는 lib/utils/placeDescription을 거친다. */
  description?: string | null;
  /** 위키미디어 공용 사진의 저작자·라이선스·원본 파일 페이지. TourAPI 사진과 과거 응답엔 없다. */
  imageCredit?: string | null;
  imageLicense?: string | null;
  imageSourceUrl?: string | null;
  /** 해외 장소의 한국어 이름. 국내 장소와 과거 응답엔 없다. 화면 표시는 lib/utils/placeName을 거친다. */
  nameKo?: string | null;
  /** 영업시간이 공식 출처에서 왔는지. 아니면 화면에 미확인으로 보인다. */
  hoursConfirmed?: boolean;
}

/** 백엔드 AlternativeOptionResponse */
export interface AlternativeOption {
  id: number;
  optionOrder: number;
  place: Place;
  /** 지금 스텝 장소와 견준 한 줄 설명("해산물 · 지금 장소에서 600m"). 서버가 응답할 때 만들고, 설명할 것이 없으면 null이다. */
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
  /** 장소의 한 줄 설명(종류·알려진 정도). 숙소·교통 거점은 null이다. */
  placeNote?: string | null;
  userNotes: string | null;
  estimatedCost: number | null;
  alternatives: AlternativeOption[];
  /** 이동 시간이 노선·시간표가 아닌 거리로 추정한 값인지. */
  travelEstimated?: boolean;
}

/** 백엔드 AlternativePreviewResponse.Leg. 다시 잰 구간은 직선거리 기준 추정이다. */
export interface PreviewLeg {
  mode: TransportType | null;
  durationMin: number | null;
  distanceKm: number | null;
  cost: number | null;
}

/** 백엔드 AlternativePreviewResponse. 대안으로 바꾸기 전에 보여 줄 변화이고 일정은 바뀌지 않는다. */
export interface AlternativePreview {
  /** 같은 날 앞 스텝에서 오는 구간. 앞 스텝이 없으면 null. */
  incoming: { before: PreviewLeg; after: PreviewLeg } | null;
  /** 같은 날 다음 스텝으로 가는 구간. 다음 스텝이 없으면 null. */
  outgoing: { before: PreviewLeg; after: PreviewLeg } | null;
  costBefore: number | null;
  costAfter: number | null;
  /** 이 스텝 시각에 영업하는지. 영업시간이나 날짜를 모르면 null. */
  openAtTime: boolean | null;
  closedThatDay: boolean;
  /** 대안 장소가 이미 다른 스텝으로 들어 있는 날. 없으면 null. */
  alreadyOnDay: number | null;
  resolvedNotices: string[];
  newNotices: string[];
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
  /** 해소하지 못한 품질 문제 안내("N일차 본문. 할 일."). 편집하면 서버가 지금 일정 기준으로 다시 만든다. */
  qualityNotices?: string[];
  steps: ItineraryStep[];
  /** 곧 한국어 이름·소개가 채워질 스텝 장소 id. 공유 응답과 과거 응답엔 없다. */
  enrichingPlaceIds?: number[];
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

/** 보강을 기다리는 장소가 있으면 결과 화면이 다시 조회해 그 장소의 이름·소개를 채운다. */
export function hasEnrichingPlaces(itin: Itinerary): boolean {
  return (itin.enrichingPlaceIds?.length ?? 0) > 0;
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
