/** 백엔드 TripChatResponse. 화면 문구는 모두 서버가 만든다. */

export type TripChatSlot = 'CITY' | 'DATES' | 'COMPANY' | 'MOOD' | 'TRANSPORT' | 'ANCHORS' | 'EXTRAS';
export type TripChatStatus = 'ASKING' | 'REVIEW' | 'CONFIRMED';
export type TripChatAnswerKind = 'text' | 'unknown' | 'none';

export interface TripChatQuestion {
  id: string;
  slot: TripChatSlot;
  kind: 'BASE' | 'FOLLOW_UP' | 'EDIT' | 'FIX' | 'EXTRA';
  lead: string | null;
  title: string;
  description: string | null;
  placeholder: string | null;
  examples: string[];
  examplesOpen: boolean;
  /** UNKNOWN = "아직 모르겠어요", NONE = "정해둔 건 없어요" */
  tool: 'UNKNOWN' | 'NONE' | null;
  prefill: string | null;
}

export interface TripChatExchange {
  question: string;
  answer: string;
}

export interface TripChatRow {
  slot: TripChatSlot;
  label: string;
  value: string;
  notes: string[];
  /** 값이 있으면 true. false면 value는 "아직 미정" 같은 안내 문구다. */
  filled: boolean;
}

export interface TripChatFix {
  questionId: string;
  slot: TripChatSlot;
  title: string;
  description: string;
  placeholder: string | null;
  examples: string[];
}

export interface TripChat {
  id: string;
  version: number;
  status: TripChatStatus;
  question: TripChatQuestion | null;
  lastExchange: TripChatExchange | null;
  history: TripChatExchange[];
  summary: { rows: TripChatRow[]; fixes: TripChatFix[]; ready: boolean };
  /** "이전 답변"이 열 항목. CANCEL이면 수정 취소, null이면 버튼 없음 */
  back: TripChatSlot | 'CANCEL' | null;
  /** 답을 정리하는 중이면 그 답 */
  pending: string | null;
  jobId: string | null;
  days: number | null;
}
