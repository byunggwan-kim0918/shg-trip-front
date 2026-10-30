/**
 * 품질 알림(qualityNotices) 파싱.
 *
 * 백엔드가 주는 건 완성된 문장 배열이고, 화면은 그걸 그대로 <li>로 쏟아내고 있었다:
 *
 *   2일차 일정이 22:03까지 이어집니다.
 *   4일차에 저녁 식사를 넣지 못했어요. 주변 식당 데이터가 부족합니다.
 *   5일차에 점심 식사를 넣지 못했어요. 주변 식당 데이터가 부족합니다.
 *   5일차 일정이 11:11에 일찍 끝납니다.
 *
 * 문제 셋:
 *  1) 모든 줄이 같은 굵기·크기라 훑을 수가 없다. 정작 핵심 키(몇 일차인지)가 문장 속에 묻힌다
 *  2) 원인 문장("주변 식당 데이터가 부족합니다")이 항목마다 반복된다
 *  3) 다섯 줄짜리 앰버 덩어리가 Day 탭 위에 앉아 정작 일정보다 먼저 읽힌다
 *
 * 그래서 "N일차"를 칩으로 빼고, 반복되는 원인 문장은 한 번만 각주로 모은다.
 * 형식이 바뀌어 파싱이 안 되면 원문을 그대로 통과시킨다(화면이 비지 않게).
 */

export interface ParsedNotice {
  /** 몇 일차인지. 문장에서 못 읽으면 null(원문 그대로 표시). */
  day: number | null;
  /** 일차를 뗀 본문. 끝의 마침표는 제거한다. */
  text: string;
  /** 본문 뒤에 붙은 원인 문장. 여러 항목이 공유하므로 화면에서 한 번만 모아 보인다. */
  cause: string | null;
}

export interface QualityNoticeSummary {
  items: ParsedNotice[];
  /** 영향받은 일차(오름차순, 중복 제거). */
  days: number[];
}

/** 끝의 마침표만 떼어낸다. 물음표·느낌표는 의미가 있으므로 남긴다. */
function trimPeriod(s: string): string {
  return s.replace(/\.\s*$/, '').trim();
}

export function parseQualityNotices(notices: string[]): QualityNoticeSummary {
  const items: ParsedNotice[] = [];

  for (const raw of notices) {
    const source = raw.trim();
    if (!source) continue;

    const m = source.match(/^(\d+)일차(?:에)?\s*(.+)$/);
    if (!m) {
      items.push({ day: null, text: trimPeriod(source), cause: null });
      continue;
    }

    const day = Number(m[1]);
    // "본문. 원인." 형태면 뒤 문장은 원인으로 따로 둔다.
    const sentences = m[2].split(/(?<=\.)\s+/).map((x) => x.trim()).filter(Boolean);
    const cause = trimPeriod(sentences.slice(1).join(' '));
    items.push({ day, text: trimPeriod(sentences[0] ?? m[2]), cause: cause || null });
  }

  const days = [...new Set(items.map((i) => i.day).filter((d): d is number => d != null))]
    .sort((a, b) => a - b);

  return { items, days };
}
