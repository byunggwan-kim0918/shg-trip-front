import type { TripChat, TripChatAnswerKind } from '@/lib/types/tripChat';

export interface OutgoingAnswer {
  questionId: string;
  clientTurnId: string;
  kind: TripChatAnswerKind;
  text: string | null;
  /** 말풍선에 보일 문구 */
  display: string;
}

export interface FailedAnswer extends OutgoingAnswer {
  message: string;
}

export interface TripChatState {
  phase: 'loading' | 'ready' | 'error';
  chat: TripChat | null;
  /** 해석을 기다리는 답 */
  sending: OutgoingAnswer | null;
  /** 실패한 답. 입력창에 그대로 남겨 같은 clientTurnId로 다시 보낸다. */
  failed: FailedAnswer | null;
  /** 수정·취소·확인·새로 시작 중 */
  busy: boolean;
  notice: string | null;
  loadError: string | null;
}

export type TripChatAction =
  | { type: 'loaded'; chat: TripChat }
  | { type: 'loadFailed'; message: string }
  /** 서버에서 이 대화가 끝났다(보관·만료). 다시 불러오면 새 대화로 시작한다. */
  | { type: 'gone' }
  | { type: 'send'; answer: OutgoingAnswer }
  | { type: 'sent'; chat: TripChat }
  | { type: 'sendFailed'; message: string; chat?: TripChat | null }
  | { type: 'busy' }
  | { type: 'done'; chat: TripChat }
  | { type: 'busyFailed'; message: string; chat?: TripChat | null }
  | { type: 'refreshed'; chat: TripChat };

export const initialTripChatState: TripChatState = {
  phase: 'loading',
  chat: null,
  sending: null,
  failed: null,
  busy: false,
  notice: null,
  loadError: null,
};

export function tripChatReducer(state: TripChatState, action: TripChatAction): TripChatState {
  switch (action.type) {
    case 'loaded':
      return { ...initialTripChatState, phase: 'ready', chat: action.chat };
    case 'loadFailed':
      return { ...state, phase: 'error', loadError: action.message };
    case 'gone':
      return { ...initialTripChatState, phase: 'error', loadError: '이 대화는 이미 마무리됐어요. 다시 불러오면 새 대화로 시작해요.' };
    case 'send':
      return { ...state, sending: action.answer, failed: null, notice: null };
    case 'sent':
      return { ...state, chat: action.chat, sending: null, failed: null };
    case 'sendFailed':
      return state.sending
        ? { ...state, chat: action.chat ?? state.chat, sending: null, failed: { ...state.sending, message: action.message } }
        : state;
    case 'busy':
      return { ...state, busy: true, notice: null };
    case 'done':
      return { ...state, chat: action.chat, busy: false, failed: null };
    case 'busyFailed':
      return { ...state, chat: action.chat ?? state.chat, busy: false, notice: action.message };
    case 'refreshed':
      return { ...state, chat: action.chat };
    default:
      return state;
  }
}
