import assert from 'node:assert/strict';
import { test, afterEach } from 'node:test';
import { QueryObserver } from '@tanstack/react-query';
import { queryClient, queryKeys } from '../src/lib/queryClient.ts';

afterEach(() => queryClient.clear());

test('fresh caches reuse data, deduplicate requests, and still respect invalidation', async () => {
  let requests = 0;
  let resolveRequest;
  const options = { queryKey: queryKeys.accounts, queryFn: () => { requests++; return new Promise(resolve => { resolveRequest = resolve; }); } };
  const first = queryClient.fetchQuery(options);
  const second = queryClient.fetchQuery(options);
  assert.equal(requests, 1);
  resolveRequest([{ id: 901 }]);
  await Promise.all([first, second]);
  await queryClient.fetchQuery(options);
  assert.equal(requests, 1);
  await queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
  const updated = queryClient.fetchQuery(options);
  assert.equal(requests, 2);
  resolveRequest([{ id: 902 }]);
  assert.deepEqual(await updated, [{ id: 902 }]);
});

test('background refresh retains visible rows, avoids initial loading, and shares unchanged data', async () => {
  const key = queryKeys.schedules({ search: '' });
  const rows = { upcoming_meetings: [{ meeting_id: 1, topic: 'Offline example' }] };
  queryClient.setQueryData(key, rows);
  let resolveRequest;
  const observer = new QueryObserver(queryClient, { queryKey: key, staleTime: 0, queryFn: () => new Promise(resolve => { resolveRequest = resolve; }) });
  const unsubscribe = observer.subscribe(() => {});
  try {
    assert.equal(observer.getCurrentResult().isFetching, true);
    assert.equal(observer.getCurrentResult().isLoading, false);
    assert.deepEqual(observer.getCurrentResult().data, rows);
    const original = observer.getCurrentResult().data;
    const done = observer.refetch({ cancelRefetch: false });
    resolveRequest(structuredClone(rows));
    await done;
    assert.equal(observer.getCurrentResult().data, original);
    assert.equal(observer.getCurrentResult().isFetching, false);
  } finally { unsubscribe(); }
});

test('failed background refresh preserves the last successful data', async () => {
  queryClient.setQueryData(queryKeys.dashboard, [{ id: 901 }]);
  const observer = new QueryObserver(queryClient, { queryKey: queryKeys.dashboard, staleTime: Infinity, retry: false, queryFn: async () => { throw new Error('offline'); } });
  const unsubscribe = observer.subscribe(() => {});
  try {
    await observer.refetch();
    const result = observer.getCurrentResult();
    assert.equal(result.isError, true);
    assert.equal(result.isLoading, false);
    assert.deepEqual(result.data, [{ id: 901 }]);
    assert.ok(result.dataUpdatedAt > 0);
  } finally { unsubscribe(); }
});

test('policies limit polling and cache stable data without trusting cached availability', () => {
  const defaults = queryClient.getDefaultOptions().queries;
  assert.equal(defaults.refetchOnWindowFocus, false);
  assert.equal(defaults.refetchIntervalInBackground, false);
  assert.equal(defaults.gcTime, 15 * 60_000);
  assert.equal(queryClient.getQueryDefaults(queryKeys.accounts).staleTime, 5 * 60_000);
  assert.equal(queryClient.getQueryDefaults(['schedules']).staleTime, 60_000);
  assert.equal(queryClient.getQueryDefaults(['availability']).staleTime, 0);
  assert.equal(queryClient.getQueryDefaults(['availability']).refetchOnWindowFocus, false);
  assert.equal(defaults.retry(0, { response: { status: 401 } }), false);
  assert.equal(defaults.retry(0, { response: { status: 422 } }), false);
  assert.equal(defaults.retry(0, { response: { status: 503 } }), true);
  assert.equal(defaults.retry(1, new Error('offline')), false);
});

test('leaving a polling view aborts its consumed signal and retains cached rows', async () => {
  const key = queryKeys.schedules({ search: 'abort example' });
  queryClient.setQueryData(key, [{ meeting_id: 901 }]);
  let requestSignal;
  const observer = new QueryObserver(queryClient, {
    queryKey: key, staleTime: 0,
    queryFn: ({ signal }) => new Promise((resolve, reject) => {
      requestSignal = signal;
      signal.addEventListener('abort', () => reject(new Error('Request canceled')), { once: true });
    }),
  });
  const unsubscribe = observer.subscribe(() => {});
  assert.equal(requestSignal.aborted, false);
  unsubscribe();
  assert.equal(requestSignal.aborted, true);
  assert.deepEqual(queryClient.getQueryData(key), [{ meeting_id: 901 }]);
});

test('availability stays manual on mount, focus, reconnect, and invalidation; each search fetches fresh data', async () => {
  let requests = 0;
  const params = { date: '2026-10-20', start_time: '09:00', duration: 60 };
  const options = { queryKey: queryKeys.availability(params), queryFn: async () => { requests++; return [{ account_id: requests }]; } };
  queryClient.setQueryData(options.queryKey, [{ account_id: 0 }]);
  const observer = new QueryObserver(queryClient, options);
  const unsubscribe = observer.subscribe(() => {});
  try {
    const policy = queryClient.getQueryDefaults(['availability']);
    assert.equal(policy.enabled, false);
    assert.equal(policy.refetchOnMount, false);
    assert.equal(policy.refetchOnReconnect, false);
    assert.equal(policy.refetchInterval, false);
    assert.equal(policy.retry, false);
    queryClient.getQueryCache().onFocus();
    queryClient.getQueryCache().onOnline();
    await queryClient.invalidateQueries({ queryKey: ['availability'] });
    assert.equal(requests, 0);
    assert.equal(observer.getCurrentResult().isFetching, false);
    assert.deepEqual(await queryClient.fetchQuery(options), [{ account_id: 1 }]);
    assert.deepEqual(await queryClient.fetchQuery(options), [{ account_id: 2 }]);
    assert.equal(requests, 2);
  } finally { unsubscribe(); }
});
