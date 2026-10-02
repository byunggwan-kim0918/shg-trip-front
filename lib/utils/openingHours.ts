/**
 * 영업시간 문자열 압축.
 *
 * Google Places가 주는 원문은 7요일을 전부 나열한다:
 *   "월요일: 오전 11:00 ~ 오후 9:00, 화요일: 오전 11:00 ~ 오후 9:00, ... 일요일: ..."
 * 대부분 7일이 전부 같은 값이라 같은 문장이 7번 반복되고, 카드 폭을 넘겨 마지막 요일이
 * 잘린 채 끝난다 — 한 줄을 다 쓰면서 정보는 0인 시각적 소음이었다.
 *
 * 같은 시간대의 "연속된" 요일을 묶고 24시간제로 줄인다.
 *   7일 동일        → "매일 11:00 - 21:00"
 *   금·토만 다름    → "월-목 11:30 - 01:00 · 금·토 11:30 - 02:00 · 일 11:30 - 01:00"
 *
 * 파싱에 실패하면 원문을 그대로 돌려준다(형식이 바뀌어도 화면이 비지 않게).
 */

const DAYS = ['월', '화', '수', '목', '금', '토', '일'] as const;

/** "오전 11:00" → "11:00", "오후 9:00" → "21:00". 시각이 아니면 null. */
function to24h(token: string): string | null {
  const m = token.trim().match(/^(오전|오후)\s*(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const [, meridiem, hh, mm] = m;
  let h = Number(hh);
  if (meridiem === '오전') {
    if (h === 12) h = 0; // 오전 12시 = 자정
  } else if (h !== 12) {
    h += 12;
  }
  return `${String(h).padStart(2, '0')}:${mm}`;
}

/** "오전 11:00 ~ 오후 9:00" → "11:00 - 21:00". 시각 쌍이 아니면 원문 유지("24시간 영업" 등). */
function compactRange(value: string): string {
  const parts = value.split('~');
  if (parts.length !== 2) return value.trim();
  const from = to24h(parts[0]);
  const to = to24h(parts[1]);
  if (!from || !to) return value.trim();
  return `${from} - ${to}`;
}

/** 연속 요일 묶음 라벨. 1일="월", 2일="월·화", 3일 이상="월-수". */
function rangeLabel(startIdx: number, endIdx: number): string {
  const span = endIdx - startIdx + 1;
  if (span === 1) return DAYS[startIdx];
  if (span === 2) return `${DAYS[startIdx]}·${DAYS[endIdx]}`;
  return `${DAYS[startIdx]}-${DAYS[endIdx]}`;
}

export function formatOpeningHours(raw: string | null | undefined): string {
  if (!raw) return '';

  // "월요일: ..." 항목으로 쪼갠다. 시간 값 안에도 쉼표가 없다는 전제(Google 형식).
  const byDay = new Map<string, string>();
  for (const chunk of raw.split(',')) {
    const m = chunk.trim().match(/^([월화수목금토일])요일:\s*(.+)$/);
    if (!m) return raw; // 형식이 다르면 손대지 않는다
    byDay.set(m[1], m[2].trim());
  }
  if (byDay.size !== DAYS.length) return raw;

  const values = DAYS.map((d) => compactRange(byDay.get(d)!));

  // 연속 구간으로 묶기
  const groups: string[] = [];
  let start = 0;
  for (let i = 1; i <= values.length; i++) {
    if (i === values.length || values[i] !== values[start]) {
      groups.push(`${rangeLabel(start, i - 1)} ${values[start]}`);
      start = i;
    }
  }

  if (groups.length === 1) return `매일 ${values[0]}`;
  return groups.join(' · ');
}
