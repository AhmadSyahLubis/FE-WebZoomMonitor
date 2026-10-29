import api from '@/lib/api';
import type { APIResponse, RecordingItem, ListRecordingsFilter } from '@/types/api';

export const recordingsApi = {
  list: async (filter?: ListRecordingsFilter, signal?: AbortSignal): Promise<RecordingItem[]> => {
    const res = await api.get<APIResponse<RecordingItem[]>>('/recordings', {
      params: filter,
      signal,
    });
    return res.data.data || [];
  },
};
