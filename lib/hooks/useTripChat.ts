'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  TripChatError, answerTripChat, archiveTripChat, cancelTripChatEdit, confirmTripChat, editTripChat,
  fetchCurrentTripChat, startTripChat,
} from '@/lib/data/tripChatService';
import { initialTripChatState, tripChatReducer, type OutgoingAnswer } from '@/lib/tripChat/reducer';
import { NEW_TRIP_SENTENCE_KEY } from '@/lib/constants/newTrip';
import type { TripChat, TripChatAnswerKind, TripChatSlot } from '@/lib/types/tripChat';

/** 랜딩 문장으로 대화를 만드는 중 새로고침해도 같은 대화·같은 첫 답으로 이어지게 요청 id를 남긴다. */
const START_KEY = 'shg.tripChat.start';
const PENDING_POLL_MS = 1500;
// 서버는 30초가 지난 처리 중 표시를 무시한다. 그보다 길게 불러야 화면이 대기 상태에 갇히지 않는다.
const PENDING_POLL_LIMIT = 25;
/** 백엔드 TripChatAnswerRequest.text 상한. 랜딩 입력창에는 길이 제한이 없다. */
const MAX_ANSWER_LENGTH = 700;

const BUTTON_LABEL: Record<Exclude<TripChatAnswerKind, 'text'>, string> = {
  unknown: '아직 모르겠어요',
  none: '정해둔 건 없어요',
};

function newId(): string {
  return crypto.randomUUID();
}

function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function startRequestFor(sentence: string | null): string {
  try {
    const saved = JSON.parse(readSession(START_KEY) ?? 'null') as { requestId: string; sentence: string | null } | null;
    if (saved && sentence && saved.sentence === sentence) return saved.requestId;
    const requestId = newId();
    sessionStorage.setItem(START_KEY, JSON.stringify({ requestId, sentence }));
    return requestId;
  } catch {
    return newId();
  }
}

function clearStart() {
  try {
    sessionStorage.removeItem(START_KEY);
    sessionStorage.removeItem(NEW_TRIP_SENTENCE_KEY);
  } catch { /* 저장소가 막혀 있으면 남길 것도 없다 */ }
}

