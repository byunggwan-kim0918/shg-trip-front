import { useSyncExternalStore } from 'react';

/**
 * 탈퇴 본인 확인은 로그인과 같은 콜백 페이지로 돌아온다. 화면 문구만 고르는 표시라
 * 실제 분기는 BFF가 HttpOnly 쿠키로 한다.
 */
const WITHDRAW_PENDING_KEY = 'shg_withdraw_pending';
// 완료 배너는 주소의 ?withdrawn=1만으로 뜨면 남이 보낸 링크로도 "탈퇴됐다"는 안내를 띄울 수 있다.
const WITHDRAWN_NOTICE_KEY = 'shg_withdrawn_notice';
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

export function markWithdrawnNotice(): void {
  try {
    sessionStorage.setItem(WITHDRAWN_NOTICE_KEY, '1');
  } catch { /* 저장 실패면 배너만 뜨지 않는다 */ }
}

/** 서버 렌더에서는 false라 정적·동적 렌더 어느 쪽이든 hydration이 어긋나지 않는다. */
export function useWithdrawnNotice(): boolean {
  return useSyncExternalStore(subscribeNever, hasWithdrawnNotice, () => false);
}

export function hasWithdrawnNotice(): boolean {
  try {
    return sessionStorage.getItem(WITHDRAWN_NOTICE_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearWithdrawnNotice(): void {
  try {
    sessionStorage.removeItem(WITHDRAWN_NOTICE_KEY);
  } catch { /* 없으면 그대로 둔다 */ }
}
