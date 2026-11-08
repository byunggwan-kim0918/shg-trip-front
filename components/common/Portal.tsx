'use client';

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

/**
 * 조상에 transform·filter·backdrop-filter·perspective·contain이 있으면 `position: fixed`가
 * 그 조상 기준으로 잡히므로(Header의 backdrop-blur 등) 오버레이는 document.body로 내보낸다.
 */
/** SSR에서는 false, 클라이언트 마운트 후 true. effect 안 setState를 쓰지 않는다. */
const subscribe = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(subscribe, () => true, () => false);

export default function Portal({ children }: { children: React.ReactNode }) {
  if (!useIsClient()) return null;
  return createPortal(children, document.body);
}
