import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { needsReservationConfirmation, reservationOverrideAllowed } from '../src/features/bookings/reservationSafety.ts';

test('previously live reservations require explicit confirmation for force booking', () => {
  const result = { requires_reservation_confirmation: true };
  assert.equal(needsReservationConfirmation(result), true);
  assert.equal(reservationOverrideAllowed(result, true, false), false);
  assert.equal(reservationOverrideAllowed(result, true, true), true);
  assert.equal(reservationOverrideAllowed(result, false, false), true);
  assert.equal(needsReservationConfirmation({ conflicting_meeting: { monitoring: { labels: [{ code: 'previously_live_reserved' }] } } }), true);
  assert.equal(needsReservationConfirmation({ requires_reservation_confirmation: false }), false);
});

test('reserved notice explains restart risk and never preselects confirmation', async () => {
  const server = await createServer({ configFile: false, resolve: { alias: { '@': resolve('src') } }, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom', esbuild: { jsx: 'automatic' } });
  try {
    const { ReservedScheduleNotice } = await server.ssrLoadModule('/src/features/bookings/ReservedScheduleNotice.tsx');
    const markup = renderToStaticMarkup(React.createElement(ReservedScheduleNotice, { onChange: () => {} }));
    assert.match(markup, /Jadwal tetap dicadangkan/);
    assert.match(markup, /dapat dimulai lagi/);
    assert.match(markup, /type="checkbox"/);
    assert.doesNotMatch(markup, /checked=""/);
  } finally { await server.close(); }
});
