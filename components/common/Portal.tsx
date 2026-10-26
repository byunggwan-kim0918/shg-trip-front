'use client';

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

/**
 * 오버레이를 document.body로 내보낸다.
 *
 * `position: fixed`는 조상에 `transform`·`filter`·`backdrop-filter`·`perspective`·`contain`이 있으면
 * 뷰포트가 아니라 **그 조상**을 기준으로 잡힌다. 실제로 `Header`가 `backdrop-blur-xl`이라,
 * 헤더 안에서 렌더되던 닉네임 변경 모달의 `fixed inset-0`이 헤더의 60px 박스에 갇혀
 * 화면 위쪽에 잘린 채 떴다(딤 배경도 헤더 영역에만 깔렸다).
 *
 * 나머지 모달들은 마침 헤더 밖에서 렌더돼 "우연히" 정상이었을 뿐이라,
 * 같은 부류를 전부 이 컴포넌트로 감싼다. 앞으로 어디에 두든 조상 영향을 받지 않는다.
 */
/** SSR에서는 false, 클라이언트 마운트 후 true. effect 안 setState를 쓰지 않는다. */
const subscribe = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(subscribe, () => true, () => false);

export default function Portal({ children }: { children: React.ReactNode }) {
  if (!useIsClient()) return null;
  return createPortal(children, document.body);
}
