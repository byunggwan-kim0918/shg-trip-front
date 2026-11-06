import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface AppState {
  theme: Theme;
  sidebarOpen: boolean;
}

interface AppActions {
  setSidebarOpen: (open: boolean) => void;
}

/* theme 쓰기는 lib/theme.ts가 맡는다. html.dark 토글과 같은 flushSync 안에서 커밋해야
 * View Transition 스냅샷에 함께 들어가므로 store에 toggleTheme 액션을 두지 않는다. */
export const useAppStore = create<AppState & AppActions>((set) => ({
  theme: 'light',
  sidebarOpen: true,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
