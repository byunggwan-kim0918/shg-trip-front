/** 백엔드에 상태 필터 파라미터가 없어 표시 상태(여행 중/초안/완료/예정)와 필터 탭을 프론트에서 계산한다. */

export type TripDisplayStatus = 'ongoing' | 'draft' | 'done' | 'upcoming';

export type TripFilter = 'all' | 'upcoming' | 'ongoing' | 'done';

interface DatedTrip {
  status: string; // ItineraryStatus: DRAFT | FINALIZED | ARCHIVED
  startDate: string;
  endDate: string;
}

const DAY_MS = 1000 * 60 * 60 * 24;

function midnight(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 오늘 자정 기준 startDate까지 남은 일수 (음수면 지남). */
export function daysUntil(startDate: string, now: Date = new Date()): number {
  const start = midnight(new Date(startDate));
  return Math.ceil((start.getTime() - midnight(now).getTime()) / DAY_MS);
}

/** 이보다 멀면 D-숫자가 읽히지 않아 날짜로 보여 준다. */
const DDAY_MAX_DAYS = 365;

/** D-Day 라벨. "D-3" | "D-Day" | "D+2" | 1년 넘게 떨어지면 "2027. 3. 1." */
export function ddayLabel(startDate: string, now: Date = new Date()): string {
  const diff = daysUntil(startDate, now);
  if (Math.abs(diff) > DDAY_MAX_DAYS) {
    const d = new Date(startDate);
    return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
  }
  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return 'D-Day';
  return `D+${Math.abs(diff)}`;
}

/** 당일 포함 일수(N박 M일의 M). */
export function tripDays(startDate: string, endDate: string): number {
  const s = midnight(new Date(startDate));
  const e = midnight(new Date(endDate));
  return Math.round((e.getTime() - s.getTime()) / DAY_MS) + 1;
}

/** "N박 M일" 라벨. 당일치기는 "당일". */
export function nightsLabel(startDate: string, endDate: string): string {
  const days = tripDays(startDate, endDate);
  if (days <= 1) return '당일';
  return `${days - 1}박 ${days}일`;
}

/** "M.D" 짧은 날짜. */
export function shortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

/** "M.D - M.D". en-dash는 ai-tells §9.G에서 구분자로 쓰지 않는다. */
export function dateRange(startDate: string, endDate: string): string {
  return `${shortDate(startDate)} - ${shortDate(endDate)}`;
}

export function displayStatus(trip: DatedTrip, now: Date = new Date()): TripDisplayStatus {
  if (trip.status === 'DRAFT') return 'draft';
  const today = midnight(now).getTime();
  const start = midnight(new Date(trip.startDate)).getTime();
  const end = midnight(new Date(trip.endDate)).getTime();
  if (today < start) return 'upcoming';
  if (today > end) return 'done';
  return 'ongoing';
}

/** draft는 예정/여행중/완료 어디에도 안 잡혀 'all'에서만 보인다. */
export function matchesFilter(trip: DatedTrip, filter: TripFilter, now: Date = new Date()): boolean {
  if (filter === 'all') return true;
  return displayStatus(trip, now) === filter;
}

/** 상태별 라벨/색 토큰(CSS 변수명). 점·칩·텍스트에 공통 사용. */
export const STATUS_META: Record<
  TripDisplayStatus,
  { label: string; dotVar: string; bgVar: string; fgVar: string }
> = {
  ongoing: { label: '여행 중', dotVar: 'var(--status-ongoing)', bgVar: 'var(--status-ongoing-bg)', fgVar: 'var(--status-ongoing)' },
  draft: { label: '초안', dotVar: 'var(--status-draft)', bgVar: 'var(--status-draft-bg)', fgVar: 'var(--status-draft)' },
  done: { label: '완료', dotVar: 'var(--status-done)', bgVar: 'var(--status-done-bg)', fgVar: 'var(--status-done)' },
  upcoming: { label: '예정', dotVar: 'var(--status-upcoming)', bgVar: 'var(--status-upcoming-bg)', fgVar: 'var(--status-upcoming)' },
};

export const FILTER_TABS: Array<{ key: TripFilter; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'upcoming', label: '예정' },
  { key: 'ongoing', label: '여행 중' },
  { key: 'done', label: '완료' },
];
