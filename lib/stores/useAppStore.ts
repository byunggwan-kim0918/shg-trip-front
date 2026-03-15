import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface AppState {
  theme: Theme;
  sidebarOpen: boolean;
}

interface AppActions {
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState & AppActions>((set) => ({
  theme: 'light',
  sidebarOpen: true,

  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
