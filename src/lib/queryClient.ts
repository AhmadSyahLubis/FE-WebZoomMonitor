import { QueryClient } from '@tanstack/react-query';
import type { ListSchedulesFilter, ListRecordingsFilter } from '@/types/api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } }).response?.status;
        return failureCount < 1 && (!status || status === 408 || status === 429 || status >= 500);
      },
      refetchOnWindowFocus: false,
      refetchIntervalInBackground: false,
      staleTime: 30_000,
      gcTime: 15 * 60_000,
    },
  },
});

queryClient.setQueryDefaults(['dashboard'], { staleTime: 30_000 });
queryClient.setQueryDefaults(['dashboard', 'specs'], { staleTime: 5 * 60_000 });
queryClient.setQueryDefaults(['schedules'], { staleTime: 60_000 });
queryClient.setQueryDefaults(['accounts'], { staleTime: 5 * 60_000 });
queryClient.setQueryDefaults(['recordings'], { staleTime: 2 * 60_000 });
queryClient.setQueryDefaults(['auth', 'me'], { staleTime: 5 * 60_000 });
// Availability is fetched explicitly by search, retry, or a completed booking.
queryClient.setQueryDefaults(['availability'], {
  enabled: false,
  staleTime: 0,
  retry: false,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchInterval: false,
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
