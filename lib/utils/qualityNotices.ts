/**
 * 백엔드는 완성된 문장 배열을 준다. "N일차"를 떼고 마지막 문장(할 일)은 따로 두며,
 * 파싱이 안 되면 화면이 비지 않게 원문을 그대로 통과시킨다.
 */

export interface ParsedNotice {
  /** 몇 일차인지. 문장에서 못 읽으면 null(원문 그대로 표시). */
  day: number | null;
  /** 일차를 뗀 본문. 끝의 마침표는 제거한다. */
  text: string;
  /** 본문 뒤에 붙은 마지막 문장(원인이나 할 일). 한 문장짜리 안내면 null. */
  followUp: string | null;
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
      items.push({ day: null, text: trimPeriod(source), followUp: null });
      continue;
    }

    const day = Number(m[1]);
    // 따옴표 안 장소 이름의 마침표("St. Mary")는 문장 경계로 보지 않는다.
    const sentences = m[2].split(/(?<=\.)\s+(?=(?:[^']*'[^']*')*[^']*$)/).map((x) => x.trim()).filter(Boolean);
    const followUp = sentences.length > 1 ? trimPeriod(sentences[sentences.length - 1]) : '';
    const text = sentences.length > 1 ? sentences.slice(0, -1).join(' ') : (sentences[0] ?? m[2]);
    items.push({ day, text: trimPeriod(text), followUp: followUp || null });
  }

  const days = [...new Set(items.map((i) => i.day).filter((d): d is number => d != null))]
    .sort((a, b) => a - b);

  return { items, days };
}
