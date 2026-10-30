'use client';

import { useSyncExternalStore } from 'react';
import { NEW_TRIP_SENTENCE_KEY } from '@/lib/constants/newTrip';
import { RETURN_TO_PARAM, sanitizeReturnTo } from '@/lib/auth/returnTo';

const noopSubscribe = () => () => {};

/** 문장을 소비하는 새 여행 화면으로 돌아갈 때만 보여준다. 그 외엔 로그인 후 /main으로 가서 문장이 쓰이지 않는다. */
function readSentence(): string | null {
  const returnTo = sanitizeReturnTo(new URLSearchParams(window.location.search).get(RETURN_TO_PARAM));
  if (!returnTo?.startsWith('/main/plan/new')) return null;
  try {
    return sessionStorage.getItem(NEW_TRIP_SENTENCE_KEY);
  } catch {
    return null;
  }
}

/** 랜딩에서 문장을 적고 넘어온 경우, 로그인해도 입력이 사라지지 않는다는 걸 알려준다. */
export default function LoginReturnHint() {
  const sentence = useSyncExternalStore(noopSubscribe, readSentence, () => null);
  if (!sentence) return null;

  return (
    <div className="mt-6 w-full rounded-[10px] border border-card-border bg-surface-2 px-4 py-3">
      <p className="truncate text-[13px] font-semibold text-foreground">“{sentence}”</p>
      <p className="mt-0.5 text-xs text-muted">로그인하면 이 문장으로 바로 이어서 만들어요.</p>
    </div>
  );
}
