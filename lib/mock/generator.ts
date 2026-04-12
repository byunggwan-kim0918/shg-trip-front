/**
 * 사용자 위자드 입력 기반으로 동적 mock 일정을 생성하는 유틸리티.
 * 나중에 실제 API 연동 시 이 파일은 삭제하면 됨.
 */
import type {
  Itinerary, DayPlan, ItineraryStep, Transit, Alternative,
  Place, Category, TransportType, WizardData,
} from '@/lib/types/itinerary';
import { mockPlaces } from './places';

// ── helpers ──

let _seq = 0;
const uid = (prefix: string) => `${prefix}-${Date.now()}-${++_seq}`;

const pick = <T>(arr: T[], n: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
};

const TRANSPORT_TYPES: TransportType[] = ['walk', 'bus', 'subway', 'taxi'];
const randomTransport = (): TransportType =>
  TRANSPORT_TYPES[Math.floor(Math.random() * TRANSPORT_TYPES.length)];

const randomDuration = () => Math.floor(Math.random() * 20) + 5; // 5~25분

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ── 카테고리 매핑 ──

const CATEGORY_MAP: Record<string, Category[]> = {
  healing: ['cafe', 'spa', 'nature'],
  activity: ['experience', 'theme_park'],
  food: ['restaurant', 'market'],
  culture: ['attraction', 'museum'],
  shopping: ['shopping'],
  nature: ['nature', 'attraction'],
  adventure: ['experience', 'nature'],
  romance: ['cafe', 'restaurant', 'attraction'],
  family: ['theme_park', 'experience', 'attraction'],
  budget: ['market', 'attraction', 'nature'],
  luxury: ['shopping', 'restaurant', 'spa'],
  photo: ['attraction', 'cafe', 'nature'],
};


// ── 장소 필터링 ──

function getRelevantPlaces(data: WizardData): Place[] {
  // 테마 → 카테고리 확장
  const themeCats = new Set<Category>();
  for (const theme of data.themes) {
    for (const cat of (CATEGORY_MAP[theme] ?? [])) themeCats.add(cat);
  }
  // 사용자가 직접 선택한 카테고리도 추가
  for (const cat of data.categories) themeCats.add(cat as Category);

  const filtered = mockPlaces.filter((p) => themeCats.has(p.category));
  // 필터 결과가 너무 적으면 전체에서 보충
  return filtered.length >= 5 ? filtered : mockPlaces;
}

function buildAlternatives(mainPlace: Place, pool: Place[], count: number): Alternative[] {
  const others = pool.filter((p) => p.id !== mainPlace.id && p.category === mainPlace.category);
  const fallback = pool.filter((p) => p.id !== mainPlace.id);
  const candidates = others.length >= count ? others : fallback;
  return pick(candidates, count).map((p) => ({
    id: uid('alt'),
    place: p,
    description: p.description,
    rating: p.rating,
  }));
}

// ── 하루 일정 생성 ──

function buildDayPlan(
  dayNum: number,
  dateStr: string,
  pool: Place[],
  stepsPerDay: number,
  usedIds: Set<string>,
): DayPlan {
  // 아직 안 쓴 장소 우선, 부족하면 재사용
  const available = pool.filter((p) => !usedIds.has(p.id));
  const dayPlaces = available.length >= stepsPerDay
    ? pick(available, stepsPerDay)
    : [...pick(available, available.length), ...pick(pool, stepsPerDay - available.length)];

  dayPlaces.forEach((p) => usedIds.add(p.id));

  let currentTime = '09:00';
  const steps: ItineraryStep[] = dayPlaces.map((place, idx) => {
    const startTime = currentTime;
    const duration = 60 + Math.floor(Math.random() * 60); // 60~120분
    const endTime = addMinutes(startTime, duration);
    currentTime = addMinutes(endTime, randomDuration()); // 이동 시간 추가

    return {
      id: uid('step'),
      placeId: place.id,
      place,
      startTime,
      endTime,
      description: place.description,
      alternatives: buildAlternatives(place, pool, 3),
    };
  });

  const transits: Transit[] = steps.slice(0, -1).map((step, idx) => ({
    from: step.id,
    to: steps[idx + 1].id,
    type: randomTransport(),
    duration: randomDuration(),
  }));

  return { day: dayNum, date: dateStr, steps, transits };
}

// ── 메인 생성 함수 ──

export function generateMockItinerary(data: WizardData): Itinerary {
  const start = data.startDate ?? new Date().toISOString().slice(0, 10);
  const end = data.endDate ?? addDays(start, 2);
  const totalDays = Math.max(
    1,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1,
  );

  const pool = data.mode === 'manual' && data.selectedPlaces.length > 0
    ? data.selectedPlaces
    : getRelevantPlaces(data);

  const stepsPerDay = Math.min(Math.max(3, Math.ceil(pool.length / totalDays)), 5);
  const usedIds = new Set<string>();

  const days: DayPlan[] = Array.from({ length: totalDays }, (_, i) =>
    buildDayPlan(i + 1, addDays(start, i), pool, stepsPerDay, usedIds),
  );

  return {
    id: uid('itin'),
    destination: data.destination || '서울',
    startDate: start,
    endDate: end,
    totalBudget: data.budget ?? 300000,
    days,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    mode: data.mode,
  };
}
