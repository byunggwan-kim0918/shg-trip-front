import { useSyncExternalStore } from 'react';

/**
 * 탈퇴 본인 확인은 로그인과 같은 콜백 페이지로 돌아온다. 화면 문구만 고르는 표시라
 * 실제 분기는 BFF가 HttpOnly 쿠키로 한다.
 */
const WITHDRAW_PENDING_KEY = 'shg_withdraw_pending';
export const WITHDRAWN_PARAM = 'withdrawn';

export function markWithdrawPending(): void {
  try {
    sessionStorage.setItem(WITHDRAW_PENDING_KEY, '1');
  } catch { /* 저장 실패는 문구만 달라진다 */ }
}

/** 화면 문구용. 서버 렌더와 hydration 첫 렌더는 false라 분기 판단에는 isWithdrawPending을 쓴다. */
export function useWithdrawPending(): boolean {
  return useSyncExternalStore(subscribeNever, isWithdrawPending, () => false);
}

function subscribeNever(): () => void {
  return () => {};
}

export function isWithdrawPending(): boolean {
  try {
    return sessionStorage.getItem(WITHDRAW_PENDING_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearWithdrawPending(): void {
  try {
    sessionStorage.removeItem(WITHDRAW_PENDING_KEY);
  } catch { /* 없으면 그대로 둔다 */ }
}
