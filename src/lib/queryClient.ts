import { QueryClient } from '@tanstack/react-query';
import type { ListSchedulesFilter, ListRecordingsFilter } from '@/types/api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 10000, // 10 seconds stale time
    },
  },
});

export const queryKeys = {
  // Dashboard
  dashboard: ['dashboard'] as const,
  dashboardStatus: (id: number) => ['dashboard', 'status', id] as const,
  dashboardSpecs: (id: number) => ['dashboard', 'specs', id] as const,

  // Accounts
  accounts: ['accounts'] as const,
  account: (id: number) => ['accounts', id] as const,

  // Bookings & Schedules
  schedules: (filter?: ListSchedulesFilter) => ['schedules', filter] as const,
  availability: (params?: { date: string; start_time: string; duration: number }) =>
    ['availability', params] as const,
  meetingDetail: (accountId: number, meetingId: string | number) =>
    ['meeting', accountId, String(meetingId)] as const,

  // Recordings
  recordings: (params?: ListRecordingsFilter) => ['recordings', params] as const,

  // Auth
  me: ['auth', 'me'] as const,
};