export function useTripChat() {
  const [state, dispatch] = useReducer(tripChatReducer, initialTripChatState);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const started = useRef(false);
  const [resumed, setResumed] = useState(false);

  const refresh = useCallback(async (): Promise<TripChat | null> => {
    const chat = await fetchCurrentTripChat().catch(() => null);
    if (chat) dispatch({ type: 'refreshed', chat });
    return chat;
  }, []);

  const deliver = useCallback(async (chat: TripChat, answer: OutgoingAnswer) => {
    dispatch({ type: 'send', answer });
    try {
      const next = await answerTripChat(chat.id, {
        questionId: answer.questionId, clientTurnId: answer.clientTurnId, kind: answer.kind, text: answer.text,
      });
      dispatch({ type: 'sent', chat: next });
      return true;
    } catch (e) {
      const err = e instanceof TripChatError ? e : new TripChatError('답변을 보내지 못했어요. 다시 보내주세요.', null, 0);
      if (err.stale) {
        const latest = await fetchCurrentTripChat().catch(() => undefined);
        if (latest === null || (latest && latest.id !== chat.id)) {
          dispatch({ type: 'gone' });
          return false;
        }
        dispatch({ type: 'sendFailed', message: err.message, chat: latest ?? null });
        return false;
      }
      dispatch({ type: 'sendFailed', message: err.message });
      return false;
    }
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      try {
        const sentence = readSession(NEW_TRIP_SENTENCE_KEY)?.trim().slice(0, MAX_ANSWER_LENGTH) || null;
        let chat = sentence ? null : await fetchCurrentTripChat();
        const requestId = startRequestFor(sentence);
        if (!chat) chat = await startTripChat(requestId);
        dispatch({ type: 'loaded', chat });
        setResumed(!sentence && chat.history.length > 0);
        if (sentence && chat.status === 'ASKING' && chat.question && chat.history.length === 0) {
          await deliver(chat, {
            questionId: chat.question.id, clientTurnId: `${requestId}:first`, kind: 'text',
            text: sentence, display: sentence,
          });
        } else {
          clearStart();
        }
      } catch (e) {
        dispatch({ type: 'loadFailed', message: e instanceof Error ? e.message : '대화를 불러오지 못했어요.' });
      }
    })();
  }, [deliver]);

  // 첫 답이 어느 경로로든 반영되면 랜딩 문장은 끝났다. 남기면 다음 "새 여행"이 같은 문장을 다시 보낸다.
  const answeredCount = state.chat?.history.length ?? 0;
  useEffect(() => {
    if (answeredCount > 0) clearStart();
  }, [answeredCount]);

  // 다른 탭에서 보낸 답이나 새로고침 전에 보낸 답을 정리하는 중이면 끝날 때까지 다시 불러온다.
  const serverPending = state.chat?.pending ?? null;
  useEffect(() => {
    if (!serverPending || state.sending) return;
    let count = 0;
    const timer = setInterval(async () => {
      count += 1;
      const chat = await refresh();
      if ((chat && !chat.pending) || count >= PENDING_POLL_LIMIT) clearInterval(timer);
    }, PENDING_POLL_MS);
    return () => clearInterval(timer);
  }, [serverPending, state.sending, refresh]);

  const send = useCallback(async (questionId: string, kind: TripChatAnswerKind, text: string | null) => {
    const s = stateRef.current;
    if (!s.chat || s.sending || s.busy) return false;
    const retry = s.failed && s.failed.questionId === questionId && s.failed.kind === kind && s.failed.text === text;
    const display = kind === 'text' ? (text ?? '') : BUTTON_LABEL[kind];
    return deliver(s.chat, {
      questionId, kind, text, display, clientTurnId: retry && s.failed ? s.failed.clientTurnId : newId(),
    });
  }, [deliver]);

  const mutate = useCallback(async (run: (chat: TripChat) => Promise<TripChat>) => {
    const s = stateRef.current;
    if (!s.chat || s.busy || s.sending) return null;
    dispatch({ type: 'busy' });
    try {
      const chat = await run(s.chat);
      dispatch({ type: 'done', chat });
      return chat;
    } catch (e) {
      const err = e instanceof TripChatError ? e : new TripChatError('잠시 후 다시 시도해주세요.', null, 0);
      if (!err.stale) {
        dispatch({ type: 'busyFailed', message: err.message });
        return null;
      }
      const latest = await fetchCurrentTripChat().catch(() => undefined);
      if (latest === null || (latest && latest.id !== s.chat.id)) {
        dispatch({ type: 'gone' });
        return null;
      }
      dispatch({ type: 'busyFailed', message: err.message, chat: latest ?? null });
      return latest?.status === 'CONFIRMED' && latest.jobId ? latest : null;
    }
  }, []);

  const goBack = useCallback(() => mutate((chat) => {
    if (chat.back === 'CANCEL') return cancelTripChatEdit(chat.id, chat.version);
    return editTripChat(chat.id, chat.version, chat.back as TripChatSlot);
  }), [mutate]);

  const edit = useCallback((slot: TripChatSlot) => mutate((chat) => editTripChat(chat.id, chat.version, slot)), [mutate]);

  const restart = useCallback(async () => {
    const chat = await mutate(async () => {
      await archiveTripChat();
      clearStart();
      return startTripChat(newId());
    });
    if (chat) setResumed(false);
    return chat;
  }, [mutate]);

  const confirm = useCallback(() => mutate((chat) => confirmTripChat(chat.id, chat.version)), [mutate]);

  return { state, resumed, send, goBack, edit, restart, confirm };
}
