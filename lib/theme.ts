import { flushSync } from 'react-dom';
import { useAppStore } from '@/lib/stores';

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => unknown;
};

/**
 * 테마를 토글한다. View Transitions API를 지원하는 브라우저에서는
 * 화면 전체를 하나의 크로스페이드로 전환해 "영역별로 시차 두고 쓸리는" 현상을 없앤다.
 *
 * 트랜지션 스냅샷 타이밍을 맞추기 위해 두 가지를 콜백 안에서 동기적으로 처리한다:
 *  1) .dark 클래스 / colorScheme 직접 조작 → 배경·색 변경을 스냅샷에 포함
 *     (ThemeInitializer는 useEffect라 페인트 후 실행되므로 여기에 의존하면 타이밍이 어긋난다)
 *  2) flushSync로 theme state 커밋 → 헤더 아이콘 교체 등 리렌더도 스냅샷에 포함
 * 이후 ThemeInitializer effect가 localStorage 저장 + 동일 클래스 재적용을 하지만 idempotent하다.
 */
export function toggleThemeWithTransition() {
  const next = useAppStore.getState().theme === 'light' ? 'dark' : 'light';

  const apply = () => {
    document.documentElement.classList.toggle('dark', next === 'dark');
    document.documentElement.style.colorScheme = next;
    flushSync(() => useAppStore.setState({ theme: next }));
  };

  const doc = document as ViewTransitionDocument;
  if (typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(apply);
  } else {
    // 미지원 브라우저: 즉시 전환 (기존 동작)
    apply();
  }
}
