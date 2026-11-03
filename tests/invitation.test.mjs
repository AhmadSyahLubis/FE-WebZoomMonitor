import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import { invitationFromSchedule, invitationFromBooking, invitationSchedule, invitationFilename, participantUrl } from '../src/features/invitations/invitationData.ts';

const id = 99900000001;
const url = `https://us02web.zoom.us/j/${id}?pwd=Simulasi%2BQR%2F2026%3D`;
const detail = { id, topic: 'SIMULASI - Koordinasi Layanan Pemerintahan Digital Provinsi Sumatera Utara', type: 2, start_time: '2026-11-03T16:30:00Z', duration: 90, password: 'TesAbC9', join_url: url, host_key: 'NEVER_EXPORT_HOST_KEY', start_url: 'NEVER_EXPORT_START_URL' };
const row = { meeting_id: id, occurrence_id: null, start_time: '2020-01-01T00:00:00Z' };

test('invitation uses refreshed participant data, WIB overnight schedule, and explicit allowlist', () => {
  const data = invitationFromSchedule(row, detail);
  assert.deepEqual(Object.keys(data).sort(), ['topic', 'meetingId', 'passcode', 'joinUrl', 'startTime', 'endTime'].sort());
  assert.equal(data.startTime, detail.start_time.replace('Z', '.000Z'));
  const schedule = invitationSchedule(data);
  assert.match(schedule.date, /3 November 2026/);
  assert.match(schedule.time, /23.30 - 01.00 WIB/);
  assert.match(schedule.endDate, /4 November 2026/);
  assert.equal(data.joinUrl, url);
  assert.doesNotMatch(JSON.stringify(data), /NEVER_EXPORT/);
  assert.match(invitationFilename({ ...data, startTime: '2026-11-02T18:00:00Z' }), /2026-11-03\.pdf$/);
});

test('recurring invitation follows selected occurrence, never substitutes another occurrence', () => {
  const recurring = { ...detail, type: 8, occurrences: [{ occurrence_id: 'A', status: 'available', start_time: '2026-11-03T03:00:00Z', duration: 60 }, { occurrence_id: 'B', status: 'available', start_time: '2026-11-04T03:00:00Z', duration: 120 }] };
  const selected = invitationFromSchedule({ ...row, occurrence_id: 'B' }, recurring);
  assert.equal(selected.startTime, '2026-11-04T03:00:00.000Z');
  assert.equal(selected.endTime, '2026-11-04T05:00:00.000Z');
  assert.throws(() => invitationFromSchedule(row, recurring));
  assert.throws(() => invitationFromSchedule({ ...row, occurrence_id: 'C' }, recurring));
  assert.throws(() => invitationFromSchedule({ ...row, occurrence_id: 'A' }, { ...recurring, occurrences: [{ ...recurring.occurrences[0], status: 'deleted' }] }));
  assert.equal(invitationFromBooking(id, { date: '2026-11-04', time: '10:00' }, recurring).startTime, selected.startTime);
  assert.throws(() => invitationFromBooking(id, { date: '2026-11-05', time: '10:00' }, recurring));
});

test('participant QR rejects unsafe destinations and host URLs', () => {
  for (const unsafe of ['javascript:alert(1)', `http://zoom.us/j/${id}`, `https://zoom.us.evil.test/j/${id}`, `https://zoom.us@evil.test/j/${id}`, `https://zoom.us/s/${id}?zak=secret`, `https://zoom.us/j/${id}?ZAK=secret`, `https://zoom.us/j/99900000002`, `https://zoom.us:444/j/${id}`, `https://user:secret@zoom.us/j/${id}`, `https://zoom.us/j/${id}#fragment`]) {
    assert.throws(() => participantUrl(unsafe, String(id)), unsafe);
  }
  assert.equal(participantUrl(url, String(id)), url);
});

test('missing or mismatched meeting and schedule fail instead of fabricating data', () => {
  assert.throws(() => invitationFromSchedule(row, { ...detail, id: id + 1 }));
  assert.throws(() => invitationFromSchedule(row, { ...detail, type: 3 }));
  assert.throws(() => invitationFromSchedule(row, { ...detail, start_time: '2026-11-03T10:00:00' }));
  assert.throws(() => invitationFromSchedule(row, { ...detail, duration: 0 }));
  assert.equal(invitationFromSchedule(row, { ...detail, password: '' }).passcode, '');
});

