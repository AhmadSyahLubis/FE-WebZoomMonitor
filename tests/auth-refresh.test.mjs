import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import axios from 'axios';

test('expired refresh logs out through the route guard without requiring a document reload', async () => {
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  } });
  const server = await createServer({ configFile: false, cacheDir: 'node_modules/.vite-test-refresh', resolve: { alias: { '@': resolve('src') } }, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom' });
  const previousAdapter = axios.defaults.adapter;
  try {
    const { default: api } = await server.ssrLoadModule('/src/lib/api.ts');
    const { useAuthStore } = await server.ssrLoadModule('/src/features/auth/useAuthStore.ts');
    const { queryClient } = await server.ssrLoadModule('/src/lib/queryClient.ts');
    useAuthStore.getState().login({ access_token: 'offline-access', refresh_token: 'offline-refresh', user: { id: 901, name: 'Offline example' } });
    let refreshRequests = 0;
    const expired = new Error('Offline example: refresh expired');
    axios.defaults.adapter = async config => {
      assert.ok(config.url.endsWith('/auth/refresh'));
      refreshRequests++;
      throw expired;
    };
    api.defaults.adapter = async config => { throw { config, response: { status: 401, data: { error_code: 'TOKEN_EXPIRED' } } }; };
    // No window exists in this test. A window.location redirect would fail this assertion.
    await assert.rejects(api.get('/dashboard'), error => error === expired);
    assert.equal(refreshRequests, 1);
    assert.equal(useAuthStore.getState().isAuthenticated, false);
    assert.equal(values.has('access_token'), false);
    assert.equal(queryClient.getQueryCache().getAll().length, 0);
  } finally {
    axios.defaults.adapter = previousAdapter;
    await server.close();
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage);
    else delete globalThis.localStorage;
  }
});
