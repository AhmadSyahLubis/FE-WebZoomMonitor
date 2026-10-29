import React, { useState } from 'react';
import { PageBanner } from '@/components/shared/PageBanner';
import { QueryError } from '@/components/shared/QueryError';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { accountsApi } from './accounts.api';
import { queryKeys } from '@/lib/queryClient';
import type { AccountResponse, UpdateAccountRequest } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CopyButton } from '@/components/shared/CopyButton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  Edit2,
  Trash2,
  KeyRound,
  CheckCircle,
  XCircle,
  Activity,
  Users2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { formatWIBDateTime } from '@/lib/utils';
import { toast } from 'sonner';

// Form validation schema
const accountSchema = z.object({
  account_name: z.string().min(1, 'Nama akun wajib diisi'),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  zoom_account_id: z.string().optional(),
  host_key: z.string().optional(),
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
});

type AccountFormData = z.infer<typeof accountSchema>;

export const AccountsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountResponse | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<number | null>(null);
  const [testingAccountId, setTestingAccountId] = useState<number | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  // Fetch accounts list
  const {
    data: accounts = [],
    isLoading,
    refetch,
    isError,
  } = useQuery({
    queryKey: queryKeys.accounts,
    queryFn: accountsApi.list,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: accountsApi.create,
    onSuccess: () => {
      toast.success('Akun Zoom berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      setModalOpen(false);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menambahkan akun Zoom');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAccountRequest }) =>
      accountsApi.update(id, data),
    onSuccess: () => {
      toast.success('Akun Zoom berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      setModalOpen(false);
      setEditingAccount(null);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui akun Zoom');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: accountsApi.delete,
    onSuccess: () => {
      toast.success('Akun Zoom berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      setDeletingAccountId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus akun Zoom');
      setDeletingAccountId(null);
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: accountsApi.checkConnection,
    onSuccess: (res) => {
      if (res.success) {
        toast.success(`Koneksi Sukses: ${res.message} (${res.active_users_count} user aktif)`);
      } else {
        toast.error(`Koneksi Gagal: ${res.message}`);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Koneksi ke Zoom API gagal (502 Bad Gateway)');
    },
    onSettled: () => {
      setTestingAccountId(null);
    },
  });

  const handleOpenCreate = () => {
    setEditingAccount(null);
    reset({
      account_name: '',
      email: '',
      zoom_account_id: '',
      host_key: '',
      client_id: '',
      client_secret: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (acc: AccountResponse) => {
    setEditingAccount(acc);
    reset({
      account_name: acc.account_name,
      email: acc.email || '',
      zoom_account_id: '',
      host_key: acc.host_key || '',
      client_id: '',
      client_secret: '',
    });
    setModalOpen(true);
  };

  const onSubmit = (formData: AccountFormData) => {
    if (editingAccount) {
      updateMutation.mutate({
        id: editingAccount.id,
        data: {
          account_name: formData.account_name,
          email: formData.email || undefined,
          zoom_account_id: formData.zoom_account_id || '',
          host_key: formData.host_key || '',
          client_id: formData.client_id || '',
          client_secret: formData.client_secret || '',
        },
      });
    } else {
      if (!formData.zoom_account_id || !formData.client_id || !formData.client_secret) {
        toast.error('Zoom Account ID, Client ID, dan Client Secret wajib diisi saat tambah akun');
        return;
      }
      createMutation.mutate({
        account_name: formData.account_name,
        email: formData.email || undefined,
        zoom_account_id: formData.zoom_account_id,
        host_key: formData.host_key || undefined,
        client_id: formData.client_id,
        client_secret: formData.client_secret,
      });
    }
  };

  const handleTestConnection = (id: number) => {
    setTestingAccountId(id);
    testConnectionMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <PageBanner title="Akun Zoom instansi" description="Kelola akun Zoom dan periksa koneksinya sebelum meeting dimulai." image="accounts_workstation.webp" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-base font-semibold">Daftar akun <span className="text-slate-500 font-normal">({accounts.length})</span></h2>
        <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 shadow-xs">
          <Plus className="w-4 h-4 mr-1" />
          <span>Tambah Akun Zoom</span>
        </Button>
      </div>

      {/* Accounts Table Card */}
      {isError && <QueryError onRetry={() => refetch()} />}
      <Card className="border-slate-200 overflow-hidden shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="account-table w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Nama Akun</th>
                  <th className="py-3.5 px-4">Email Terdaftar</th>
                  <th className="py-3.5 px-4">Host Key</th>
                  <th className="py-3.5 px-4">Status Token</th>
                  <th className="py-3.5 px-4">Tanggal Dibuat</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isLoading ? (
                  [1, 2, 3].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-40" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="p-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-28" /></td>
                      <td className="p-4"><Skeleton className="h-8 w-24 ml-auto" /></td>
                    </tr>
                  ))
                ) : accounts.length === 0 && !isError ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500">
                      <Users2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="font-semibold text-slate-800">Belum ada akun Zoom terdaftar</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Klik tombol "Tambah Akun Zoom" untuk menghubungkan OAuth kredensial.
                      </p>
                    </td>
                  </tr>
                ) : (
                  accounts.map((acc) => (
                    <tr key={acc.id} data-account className="hover:bg-slate-50/80 transition-colors">
                      <td data-label="Nama akun" className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block">{acc.account_name}</span>
                        <span className="text-xs text-slate-400">ID #{acc.id}</span>
                      </td>
                      <td data-label="Email" className="py-3.5 px-4 text-slate-600">
                        {acc.email || <span className="text-slate-400 italic">-</span>}
                      </td>
                      <td data-label="Host key" className="py-3.5 px-4">
                        {acc.host_key ? (
                          <div className="inline-flex items-center gap-1 font-mono text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200">
                            <KeyRound className="w-3 h-3 text-slate-500" />
                            <span>{acc.host_key}</span>
                            <CopyButton text={acc.host_key} label="Host Key disalin" />
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">-</span>
                        )}
                      </td>
                      <td data-label="Koneksi" className="py-3.5 px-4">
                        {acc.has_token ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Terhubung</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Belum Ada Token</span>
                          </span>
                        )}
                      </td>
                      <td data-label="Dibuat" className="py-3.5 px-4 text-xs text-slate-500">
                        {formatWIBDateTime(acc.created_at)}
                      </td>
                      <td data-label="Aksi" className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestConnection(acc.id)}
                            isLoading={testingAccountId === acc.id}
                            title="Tes Koneksi Zoom"
                            className="text-xs h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                          >
                            <Activity className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">Tes Koneksi</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(acc)}
                            title="Edit Akun"
                            className="h-8 w-8 text-slate-600 hover:text-slate-900"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingAccountId(acc.id)}
                            title="Hapus Akun"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Create / Edit Account */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'Edit Akun Zoom' : 'Tambah Akun Zoom Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingAccount
                ? 'Perbarui informasi atau kredensial akun Zoom S2S OAuth.'
                : 'Masukkan kredensial Server-to-Server OAuth dari akun Zoom instansi.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 py-2">
            <div>
              <Label htmlFor="account_name" required>Nama Akun</Label>
              <Input
                id="account_name"
                {...register('account_name')}
                placeholder="Contoh: Zoom Room 1"
                error={errors.account_name?.message}
              />
            </div>

            <div>
              <Label htmlFor="account_email">Email Akun Zoom (Opsional)</Label>
              <Input
                id="account_email"
                {...register('email')}
                type="email"
                placeholder="Contoh: room1@company.com"
                error={errors.email?.message}
              />
            </div>

            <div>
              <Label htmlFor="zoom_account_id" required={!editingAccount}>Zoom Account ID</Label>
              <Input
                id="zoom_account_id"
                {...register('zoom_account_id')}
                placeholder={
                  editingAccount
                    ? '•••••••• (kosongkan jika tidak diubah)'
                    : 'Account ID dari Zoom App Marketplace'
                }
              />
            </div>

            <div>
              <Label htmlFor="client_id" required={!editingAccount}>Client ID</Label>
              <Input
                id="client_id"
                {...register('client_id')}
                placeholder={
                  editingAccount
                    ? '•••••••• (kosongkan jika tidak diubah)'
                    : 'Client ID S2S OAuth'
                }
              />
            </div>

            <div>
              <Label htmlFor="client_secret" required={!editingAccount}>Client Secret</Label>
              <div className="relative">
                <Input
                  {...register('client_secret')}
                  id="client_secret"
                  type={showSecret ? 'text' : 'password'}
                  placeholder={
                    editingAccount
                      ? '•••••••• (kosongkan jika tidak diubah)'
                      : 'Client Secret S2S OAuth'
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="password-toggle"
                  aria-label={showSecret ? 'Sembunyikan client secret' : 'Tampilkan client secret'}
                  aria-pressed={showSecret}
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="host_key">Host Key (Opsional, 6 Digit)</Label>
              <Input
                id="host_key"
                {...register('host_key')}
                placeholder="Contoh: 123456"
                maxLength={6}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                isLoading={createMutation.isPending || updateMutation.isPending}
              >
                {editingAccount ? 'Simpan Perubahan' : 'Tambah Akun'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deletingAccountId}
        onOpenChange={(open) => !open && setDeletingAccountId(null)}
        title="Hapus Akun Zoom?"
        description="Akun Zoom ini akan dihapus dari sistem monitoring. Seluruh sesi token terkait akan dihentikan."
        confirmLabel="Ya, Hapus Akun"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deletingAccountId && deleteMutation.mutate(deletingAccountId)}
      />
    </div>
  );
};
