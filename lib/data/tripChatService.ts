import { authFetch } from '@/lib/api/fetchClient';
import type { ApiResponse } from '@/lib/data/itineraryService';
import type { TripChat, TripChatAnswerKind, TripChatSlot } from '@/lib/types/tripChat';

/** 409는 다른 탭·늦은 응답으로 화면이 낡았다는 뜻이라 다시 불러오면 된다. 503은 같은 답으로 다시 보내면 된다. */
export class TripChatError extends Error {
  constructor(message: string, readonly code: string | null, readonly status: number) {
    super(message);
    this.name = 'TripChatError';
  }

  get stale() {
    return this.status === 409;
  }
}

const FALLBACK_MESSAGE = '잠시 후 다시 시도해주세요.';

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await authFetch(url, init);
  } catch {
    throw new TripChatError('연결이 불안정해요. 다시 보내주세요.', null, 0);
  }
  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!res.ok || !body?.success) {
    throw new TripChatError(body?.error?.message ?? FALLBACK_MESSAGE, body?.error?.code ?? null, res.status);
  }
  return body.data;
}

function post<T>(url: string, payload: unknown): Promise<T> {
  return call<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function fetchCurrentTripChat(): Promise<TripChat | null> {
  return call<TripChat | null>('/api/trip-chats/current');
}

export function startTripChat(clientRequestId: string): Promise<TripChat> {
  return post<TripChat>('/api/trip-chats', { clientRequestId });
}

/** id가 없으면 진행 중 대화를 보관한다. */
export function archiveTripChat(id?: string): Promise<null> {
  return call<null>(id ? `/api/trip-chats/${id}` : '/api/trip-chats/current', { method: 'DELETE' });
}

export function answerTripChat(
  id: string,
  answer: { questionId: string; clientTurnId: string; kind: TripChatAnswerKind; text: string | null },
): Promise<TripChat> {
  return post<TripChat>(`/api/trip-chats/${id}/answers`, answer);
}

export function editTripChat(id: string, expectedVersion: number, slot: TripChatSlot): Promise<TripChat> {
  return post<TripChat>(`/api/trip-chats/${id}/edits`, { expectedVersion, slot });
}

export function cancelTripChatEdit(id: string, expectedVersion: number): Promise<TripChat> {
  return post<TripChat>(`/api/trip-chats/${id}/edits/cancel`, { expectedVersion });
}

export function confirmTripChat(id: string, expectedVersion: number): Promise<TripChat> {
  return post<TripChat>(`/api/trip-chats/${id}/confirm`, { expectedVersion });
}
