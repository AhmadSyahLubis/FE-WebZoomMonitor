import { create } from 'zustand';
import type { TokenResponse, UserResponse } from '@/types/api';
import { getWebDeviceId } from '@/lib/device';
import { queryClient } from '@/lib/queryClient';

interface AuthState {
  user: UserResponse | null;
  accessToken: string | null;
  refreshToken: string | null;
  deviceId: string;
  isAuthenticated: boolean;
  version: number;

  login: (data: TokenResponse) => void;
  logout: () => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: UserResponse) => void;
}

// Legacy sessions have no backend session binding and must not be restored.
try { for (const key of ['access_token', 'refresh_token', 'user']) localStorage.removeItem(key); } catch { /* Storage can be unavailable in private browsing. */ }

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  deviceId: getWebDeviceId(),
  isAuthenticated: false,
  version: 0,

  login: (data: TokenResponse) => {
    queryClient.clear();
    if (!data.access_token || !data.refresh_token || !data.user?.id) throw new Error('Respons login tidak valid');

    set({
      user: data.user,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      isAuthenticated: true,
      version: get().version + 1,
    });
  },

  logout: () => {
    queryClient.clear();
    try { for (const key of ['access_token', 'refresh_token', 'user']) localStorage.removeItem(key); } catch { /* No persistent tokens are used. */ }

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      version: get().version + 1,
    });
  },

  updateTokens: (accessToken: string, refreshToken: string) => {
    if (!get().isAuthenticated || !accessToken || !refreshToken) throw new Error('Sesi tidak aktif');

    set({
      accessToken,
      refreshToken,
      isAuthenticated: true,
    });
  },

  setUser: (user: UserResponse) => {
    if (get().isAuthenticated) set({ user });
  },
}));
