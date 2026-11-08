import { create } from 'zustand';
import type { Provider } from '@/lib/auth/oauthConfig';

export interface UserInfo {
  id: number;
  nickname: string | null;
  email: string;
  profileImage: string | null;
  provider: Provider | null;
}

interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  fetchSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  isAuthenticated: false,

  fetchSession: async () => {
    try {
      const res = await fetch('/api/auth/session', {
        credentials: 'include',
      });

      if (!res.ok) {
        set({ user: null, isAuthenticated: false });
        return;
      }

      const { data } = await res.json();
      set({
        user: data.user,
        isAuthenticated: data.isAuthenticated,
      });
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },
}));
