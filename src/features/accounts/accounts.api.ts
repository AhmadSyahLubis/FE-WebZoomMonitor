import api from '@/lib/api';
import type {
  APIResponse,
  AccountResponse,
  CreateAccountRequest,
  UpdateAccountRequest,
  CheckConnectionResponse,
} from '@/types/api';

export const accountsApi = {
  list: async (): Promise<AccountResponse[]> => {
    const res = await api.get<APIResponse<AccountResponse[]>>('/accounts');
    return res.data.data || [];
  },

  getById: async (id: number): Promise<AccountResponse> => {
    const res = await api.get<APIResponse<AccountResponse>>(`/accounts/${id}`);
    return res.data.data!;
  },

  create: async (payload: CreateAccountRequest): Promise<AccountResponse> => {
    const res = await api.post<APIResponse<AccountResponse>>('/accounts', payload);
    return res.data.data!;
  },

  update: async (id: number, payload: UpdateAccountRequest): Promise<AccountResponse> => {
    const res = await api.put<APIResponse<AccountResponse>>(`/accounts/${id}`, payload);
    return res.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete<APIResponse<null>>(`/accounts/${id}`);
  },

  checkConnection: async (id: number): Promise<CheckConnectionResponse> => {
    const res = await api.get<APIResponse<CheckConnectionResponse>>(`/accounts/${id}/check`);
    return res.data.data!;
  },
};
