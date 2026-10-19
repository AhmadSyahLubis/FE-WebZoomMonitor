import type { RecordingItem } from '@/types/api';

export function recordingRowKey(recording: RecordingItem): string {
  return JSON.stringify([recording.account_id, recording.uuid || recording.meeting_id, recording.start_time]);
}
