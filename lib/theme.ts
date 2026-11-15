import { flushSync } from 'react-dom';
import { useAppStore } from '@/lib/stores';

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => unknown;
};

/**
 * View Transition 콜백 안에서 .dark 클래스와 theme state(flushSync)를 동기 커밋해야 배경·아이콘이 한 스냅샷에 들어간다.
 */
export function toggleThemeWithTransition() {
  const next = useAppStore.getState().theme === 'light' ? 'dark' : 'light';

  const apply = () => {
    document.documentElement.classList.toggle('dark', next === 'dark');
    document.documentElement.style.colorScheme = next;
    flushSync(() => useAppStore.setState({ theme: next }));
    localStorage.setItem('theme', next);
  };

  const doc = document as ViewTransitionDocument;
  if (typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(apply);
  } else {
    apply();
  }
}
