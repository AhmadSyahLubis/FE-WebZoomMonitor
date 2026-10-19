import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolve } from 'node:path';
import { createServer } from 'vite';

test('logout/login removes previous profile and ignores late data from the previous session', async () => {
  const values = new Map();
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  } });
  const server = await createServer({ configFile: false, resolve: { alias: { '@': resolve('src') } }, server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' });
  try {
    const { queryClient, queryKeys } = await server.ssrLoadModule('/src/lib/queryClient.ts');
    const { useAuthStore } = await server.ssrLoadModule('/src/features/auth/useAuthStore.ts');
    queryClient.setQueryData(queryKeys.me, { id: 1, name: 'Previous user' });
    let finishOldRequest;
    const oldRequest = queryClient.fetchQuery({ queryKey: ['late-session-data'], queryFn: () => new Promise(resolve => { finishOldRequest = resolve; }) }).catch(() => undefined);
    useAuthStore.getState().logout();
    assert.equal(queryClient.getQueryData(queryKeys.me), undefined);
    assert.equal(queryClient.getQueryCache().getAll().length, 0);
    assert.equal(useAuthStore.getState().isAuthenticated, false);
    finishOldRequest({ id: 1 });
    await oldRequest;
    assert.equal(queryClient.getQueryData(['late-session-data']), undefined);
    queryClient.setQueryData(queryKeys.me, { id: 1 });
    useAuthStore.getState().login({ access_token: 'offline-test', refresh_token: 'offline-refresh', user: { id: 2, name: 'Next user' } });
    assert.equal(queryClient.getQueryData(queryKeys.me), undefined);
    assert.equal(useAuthStore.getState().user.id, 2);
    let requests = 0;
    const current = await queryClient.fetchQuery({ queryKey: queryKeys.me, queryFn: async () => { requests++; return { id: 2 }; } });
    assert.equal(current.id, 2);
    assert.equal(requests, 1);
    useAuthStore.getState().logout();
  } finally {
    await server.close();
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage);
    else delete globalThis.localStorage;
  }
});
