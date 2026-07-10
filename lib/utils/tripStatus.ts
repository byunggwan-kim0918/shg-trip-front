/**
 * 여행 상태/기간 유틸.
 *
 * 백엔드 status(DRAFT/FINALIZED/ARCHIVED) + 날짜로 리디자인의 4가지 표시 상태
 * (여행 중 / 초안 / 완료 / 예정)를 계산한다. 백엔드에 상태 필터 파라미터가 없어
 * 필터 탭은 프론트에서 이 유틸로 처리한다.
 */

export type TripDisplayStatus = 'ongoing' | 'draft' | 'done' | 'upcoming';

/** 필터 탭 키 */
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

/** D-Day 라벨. "D-3" | "D-Day" | "D+2" */
export function ddayLabel(startDate: string, now: Date = new Date()): string {
  const diff = daysUntil(startDate, now);
  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return 'D-Day';
  return `D+${Math.abs(diff)}`;
}

/** N박 M일 계산. */
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

/** "M.D – M.D" 날짜 범위. */
export function dateRange(startDate: string, endDate: string): string {
  return `${shortDate(startDate)} – ${shortDate(endDate)}`;
}

/** 표시 상태 판정: DRAFT면 초안, 아니면 날짜로 예정/여행중/완료. */
export function displayStatus(trip: DatedTrip, now: Date = new Date()): TripDisplayStatus {
  if (trip.status === 'DRAFT') return 'draft';
  const today = midnight(now).getTime();
  const start = midnight(new Date(trip.startDate)).getTime();
  const end = midnight(new Date(trip.endDate)).getTime();
  if (today < start) return 'upcoming';
  if (today > end) return 'done';
  return 'ongoing';
}

/** 필터 탭 매칭. 'all'은 항상 true. draft는 예정/여행중/완료 어디에도 안 잡히므로 'all'에서만 노출. */
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

/** 필터 탭 정의(대시보드 상단). */
export const FILTER_TABS: Array<{ key: TripFilter; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'upcoming', label: '예정' },
  { key: 'ongoing', label: '여행 중' },
  { key: 'done', label: '완료' },
];
