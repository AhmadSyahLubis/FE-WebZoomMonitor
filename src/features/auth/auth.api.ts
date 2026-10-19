import api from '@/lib/api';
import type {
  APIResponse,
  LoginRequest,
  TokenResponse,
  UserResponse,
} from '@/types/api';

export const authApi = {
  login: async (payload: LoginRequest): Promise<TokenResponse> => {
    const res = await api.post<APIResponse<TokenResponse>>('/auth/login', payload);
    return res.data.data!;
  },

  logout: async (deviceId?: string): Promise<void> => {
    await api.post<APIResponse<null>>('/auth/logout', { device_id: deviceId });
  },

  getMe: async (): Promise<UserResponse> => {
    const res = await api.get<APIResponse<UserResponse>>('/auth/me');
    return res.data.data!;
  },
};
