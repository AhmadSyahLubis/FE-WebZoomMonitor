import api from '@/lib/api';
import type {
  APIResponse,
  AvailabilityResult,
  BookMeetingRequest,
  BookingCreatedResponse,
  SchedulesResponse,
  ListSchedulesFilter,
  UpdateMeetingRequest,
  DeleteMeetingRequest,
  EndMeetingRequest,
  ZoomMeetingDetail,
} from '@/types/api';

export const bookingsApi = {
  searchAvailability: async (params: {
    date: string;
    start_time: string;
    duration?: number;
  }): Promise<AvailabilityResult[]> => {
    const res = await api.get<APIResponse<AvailabilityResult[]>>('/bookings/search', {
      params,
    });
    return res.data.data || [];
  },

  bookMeeting: async (payload: BookMeetingRequest): Promise<BookingCreatedResponse> => {
    const res = await api.post<APIResponse<BookingCreatedResponse>>('/bookings', payload);
    return res.data.data!;
  },

  listSchedules: async (filter?: ListSchedulesFilter): Promise<SchedulesResponse> => {
    const res = await api.get<APIResponse<SchedulesResponse>>('/bookings', {
      params: filter,
    });
    return (
      res.data.data || {
        live_meetings: [],
        upcoming_meetings: [],
        past_meetings: [],
      }
    );
  },

  updateMeeting: async (meetingId: number | string, payload: UpdateMeetingRequest): Promise<void> => {
    await api.put<APIResponse<null>>(`/bookings/${meetingId}`, payload);
  },

  deleteMeeting: async (meetingId: number | string, payload: DeleteMeetingRequest): Promise<void> => {
    await api.delete<APIResponse<null>>(`/bookings/${meetingId}`, {
      data: payload,
    });
  },

  endMeeting: async (meetingId: number | string, payload: EndMeetingRequest): Promise<void> => {
    await api.post<APIResponse<null>>(`/bookings/${meetingId}/end`, payload);
  },

  getMeetingDetail: async (
    accountId: number,
    meetingId: number | string
  ): Promise<ZoomMeetingDetail> => {
    const res = await api.get<APIResponse<ZoomMeetingDetail>>(
      `/bookings/${accountId}/${meetingId}/details`
    );
    return res.data.data!;
  },
};