const popplerAvailable = ['pdfinfo', 'pdftoppm', 'pdftotext'].every(tool => {
  try { execFileSync(tool, ['-v'], { stdio: 'ignore' }); return true; } catch (error) { return error.code !== 'ENOENT'; }
});
test('invitation failures identify their stage without exposing raw response details or credentials', async () => {
  const server = await createServer({ configFile: false, resolve: { alias: { '@': resolve('src') } }, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom' });
  try {
    const { invitationFailure } = await server.ssrLoadModule('/src/features/invitations/invitationErrors.ts');
    const { InvitationDataError } = await server.ssrLoadModule('/src/features/invitations/invitationData.ts');
    assert.equal(invitationFailure(new InvitationDataError('Jadwal belum lengkap.'), 'meeting'), 'Jadwal belum lengkap.');
    assert.match(invitationFailure(new Error('secret-token-and-start-url'), 'module'), /UNDANGAN_MODUL/);
    for (const stage of ['meeting', 'module', 'assets', 'qr', 'pdf', 'download']) {
      assert.doesNotMatch(invitationFailure(new Error('secret-token-and-start-url'), stage), /secret-token|start-url/);
    }
    assert.match(invitationFailure({ isAxiosError: true, response: { status: 404, data: { message: 'secret' } } }, 'meeting'), /UNDANGAN_DETAIL/);
    assert.match(invitationFailure({ isAxiosError: true, response: { status: 429 } }, 'meeting'), /UNDANGAN_BATAS/);
  } finally { await server.close(); }
});
test('actual PDF is one page, selectable, excludes host secrets, and its rendered QR decodes exactly', { skip: !popplerAvailable && 'Install Poppler for the rendered PDF and QR verification.' }, async () => {
  const server = await createServer({ configFile: false, resolve: { alias: { '@': resolve('src') } }, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom' });
  try {
    const { createInvitationPdf } = await server.ssrLoadModule('/src/features/invitations/invitationPdf.ts');
    const [regular, bold, logo, collaborationLogo] = await Promise.all(['public/fonts/InterInvitation-Regular.ttf', 'public/fonts/InterInvitation-Bold.ttf', 'public/brand/sumatera-utara.png', 'public/brand/kolaborasi-sumut-berkah.png'].map(path => readFile(path)));
    const assets = { regular: regular.toString('base64'), bold: bold.toString('base64'), logo: new Uint8Array(logo), collaborationLogo: new Uint8Array(collaborationLogo) };
    const data = invitationFromSchedule(row, detail);
    await mkdir('output/pdf', { recursive: true });
    await mkdir('tmp/pdfs', { recursive: true });
    const file = resolve('output/pdf/contoh-undangan-simulasi.pdf');
    await writeFile(file, createInvitationPdf(data, assets));
    execFileSync('pdftoppm', ['-singlefile', '-scale-to', '1800', '-png', file, resolve('tmp/pdfs/invitation')]);
    const png = PNG.sync.read(await readFile('tmp/pdfs/invitation.png'));
    const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    assert.equal(decoded?.data, url);
    const info = execFileSync('pdfinfo', [file], { encoding: 'utf8' });
    assert.match(info, /Pages:\s+1/);
    const text = execFileSync('pdftotext', [file, '-'], { encoding: 'utf8' });
    for (const expected of ['SUMATERA UTARA', '999 0000 0001', 'TesAbC9', '3 November 2026', '4 November 2026', 'PIC ZOOM MEETING', 'Sdr. Julfan Torang Pandopotan Malau, SAP', '087768670770']) assert.ok(text.includes(expected), expected);
    assert.doesNotMatch(text, /NEVER_EXPORT/);
    const longFile = resolve('tmp/pdfs/long-topic.pdf');
    await writeFile(longFile, createInvitationPdf({ ...data, topic: 'SIMULASI - Pembahasan koordinasi penyelenggaraan rapat dan layanan pemerintahan digital lintas instansi. '.repeat(3), passcode: '' }, assets));
    assert.match(execFileSync('pdfinfo', [longFile], { encoding: 'utf8' }), /Pages:\s+1/);
    assert.match(execFileSync('pdftotext', [longFile, '-'], { encoding: 'utf8' }), /Tidak tersedia/);
  } finally { await server.close(); }
});
