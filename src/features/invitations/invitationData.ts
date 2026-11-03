import { fromZonedTime } from 'date-fns-tz';
import type { BookMeetingRequest, ScheduleItem, ZoomMeetingDetail } from '@/types/api';

export class InvitationDataError extends Error {}

export interface InvitationData {
  topic: string;
  meetingId: string;
  passcode: string;
  joinUrl: string;
  startTime: string;
  endTime: string;
}

export function participantUrl(raw: string, meetingId: string): string {
  let url: URL;
  try { url = new URL(raw); } catch { throw new InvitationDataError('Tautan peserta Zoom tidak tersedia atau tidak valid.'); }
  const domain = url.hostname.toLowerCase();
  const allowed = ['zoom.us', 'zoom.com', 'zoomgov.com'].some(root => domain === root || domain.endsWith(`.${root}`));
  const pathId = url.pathname.match(/^\/j\/(\d+)\/?$/)?.[1];
  const hasControlOrSpace = [...raw].some(char => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127);
  if (raw !== raw.trim() || hasControlOrSpace || url.protocol !== 'https:' || !allowed || url.username || url.password || url.port || url.hash ||
      (!pathId && !/^\/my\/[a-zA-Z0-9._-]+\/?$/.test(url.pathname)) ||
      (pathId && pathId !== meetingId) || [...url.searchParams.keys()].some(key => key.toLowerCase() === 'zak') || raw.length > 2000) {
    throw new InvitationDataError('Undangan memerlukan tautan peserta Zoom yang sesuai dengan Meeting ID.');
  }
  return raw;
}

function build(detail: ZoomMeetingDetail, meetingId: number, startTime: string, duration: number): InvitationData {
  const id = String(meetingId);
  if (String(detail.id) !== id || !/^\d{9,11}$/.test(id)) throw new InvitationDataError('Data meeting berubah. Muat ulang daftar jadwal.');
  const start = new Date(startTime);
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(startTime || '') || !Number.isFinite(start.getTime()) || !Number.isFinite(duration) || duration <= 0 || duration > 10080) {
    throw new InvitationDataError('Jadwal meeting belum lengkap. Pilih jadwal rapat yang memiliki waktu pasti.');
  }
  const topic = detail.topic?.trim();
  if (!topic || topic.length > 600) throw new InvitationDataError('Topik meeting tidak tersedia atau terlalu panjang untuk undangan.');
  if ((detail.password || '').length > 100) throw new InvitationDataError('Passcode meeting tidak valid.');
  return {
    topic, meetingId: id, passcode: detail.password || '',
    joinUrl: participantUrl(detail.join_url, id), startTime: start.toISOString(),
    endTime: new Date(start.getTime() + duration * 60_000).toISOString(),
  };
}

export function invitationFromSchedule(row: ScheduleItem, detail: ZoomMeetingDetail): InvitationData {
  if (detail.type === 8) {
    const occurrence = detail.occurrences?.find(item => String(item.occurrence_id) === String(row.occurrence_id) && item.status !== 'deleted');
    if (!row.occurrence_id || !occurrence) throw new InvitationDataError('Jadwal berulang ini sudah berubah. Muat ulang daftar jadwal lalu pilih tanggal rapat.');
    return build(detail, row.meeting_id, occurrence.start_time, occurrence.duration);
  }
  if (detail.type === 3) throw new InvitationDataError('Meeting tanpa waktu tetap belum dapat dibuatkan undangan.');
  return build(detail, row.meeting_id, detail.start_time, detail.duration);
}

export function invitationFromBooking(meetingId: number, request: BookMeetingRequest, detail: ZoomMeetingDetail): InvitationData {
  if (detail.type === 8) {
    const requestedStart = fromZonedTime(`${request.date}T${request.time}`, 'Asia/Jakarta').getTime();
    const occurrence = detail.occurrences?.find(item => item.status !== 'deleted' && new Date(item.start_time).getTime() === requestedStart);
    if (!occurrence) throw new InvitationDataError('Pilih tanggal rapat berulang dari halaman Jadwal rapat untuk membuat undangan.');
    return build(detail, meetingId, occurrence.start_time, occurrence.duration);
  }
  if (detail.type === 3) throw new InvitationDataError('Meeting tanpa waktu tetap belum dapat dibuatkan undangan.');
  return build(detail, meetingId, detail.start_time, detail.duration);
}

const dateFormatter = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
export function invitationCalendar(data: InvitationData) {
  const date = new Date(data.startTime);
  const part = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', ...options }).format(date);
  return { weekday: part({ weekday: 'long' }), day: part({ day: 'numeric' }), monthYear: part({ month: 'long', year: 'numeric' }) };
}
export function invitationSchedule(data: InvitationData) {
  const date = dateFormatter.format(new Date(data.startTime));
  const endDate = dateFormatter.format(new Date(data.endTime));
  return { date, time: `${timeFormatter.format(new Date(data.startTime))} - ${timeFormatter.format(new Date(data.endTime))} WIB`, endDate: endDate === date ? '' : endDate };
}
export const invitationFilename = (data: InvitationData) => {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(data.startTime));
  return `Undangan-${data.meetingId}-${date}.pdf`;
};
export const readableMeetingId = (id: string) => id.replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1 $2 $3');
