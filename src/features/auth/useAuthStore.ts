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

  login: (data: TokenResponse) => void;
  logout: () => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: UserResponse) => void;
}

const initialAccessToken = localStorage.getItem('access_token');
const initialRefreshToken = localStorage.getItem('refresh_token');
const storedUser = localStorage.getItem('user');

export const useAuthStore = create<AuthState>((set) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  accessToken: initialAccessToken,
  refreshToken: initialRefreshToken,
  deviceId: getWebDeviceId(),
  isAuthenticated: !!initialAccessToken,

  login: (data: TokenResponse) => {
    queryClient.clear();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));

    set({
      user: data.user,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      isAuthenticated: true,
    });
  },

  logout: () => {
    queryClient.clear();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  updateTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);

    set({
      accessToken,
      refreshToken,
      isAuthenticated: true,
    });
  },

  setUser: (user: UserResponse) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
}));
