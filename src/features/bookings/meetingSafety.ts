import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import type { DeleteMeetingRequest, ScheduleItem, UpdateMeetingRequest } from '@/types/api';

const WIB = 'Asia/Jakarta';

export function todayWIB(now = new Date()): string {
  return formatInTimeZone(now, WIB, 'yyyy-MM-dd');
}

export function recurringEndUTC(date: string): string {
  // Zoom silently ignores recurrence cutoffs containing fractional seconds.
  return fromZonedTime(`${date}T23:59:59`, WIB).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function isRecurringMeeting(meeting: Pick<ScheduleItem, 'type'>): boolean {
  return meeting.type === 3 || meeting.type === 8;
}

export function meetingRowKey(meeting: ScheduleItem): string {
  return JSON.stringify([meeting.account_id, meeting.meeting_id, meeting.occurrence_id || meeting.start_time]);
}

export function buildMeetingDelete(meeting: ScheduleItem, scope: 'all' | 'occurrence'): DeleteMeetingRequest {
  if (scope === 'occurrence') {
    if (!isRecurringMeeting(meeting) || !meeting.occurrence_id) {
      throw new Error('Kejadian meeting tidak dikenali. Muat ulang jadwal sebelum menghapus.');
    }
    return { account_id: meeting.account_id, delete_option: 'occurrence', occurrence_id: meeting.occurrence_id };
  }
  if (scope !== 'all') throw new Error('Pilih cakupan penghapusan terlebih dahulu.');
  return { account_id: meeting.account_id, delete_option: 'all' };
}

export function buildMeetingEdit(meeting: ScheduleItem, topic: string, duration: number): UpdateMeetingRequest {
  // The current backend overwrites recurrence and cannot edit one occurrence safely.
  if (isRecurringMeeting(meeting)) throw new Error('Edit meeting berulang belum tersedia.');
  if (!topic.trim()) throw new Error('Topik meeting wajib diisi.');
  if (!Number.isInteger(duration) || duration < 15) throw new Error('Durasi minimal 15 menit dalam bilangan bulat.');
  return {
    account_id: meeting.account_id,
    topic: topic.trim(),
    start_time: formatInTimeZone(meeting.start_time, WIB, 'yyyy-MM-dd HH:mm'),
    duration,
    is_recurring: false,
  };
}
