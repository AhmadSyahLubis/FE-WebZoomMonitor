import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import api from '../src/lib/api';
import { MeetingInvitationButton } from '../src/features/invitations/MeetingInvitationButton';
import { SchedulesPage } from '../src/features/schedules/SchedulesPage';
import { bookingsApi } from '../src/features/bookings/bookings.api';
import { accountsApi } from '../src/features/accounts/accounts.api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { InvitationData } from '../src/features/invitations/invitationData';
import '../src/index.css';

const deny = async () => { throw new Error('Simulasi memblokir seluruh akses API.'); };
api.defaults.adapter = deny;
axios.defaults.adapter = deny;
const localFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input), location.href);
  if (url.origin === location.origin && /^\/(fonts\/InterInvitation-(Regular|Bold)\.ttf|brand\/(sumatera-utara|kolaborasi-sumut-berkah)\.png)$/.test(url.pathname) && (!init?.method || init.method === 'GET')) return localFetch(input, init);
  return deny();
};
const sample: InvitationData = { topic: 'SIMULASI - Koordinasi Layanan Pemerintahan Digital Provinsi Sumatera Utara', meetingId: '99900000001', passcode: 'TesAbC9', joinUrl: 'https://us02web.zoom.us/j/99900000001?pwd=Simulasi%2BQR%2F2026%3D', startTime: '2026-11-03T16:30:00Z', endTime: '2026-11-03T18:00:00Z' };
accountsApi.list = async () => [];
bookingsApi.listSchedules = async () => ({ live_meetings: [], past_meetings: [], upcoming_meetings: [{ id: -1, meeting_id: Number(sample.meetingId), account_id: -1, account_name: 'Akun simulasi offline', host: 'Simulasi', topic: sample.topic, password: '', join_url: sample.joinUrl, type: 2, start_time: sample.startTime, end_time: sample.endTime, duration: 90 }] });
bookingsApi.getMeetingDetail = async () => ({ id: Number(sample.meetingId), uuid: 'offline', host_id: 'offline', topic: sample.topic, type: 2, status: 'waiting', start_time: sample.startTime, duration: 90, timezone: 'Asia/Jakarta', created_at: sample.startTime, join_url: sample.joinUrl, password: sample.passcode });
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
export function Preview() {
  const [fail, setFail] = useState(false);
  const [schedules, setSchedules] = useState(false);
  return <main className="mx-auto max-w-6xl space-y-6 p-5"><h1 className="text-2xl font-bold">Simulasi undangan PDF</h1><p>Data fiktif. Seluruh akses API dan perubahan meeting diblokir.</p><label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={schedules} onChange={e => setSchedules(e.target.checked)} />Tampilkan halaman jadwal</label>{schedules ? <QueryClientProvider client={queryClient}><MemoryRouter><SchedulesPage /></MemoryRouter></QueryClientProvider> : <><label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={fail} onChange={e => setFail(e.target.checked)} />Simulasikan kegagalan data</label><MeetingInvitationButton loadInvitation={async () => { await new Promise(resolve => setTimeout(resolve, 300)); if (fail) throw new Error('Simulasi gagal'); return sample; }} /></>}</main>;
}
const root = import.meta.hot?.data.previewRoot ?? createRoot(document.getElementById('root')!);
if (import.meta.hot) import.meta.hot.data.previewRoot = root;
root.render(<Preview />);
