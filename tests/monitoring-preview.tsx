import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { queryClient, queryKeys } from '../src/lib/queryClient';
import api from '../src/lib/api';
import { SchedulesPage } from '../src/features/schedules/SchedulesPage';
import { DashboardPage } from '../src/features/dashboard/DashboardPage';
import { SearchBookingPage } from '../src/features/bookings/SearchBookingPage';
import { bookingsApi } from '../src/features/bookings/bookings.api';
import { dashboardApi } from '../src/features/dashboard/dashboard.api';
import { accountsApi } from '../src/features/accounts/accounts.api';
import type { ScheduleItem, SchedulesResponse } from '../src/types/api';
import '../src/index.css';

const deny = async () => { throw new Error('Simulasi offline memblokir seluruh permintaan API.'); };
api.defaults.adapter = deny;
axios.defaults.adapter = deny;
window.fetch = deny;
const now = new Date();
const stamp = now.toISOString();
const meeting: ScheduleItem = {
  id: -1, meeting_id: -1, account_id: -1, account_name: 'Akun simulasi offline', host: 'Host simulasi', topic: 'Contoh overtime (data simulasi)', password: '', join_url: '', type: 2, duration: 60,
  start_time: new Date(now.getTime() - 77 * 60_000).toISOString(), end_time: new Date(now.getTime() - 17 * 60_000).toISOString(),
  monitoring: { state: 'live', schedule_known: true, observed_at: stamp, labels: [{ code: 'overtime', text: 'Overtime +17 menit' }, { code: 'next_meeting_risk', text: 'Rapat masih live; jadwal lain pada host ini sudah dekat atau dimulai' }] },
};
const schedules: SchedulesResponse = { observed_at: stamp, server_time: stamp, live_meetings: [meeting], upcoming_meetings: [{ ...meeting, id: -2, meeting_id: -2, topic: 'Contoh jadwal berikutnya (simulasi)', monitoring: { ...meeting.monitoring!, state: 'scheduled', labels: [{ code: 'starting_soon', text: 'Mulai 10 menit lagi' }] } }], past_meetings: [{ ...meeting, id: -3, meeting_id: -3, topic: 'Contoh jadwal terlewati (simulasi)', monitoring: { ...meeting.monitoring!, state: 'elapsed', labels: [{ code: 'schedule_elapsed', text: 'Jadwal terlewati; pelaksanaan belum terverifikasi' }] } }] };
const accounts = [{ id: -1, account_name: 'Akun simulasi offline', status: 'meeting' as const, current_topic: meeting.topic, meeting_capacity: 0, plan_type: 'Simulasi', last_updated: stamp, server_time: stamp, live_count: 1, monitoring: meeting.monitoring }];
schedules.upcoming_meetings[0].start_time = new Date(now.getTime() + 10 * 60_000).toISOString();
schedules.upcoming_meetings[0].end_time = new Date(now.getTime() + 70 * 60_000).toISOString();
const endedText = 'Sesi live sudah berakhir; jadwal tetap dicadangkan sampai batas jadwal dan dapat dimulai lagi (simulasi)';
const reserved = { ...meeting, id: -2, meeting_id: -2, account_name: 'Ahmad (simulasi offline)', topic: 'Rapat pernah live lalu berakhir (simulasi)', start_time: new Date(now.getTime() - 20 * 60_000).toISOString(), end_time: new Date(now.getTime() + 40 * 60_000).toISOString(), monitoring: { state: 'scheduled' as const, schedule_known: true, observed_at: stamp, last_ended_at: new Date(now.getTime() - 10 * 60_000).toISOString(), labels: [{ code: 'ended_reserved', text: endedText }] } };
schedules.upcoming_meetings = [reserved];
bookingsApi.searchAvailability = async () => [{ id: 'offline-reservation', account: { id: -1, name: reserved.account_name }, booking_user_id: 'offline-host', user_name: 'Host simulasi', email: '', status: 'BUSY', details: 'Jadwal tetap dicadangkan', requires_reservation_confirmation: true, observed_at: stamp, server_time: stamp, conflicting_meeting: { topic: reserved.topic, start_time: '10:00', end_time: '11:00', monitoring: reserved.monitoring } }];
bookingsApi.listSchedules = async () => schedules;
bookingsApi.endMeeting = deny;
bookingsApi.deleteMeeting = deny;
bookingsApi.updateMeeting = deny;
bookingsApi.bookMeeting = deny;
accountsApi.list = async () => [];
dashboardApi.getSummary = async () => accounts;
dashboardApi.getStatus = async () => ({ account_id: -1, status: 'meeting', topic: meeting.topic, monitoring: meeting.monitoring, meetings: [meeting], observed_at: stamp, server_time: stamp });
dashboardApi.getSpecs = async () => ({ account_id: -1, meeting_capacity: 0, plan_type: 'Simulasi' });
queryClient.setQueryData(queryKeys.schedules({ start_date: '', end_date: '', search: '', account_id: undefined }), schedules);
queryClient.setQueryData(queryKeys.dashboard, accounts);
queryClient.setQueryData(queryKeys.accounts, []);

export function Preview() {
  const [view, setView] = useState<'schedules' | 'dashboard' | 'booking'>('schedules');
  const [phone, setPhone] = useState(false);
  return <QueryClientProvider client={queryClient}><MemoryRouter><div style={{ margin: 'auto', maxWidth: phone ? 360 : 1200, padding: 16 }}>
    <p className="mb-3 text-sm font-semibold">Simulasi offline. Tidak terhubung ke Zoom.</p>
    <div className="mb-4 flex flex-wrap gap-3"><button onClick={() => setView(view === 'dashboard' ? 'schedules' : 'dashboard')} className="border rounded-md p-2">{view === 'dashboard' ? 'Lihat jadwal' : 'Lihat dashboard'}</button><button onClick={() => setView(view === 'booking' ? 'schedules' : 'booking')} className="border rounded-md p-2">{view === 'booking' ? 'Lihat jadwal' : 'Lihat booking'}</button><button onClick={() => setPhone(!phone)} className="border rounded-md p-2">{phone ? 'Lebar desktop' : 'Lebar 360 px'}</button></div>
    {view === 'dashboard' ? <DashboardPage /> : view === 'booking' ? <SearchBookingPage /> : <SchedulesPage />}
  </div></MemoryRouter></QueryClientProvider>;
}
const previewRoot = import.meta.hot?.data.previewRoot ?? createRoot(document.getElementById('root')!);
if (import.meta.hot) import.meta.hot.data.previewRoot = previewRoot;
previewRoot.render(<Preview />);
