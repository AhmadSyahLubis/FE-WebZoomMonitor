import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { monitoringIsStale } from '../src/features/dashboard/monitoring.ts';

test('freshness follows server observation and elapsed receipt time, independent of device clock offset', () => {
  const observed = '2026-11-02T10:00:00+07:00';
  const server = '2026-11-02T10:00:30+07:00';
  assert.equal(monitoringIsStale(observed, server, 1_000, 60_999), false);
  assert.equal(monitoringIsStale(observed, server, 1_000, 61_000), true);
  assert.equal(monitoringIsStale(observed, server, 1_000, 500), false);
  assert.equal(monitoringIsStale(undefined, server, 1_000, 1_000), true);
  assert.equal(monitoringIsStale(server, observed, 1_000, 1_000), true);
});

test('labels use backend text, escape content, and replace stale live claims', async () => {
  const server = await createServer({ configFile: false, resolve: { alias: { '@': resolve('src') } }, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom', esbuild: { jsx: 'automatic' } });
  try {
    const { MonitoringLabels } = await server.ssrLoadModule('/src/components/shared/MonitoringLabels.tsx');
    const monitoring = { state: 'live', schedule_known: true, observed_at: '2026-11-02T10:17:00+07:00', labels: [{ code: 'overtime', text: 'Overtime +17 menit' }, { code: 'next_meeting_risk', text: '<script>example</script>' }] };
    const fresh = renderToStaticMarkup(React.createElement(MonitoringLabels, { monitoring }));
    assert.match(fresh, /Overtime \+17 menit/);
    assert.doesNotMatch(fresh, /<script>/);
    const stale = renderToStaticMarkup(React.createElement(MonitoringLabels, { monitoring, stale: true }));
    assert.match(stale, /Status belum terverifikasi/);
    assert.doesNotMatch(stale, /Overtime/);
  } finally { await server.close(); }
});
