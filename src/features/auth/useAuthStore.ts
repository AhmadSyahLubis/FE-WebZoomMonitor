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

const SESSION_STORAGE_KEY = 'zm_web_session';

interface PersistedSession {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
  deviceId: string;
}

function loadSession(expectedDeviceId: string): PersistedSession | null {
  try {
    const raw = globalThis.sessionStorage?.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedSession>;
    if (
      !parsed ||
      typeof parsed.accessToken !== 'string' ||
      !parsed.accessToken ||
      typeof parsed.refreshToken !== 'string' ||
      !parsed.refreshToken ||
      parsed.deviceId !== expectedDeviceId ||
      !parsed.user ||
      !parsed.user.id
    ) {
      globalThis.sessionStorage?.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return parsed as PersistedSession;
  } catch {
    return null;
  }
}

function saveSession(session: PersistedSession | null): void {
  try {
    if (!session) {
      globalThis.sessionStorage?.removeItem(SESSION_STORAGE_KEY);
      return;
    }
    globalThis.sessionStorage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* Storage can be unavailable in private browsing. */
  }
}

const initialDeviceId = getWebDeviceId();
const restoredSession = loadSession(initialDeviceId);

export const useAuthStore = create<AuthState>((set, get) => ({
  user: restoredSession?.user ?? null,
  accessToken: restoredSession?.accessToken ?? null,
  refreshToken: restoredSession?.refreshToken ?? null,
  deviceId: initialDeviceId,
  isAuthenticated: Boolean(restoredSession),
  version: 0,

  login: (data: TokenResponse) => {
    queryClient.clear();
    if (!data.access_token || !data.refresh_token || !data.user?.id) throw new Error('Respons login tidak valid');

    const deviceId = get().deviceId;
    saveSession({
      user: data.user,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      deviceId,
    });

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
    saveSession(null);

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      version: get().version + 1,
    });
  },

  updateTokens: (accessToken: string, refreshToken: string) => {
    const state = get();
    if (!state.isAuthenticated || !accessToken || !refreshToken || !state.user) throw new Error('Sesi tidak aktif');

    saveSession({
      user: state.user,
      accessToken,
      refreshToken,
      deviceId: state.deviceId,
    });

    set({
      accessToken,
      refreshToken,
      isAuthenticated: true,
    });
  },

  setUser: (user: UserResponse) => {
    const state = get();
    if (state.isAuthenticated && state.accessToken && state.refreshToken) {
      saveSession({
        user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        deviceId: state.deviceId,
      });
      set({ user });
    }
  },
}));
