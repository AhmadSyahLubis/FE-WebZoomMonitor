import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildMeetingDelete, buildMeetingEdit, isRecurringMeeting, meetingRowKey, recurringEndUTC, todayWIB } from '../src/features/bookings/meetingSafety.ts';
import { bookingSchema } from '../src/features/bookings/bookingSchema.ts';
import { recordingRowKey } from '../src/features/recordings/recordingIdentity.ts';

const meeting = Object.freeze({ account_id: 7, meeting_id: 123, id: 123, type: 2, topic: 'Existing meeting', start_time: '2026-10-19T10:00:00+07:00', duration: 60 });

test('WIB date changes at Jakarta midnight, regardless of machine timezone', () => {
  assert.equal(todayWIB(new Date('2026-10-18T16:59:59Z')), '2026-10-18');
  assert.equal(todayWIB(new Date('2026-10-18T17:00:00Z')), '2026-10-19');
  assert.equal(todayWIB(new Date('2026-12-31T17:30:00Z')), '2027-01-01');
});

test('recurring cutoff includes the complete final WIB day', () => {
  const end = recurringEndUTC('2026-10-19');
  assert.equal(end, '2026-10-19T16:59:59Z');
  assert.match(end, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  assert.ok(new Date('2026-10-19T10:00:00+07:00') < new Date(end));
  assert.ok(new Date('2026-10-20T00:00:00+07:00') > new Date(end));
  assert.throws(() => recurringEndUTC('invalid'));
});

test('single meeting edit matches backend WIB contract without changing the source meeting', () => {
  assert.deepEqual(buildMeetingEdit(meeting, ' Updated topic ', 90), { account_id: 7, topic: 'Updated topic', start_time: '2026-10-19 10:00', duration: 90, is_recurring: false });
  assert.equal(meeting.topic, 'Existing meeting');
  assert.equal(meeting.start_time, '2026-10-19T10:00:00+07:00');
  assert.equal(buildMeetingEdit({ ...meeting, start_time: '2026-10-18T20:30:00Z' }, 'Topic', 15).start_time, '2026-10-19 03:30');
});

test('recurring series edits are blocked before any API payload is built', () => {
  for (const type of [3, 8]) {
    const recurring = { ...meeting, type };
    assert.equal(isRecurringMeeting(recurring), true);
    assert.throws(() => buildMeetingEdit(recurring, 'Topic', 60), /berulang/);
  }
});

test('invalid edits cannot produce a mutation payload', () => {
  assert.throws(() => buildMeetingEdit(meeting, '  ', 60), /Topik/);
  for (const duration of [0, 14, 15.5, NaN, Infinity]) assert.throws(() => buildMeetingEdit(meeting, 'Topic', duration), /Durasi/);
  assert.throws(() => buildMeetingEdit({ ...meeting, start_time: 'invalid' }, 'Topic', 60));
});

test('occurrence deletion includes only the selected occurrence; series deletion requires explicit all scope', () => {
  const recurring = { ...meeting, type: 8, occurrence_id: 'occurrence-1' };
  assert.deepEqual(buildMeetingDelete(recurring, 'occurrence'), { account_id: 7, delete_option: 'occurrence', occurrence_id: 'occurrence-1' });
  assert.deepEqual(buildMeetingDelete(recurring, 'all'), { account_id: 7, delete_option: 'all' });
  assert.deepEqual(buildMeetingDelete(meeting, 'all'), { account_id: 7, delete_option: 'all' });
  assert.throws(() => buildMeetingDelete({ ...recurring, occurrence_id: null }, 'occurrence'), /tidak dikenali/);
  assert.throws(() => buildMeetingDelete(meeting, 'occurrence'), /tidak dikenali/);
  assert.throws(() => buildMeetingDelete(recurring, undefined), /cakupan/);
  assert.throws(() => buildMeetingDelete(recurring, ''), /cakupan/);
});

test('recurring schedule rows stay distinct through account, occurrence, and fallback date identity', () => {
  const a = { ...meeting, type: 8, occurrence_id: 'one' };
  const b = { ...a, occurrence_id: 'two' };
  assert.equal(new Set([meetingRowKey(a), meetingRowKey(b), meetingRowKey({ ...a, account_id: 8 })]).size, 3);
  assert.notEqual(meetingRowKey(meeting), meetingRowKey({ ...meeting, start_time: '2026-10-20T10:00:00+07:00' }));
});

test('recording sessions with the same meeting ID expand independently', () => {
  const first = { account_id: 7, meeting_id: 123, uuid: 'session-1', start_time: '2026-10-19T03:00:00Z' };
  const second = { ...first, uuid: 'session-2' };
  const expanded = recordingRowKey(first);
  assert.deepEqual([first, second].filter(recording => recordingRowKey(recording) === expanded), [first]);
  assert.notEqual(expanded, recordingRowKey({ ...first, account_id: 8 }));
  assert.notEqual(recordingRowKey({ ...first, uuid: '' }), recordingRowKey({ ...first, uuid: '', start_time: '2026-10-20T03:00:00Z' }));
});

test('booking rejects missing or whitespace topic and returns the displayable field error', () => {
  for (const topic of ['', '   ']) {
    const result = bookingSchema.safeParse({ topic, is_recurring: false, ignore_conflict: false });
    assert.equal(result.success, false);
    assert.deepEqual(result.error.issues[0].path, ['topic']);
    assert.equal(result.error.issues[0].message, 'Topik meeting wajib diisi');
  }
});

test('booking validates recurring requirements when enabled', () => {
  const missingEnd = bookingSchema.safeParse({ topic: 'Valid topic', is_recurring: true, recurrence_type: 1, ignore_conflict: false });
  assert.equal(missingEnd.success, false);
  assert.deepEqual(missingEnd.error.issues[0].path, ['end_date_time']);
  assert.equal(missingEnd.error.issues[0].message, 'Tanggal selesai berulang wajib diisi');

  const missingWeekly = bookingSchema.safeParse({ topic: 'Valid topic', is_recurring: true, recurrence_type: 2, end_date_time: '2026-11-10', weekly_days: '', ignore_conflict: false });
  assert.equal(missingWeekly.success, false);
  assert.deepEqual(missingWeekly.error.issues[0].path, ['weekly_days']);
  assert.equal(missingWeekly.error.issues[0].message, 'Pilih minimal 1 hari pengulangan');

  const validDaily = bookingSchema.safeParse({ topic: 'Valid topic', is_recurring: true, recurrence_type: 1, end_date_time: '2026-11-10', ignore_conflict: false });
  assert.equal(validDaily.success, true);
});
