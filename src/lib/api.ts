import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/features/auth/useAuthStore';
import type { APIResponse, TokenResponse } from '@/types/api';

export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api/v1' : 'http://localhost:8080/api/v1');
if (import.meta.env.PROD) {
  const endpoint = new URL(API_BASE_URL, 'https://same-origin.invalid');
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || API_BASE_URL.startsWith('//')) throw new Error('Production API wajib menggunakan HTTPS tanpa kredensial pada URL');
}

type SessionRequest = InternalAxiosRequestConfig & { _retry?: boolean; _sessionVersion?: number };
const api = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' }, timeout: 30000 });
let refresh: { version: number; promise: Promise<string> } | undefined;

api.interceptors.request.use((config: SessionRequest) => {
  if (!config.url?.startsWith('/') || config.url.startsWith('//') || config.url.includes('\\')) throw new Error('Endpoint API tidak valid');
  const session = useAuthStore.getState();
  config._sessionVersion ??= session.version;
  if (config._sessionVersion !== session.version) throw new axios.CanceledError('Sesi sudah berubah');
  if (session.accessToken && !/\/auth\/(login|refresh)$/.test(config.url || '')) config.headers.Authorization = `Bearer ${session.accessToken}`;
  else config.headers.delete('Authorization');
  return config;
});

api.interceptors.response.use(response => {
  const config = response.config as SessionRequest;
  if (config._sessionVersion !== useAuthStore.getState().version) throw new axios.CanceledError('Respons sesi lama diabaikan');
  return response;
}, async error => {
  const request = error.config as SessionRequest | undefined;
  const session = useAuthStore.getState();
  if (!request || request._sessionVersion !== session.version) return Promise.reject(error);
  if (error.response?.status !== 401 || /\/auth\/(login|refresh|biometric\/(login|challenge))$/.test(request.url || '')) return Promise.reject(error);

  if (error.response?.data?.error_code !== 'TOKEN_EXPIRED' || request._retry || !session.refreshToken) {
    session.logout();
    return Promise.reject(error);
  }
  request._retry = true;
  const sentToken = request.headers.Authorization;
  if (sentToken !== `Bearer ${session.accessToken}` && session.accessToken) return api(request);

  if (!refresh || refresh.version !== session.version) {
    const version = session.version;
    const pending = axios.post<APIResponse<TokenResponse>>(`${API_BASE_URL.replace(/\/$/, '')}/auth/refresh`, {
      refresh_token: session.refreshToken, device_id: session.deviceId,
    }, { timeout: 30000 }).then(({ data }) => {
      if (useAuthStore.getState().version !== version) throw new axios.CanceledError('Sesi sudah berubah');
      if (!data.success || !data.data?.access_token || !data.data.refresh_token) throw new Error('Respons refresh tidak valid');
      useAuthStore.getState().updateTokens(data.data.access_token, data.data.refresh_token);
      return data.data.access_token;
    }).catch(err => {
      if (useAuthStore.getState().version === version) useAuthStore.getState().logout();
      throw err;
    }).finally(() => { if (refresh?.promise === pending) refresh = undefined; });
    refresh = { version, promise: pending };
  }
  await refresh.promise;
  return api(request);
});

export default api;
