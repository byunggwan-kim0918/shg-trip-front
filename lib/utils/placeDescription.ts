import { normalizeText } from './text';

interface DescribedPlace {
  name: string;
  country?: string | null;
  description?: string | null;
}

const FOREIGN_SCRIPT = '[\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}]';
const FOREIGN_SCRIPT_RUN = new RegExp(`${FOREIGN_SCRIPT}+`, 'gu');
const FOREIGN_SCRIPT_IN_WORD = new RegExp(`[가-힣]${FOREIGN_SCRIPT}|${FOREIGN_SCRIPT}[가-힣]`, 'u');

/**
 * 한글 낱말에 한자·가나가 섞인 국내 설명("适합니다")인지. 정본은 백엔드 BatchEnrichScheduler.mixesForeignScript이고,
 * 그 규칙이 생기기 전에 저장된 설명을 화면에서 거른다. 해외 장소는 현지어 이름에 조사가 붙어 판정하지 않는다.
 */
function mixesForeignScript(text: string, place: DescribedPlace): boolean {
  if (place.country && place.country !== 'KR') return false;
  // 이름에 든 한자("석불사 (石佛寺)")를 따라 쓴 정상 설명까지 숨기지 않게 이름 글자는 빼고 본다.
  const nameRuns = place.name.match(FOREIGN_SCRIPT_RUN) ?? [];
  const checked = nameRuns.reduce((s, run) => s.split(run).join(''), text);
  return FOREIGN_SCRIPT_IN_WORD.test(checked);
}

/** 화면에 보일 장소 설명. 없거나 글자가 깨진 설명이면 null이다. */
export function placeDescription(place: DescribedPlace | null | undefined): string | null {
  const text = normalizeText(place?.description);
  if (!place || !text || mixesForeignScript(text, place)) return null;
  return text;
}
