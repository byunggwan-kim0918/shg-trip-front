/**
 * LLM 텍스트에는 em-dash·en-dash가 섞여 오고 DB를 고쳐도 다음 생성분에 다시 들어오므로
 * 표시 시점에 하이픈으로 통일한다(ai-tells §9.G).
 */
export function normalizeText(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/\s*—\s*/g, ' - ')  // em-dash
    .replace(/\s*–\s*/g, ' - ')  // en-dash
    .replace(/\s{2,}/g, ' ')
    .trim();
}
