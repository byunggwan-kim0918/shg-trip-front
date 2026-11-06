/**
 * 백엔드는 완성된 문장 배열을 준다. "N일차"를 칩으로 빼고 반복되는 원인 문장은 한 번만 모으며,
 * 파싱이 안 되면 화면이 비지 않게 원문을 그대로 통과시킨다.
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
