import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface AppState {
  theme: Theme;
  sidebarOpen: boolean;
}

interface AppActions {
  setSidebarOpen: (open: boolean) => void;
}

/* theme은 여기 값이 단일 출처이지만 **쓰기는 lib/theme.ts가 담당한다**.
 * toggleThemeWithTransition()이 html.dark 토글과 같은 flushSync 안에서 setState로 커밋해야
 * View Transition 스냅샷에 함께 들어가기 때문이다. 그래서 store 안에 toggleTheme 액션을 두지 않는다
 * (예전에 있었지만 호출처가 없는 죽은 코드였고, 그걸 쓰면 타이밍이 어긋난다). */
export const useAppStore = create<AppState & AppActions>((set) => ({
  theme: 'light',
  sidebarOpen: true,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
