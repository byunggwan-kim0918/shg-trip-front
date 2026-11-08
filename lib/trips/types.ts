/** 검수를 거쳐 공개하는 샘플 일정. content/trips/{region}/{slug}.json */
export interface CuratedTrip {
  region: string;
  slug: string;
  title: string;
  nights: number;
  theme: string;
  themeLabel: string;
  transport: 'car' | 'transit' | 'walk';
  /** 비용 추정 기준 인원 */
  partySize: number;
  summary: string;
  recommendedFor: string[];
  lodgingArea: string | null;
  days: CuratedDay[];
  tips: string[];
  faq: FaqItem[];
  /** "2026-11-08". 화면의 검수일과 구조화 데이터 dateModified에 쓴다. */
  reviewedAt: string;
}

export interface CuratedDay {
  day: number;
  title: string;
  stops: CuratedStop[];
}

export interface CuratedStop {
  start: string;
  end: string;
  name: string;
  /** 화면용 짧은 분류(식당·카페·해변 등) */
  kind: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  imageUrl: string | null;
  note: string;
  /** 원. partySize명 일행 전체 기준 추정치 */
  cost: number | null;
  /** 직전 장소에서 오는 이동. 그날 첫 장소는 null */
  move: { mode: 'CAR' | 'WALK' | 'BUS' | 'SUBWAY' | 'TRAIN' | 'TAXI'; minutes: number; km: number } | null;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface RegionInfo {
  slug: string;
  name: string;
  country: 'KR' | 'JP';
  intro: string;
  areas: { name: string; desc: string }[];
  transportNote: string;
  seasonNote: string;
  faq: FaqItem[];
  neighbors: string[];
}
