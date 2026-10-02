/**
 * LLM이 생성한 텍스트를 화면 표기 규칙에 맞게 정규화한다.
 *
 * 제목·설명은 AI가 만들기 때문에 em-dash(—)·en-dash(–)가 섞여 들어온다.
 * 이 프로젝트의 타이포 규칙(ai-tells §9.G)은 대시를 일반 하이픈으로 통일한다.
 * DB를 일괄 수정해도 다음 생성분에 다시 들어오므로 표시 시점에 정규화한다.
 */
export function normalizeText(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/\s*—\s*/g, ' - ')  // em-dash
    .replace(/\s*–\s*/g, ' - ')  // en-dash
    .replace(/\s{2,}/g, ' ')
    .trim();
}
