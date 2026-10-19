import api from '@/lib/api';
import type {
  APIResponse,
  DashboardAccountSummary,
  AccountStatusResponse,
  AccountSpecsResponse,
} from '@/types/api';

export const dashboardApi = {
  getSummary: async (): Promise<DashboardAccountSummary[]> => {
    const res = await api.get<APIResponse<DashboardAccountSummary[]>>('/dashboard');
    return res.data.data || [];
  },

  getStatus: async (id: number): Promise<AccountStatusResponse> => {
    const res = await api.get<APIResponse<AccountStatusResponse>>(`/dashboard/${id}/status`);
    return res.data.data!;
  },

  getSpecs: async (id: number): Promise<AccountSpecsResponse> => {
    const res = await api.get<APIResponse<AccountSpecsResponse>>(`/dashboard/${id}/specs`);
    return res.data.data!;
  },
};
