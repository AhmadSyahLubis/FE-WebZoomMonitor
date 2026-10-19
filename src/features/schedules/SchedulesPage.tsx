import React, { useState } from 'react';
import { PageBanner } from '@/components/shared/PageBanner';
import { QueryError } from '@/components/shared/QueryError';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '@/features/bookings/bookings.api';
import { buildMeetingDelete, buildMeetingEdit, isRecurringMeeting, meetingRowKey } from '@/features/bookings/meetingSafety';
import { accountsApi } from '@/features/accounts/accounts.api';
import { queryKeys } from '@/lib/queryClient';
import type {
  ScheduleItem,
  ListSchedulesFilter,
  UpdateMeetingRequest,
} from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { CopyButton } from '@/components/shared/CopyButton';
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
  Calendar,
  Clock,
  Search,
  ExternalLink,
  Square,
  Edit2,
  Trash2,
  Info,
  Repeat,
} from 'lucide-react';
import { formatWIBDateTime, formatWIBTime } from '@/lib/utils';
import { toast } from 'sonner';

export const SchedulesPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters state
  const [filter, setFilter] = useState<ListSchedulesFilter>({
    start_date: '',
    end_date: '',
    search: '',
    account_id: undefined,
  });
  const [appliedFilter, setAppliedFilter] = useState(filter);
  const applyFilters = () => {
    if (JSON.stringify(filter) === JSON.stringify(appliedFilter)) void refetch();
    else setAppliedFilter({ ...filter });
  };
  const resetFilters = () => {
    const empty = { start_date: '', end_date: '', search: '', account_id: undefined };
    setFilter(empty);
    setAppliedFilter(empty);
  };

  // Action states
  const [endingMeeting, setEndingMeeting] = useState<ScheduleItem | null>(null);
  const [deletingMeeting, setDeletingMeeting] = useState<ScheduleItem | null>(null);
  const [deleteScope, setDeleteScope] = useState<'occurrence' | 'all' | ''>('');
  const [editingMeeting, setEditingMeeting] = useState<ScheduleItem | null>(null);
  const [detailMeeting, setDetailMeeting] = useState<{ accountId: number; meetingId: number } | null>(null);

  // Edit form state
  const [editTopic, setEditTopic] = useState('');
  const [editDuration, setEditDuration] = useState(60);

  // Fetch accounts for filter dropdown
  const { data: accounts = [] } = useQuery({
    queryKey: queryKeys.accounts,
    queryFn: accountsApi.list,
  });

  // Fetch schedules
  const {
    data: schedules = { live_meetings: [], upcoming_meetings: [], past_meetings: [] },
    isLoading,
    refetch,
    isError,
  } = useQuery({
    queryKey: queryKeys.schedules(appliedFilter),
    queryFn: () => bookingsApi.listSchedules(appliedFilter),
    refetchInterval: 60000, // 60s auto-refresh
  });

  // Fetch meeting detail from Zoom when detail modal opens
  const { data: zoomDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: detailMeeting
      ? queryKeys.meetingDetail(detailMeeting.accountId, detailMeeting.meetingId)
      : ['meetingDetail', 0, 0],
    queryFn: () =>
      bookingsApi.getMeetingDetail(detailMeeting!.accountId, detailMeeting!.meetingId),
    enabled: !!detailMeeting,
  });

  // End meeting mutation
  const endMutation = useMutation({
    mutationFn: (meeting: ScheduleItem) =>
      bookingsApi.endMeeting(meeting.meeting_id, { account_id: meeting.account_id }),
    onSuccess: () => {
      toast.success('Meeting live berhasil diakhiri');
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      setEndingMeeting(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal mengakhiri meeting live');
    },
  });

  // Delete meeting mutation
  const deleteMutation = useMutation({
    mutationFn: ({ meeting, scope }: { meeting: ScheduleItem; scope: 'occurrence' | 'all' }) =>
      bookingsApi.deleteMeeting(meeting.meeting_id, buildMeetingDelete(meeting, scope)),
    onSuccess: () => {
      toast.success('Jadwal meeting berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      setDeletingMeeting(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus meeting');
    },
  });

  // Update meeting mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMeetingRequest }) =>
      bookingsApi.updateMeeting(id, data),
    onSuccess: () => {
      toast.success('Jadwal meeting berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setEditingMeeting(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui meeting');
    },
  });

  const handleOpenEdit = (m: ScheduleItem) => {
    if (isRecurringMeeting(m)) {
      toast.error('Edit meeting berulang belum tersedia.');
      return;
    }
    setEditingMeeting(m);
    setEditTopic(m.topic);
    setEditDuration(m.duration);
  };

  const handleSaveEdit = () => {
    if (!editingMeeting) return;
    try {
      updateMutation.mutate({ id: editingMeeting.meeting_id, data: buildMeetingEdit(editingMeeting, editTopic, editDuration) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Data meeting tidak valid.');
    }
  };

  const renderMeetingTable = (items: ScheduleItem[], type: 'live' | 'upcoming' | 'past') => {
    if (isLoading) {
      return (
        <div className="p-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      );
    }

    if (items.length === 0) {
      if (isError) return null;
      return (
        <div className="p-12 text-center text-slate-500">
          <img src="/icons/state_calendar.svg" alt="" className="w-40 h-24 mx-auto mb-3" />
          <p className="font-semibold text-slate-800">
            {type === 'live'
              ? 'Tidak ada meeting live saat ini'
              : type === 'upcoming'
              ? 'Tidak ada jadwal meeting mendatang'
              : 'Tidak ada riwayat meeting'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Gunakan form pencarian untuk menjadwalkan rapat baru.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="account-table w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">Topik Meeting</th>
              <th className="py-3 px-4">Akun & Host</th>
              <th className="py-3 px-4">Waktu Mulai</th>
              <th className="py-3 px-4">Durasi</th>
              <th className="py-3 px-4">Tipe</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {items.map((m) => (
              <tr key={meetingRowKey(m)} data-account className="hover:bg-slate-50/80 transition-colors">
                <td data-label="Topik meeting" className="py-3.5 px-4">
                  <span className="font-semibold text-slate-900 block">{m.topic}</span>
                  <span className="text-xs font-mono text-slate-400">ID: {m.meeting_id}</span>
                </td>
                <td data-label="Akun & host" className="py-3.5 px-4 text-xs">
                  <span className="font-medium text-slate-800 block">{m.account_name}</span>
                  <span className="text-slate-500">Host: {m.host || '-'}</span>
                </td>
                <td data-label="Waktu" className="py-3.5 px-4 text-xs">
                  <span className="font-medium text-slate-900 block">{formatWIBDateTime(m.start_time)}</span>
                  <span className="text-slate-400">s/d {formatWIBTime(m.end_time)}</span>
                </td>
                <td data-label="Durasi" className="py-3.5 px-4 text-xs text-slate-600">
                  {m.duration} Menit
                </td>
                <td data-label="Tipe" className="py-3.5 px-4">
                  {m.type === 8 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      <Repeat className="w-3 h-3" />
                      Recurring
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      One-Time
                    </span>
                  )}
                </td>
                <td data-label="Aksi" className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Live Actions */}
                    {type === 'live' && (
                      <>
                        <Button
                          size="sm"
                          className="h-8 bg-blue-600 hover:bg-blue-700 text-xs text-white"
                          onClick={() => window.open(m.join_url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          <span>Join</span>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setEndingMeeting(m)}
                        >
                          <Square className="w-3 h-3 mr-1" />
                          <span>Akhiri</span>
                        </Button>
                      </>
                    )}

                    {/* Upcoming Actions */}
                    {type === 'upcoming' && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(m)}
                          disabled={isRecurringMeeting(m)}
                          className="h-8 w-8 text-slate-600 hover:text-slate-900"
                          title={isRecurringMeeting(m) ? 'Edit meeting berulang belum tersedia' : 'Edit Jadwal'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeleteScope(isRecurringMeeting(m) ? (m.occurrence_id ? 'occurrence' : '') : 'all');
                            setDeletingMeeting(m);
                          }}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Hapus Meeting"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}

                    {/* Details action */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDetailMeeting({ accountId: m.account_id, meetingId: m.meeting_id })}
                      className="h-8 w-8 text-slate-500 hover:text-slate-800"
                      title="Lihat Detail"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageBanner title="Agenda meeting" description="Lihat meeting yang berlangsung, jadwal berikutnya, dan riwayat pertemuan." image="schedule_room.webp" />
      {schedules.upcoming_meetings?.some(isRecurringMeeting) && <p className="text-xs text-slate-500">Edit topik dan durasi untuk meeting berulang belum tersedia.</p>}

      {isError && <QueryError onRetry={() => refetch()} />}
      {/* Filter Bar Card */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardContent className="p-4">
          <form onSubmit={event => { event.preventDefault(); applyFilters(); }} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
            <div>
              <Label htmlFor="schedule_search" className="text-xs">Cari Topik Meeting</Label>
              <div className="relative">
                <Input
                  placeholder="Ketik topik meeting..."
                  id="schedule_search"
                  value={filter.search || ''}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  className="h-9 text-xs pl-8"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <Label htmlFor="schedule_account" className="text-xs">Filter Akun Zoom</Label>
              <select
                id="schedule_account"
                value={filter.account_id || ''}
                onChange={(e) =>
                  setFilter({
                    ...filter,
                    account_id: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <option value="">Semua Akun Zoom</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs">Rentang Tanggal</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  aria-label="Tanggal mulai jadwal"
                  value={filter.start_date || ''}
                  onChange={(e) => setFilter({ ...filter, start_date: e.target.value })}
                  className="h-9 text-xs"
                />
                <Input
                  type="date"
                  aria-label="Tanggal akhir jadwal"
                  value={filter.end_date || ''}
                  onChange={(e) => setFilter({ ...filter, end_date: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={resetFilters}
                className="h-9 text-xs flex-1"
              >
                Reset Filter
              </Button>
              <Button
                size="sm"
                type="submit"
                className="h-9 text-xs flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Terapkan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="live" className="space-y-4">
        <TabsList className="bg-slate-200/70 p-1">
          <TabsTrigger value="live" className="text-xs font-semibold gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Sedang Berlangsung ({schedules.live_meetings?.length || 0})</span>
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="text-xs font-semibold gap-2">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Mendatang ({schedules.upcoming_meetings?.length || 0})</span>
          </TabsTrigger>
          <TabsTrigger value="past" className="text-xs font-semibold gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Riwayat / Selesai ({schedules.past_meetings?.length || 0})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <Card className="border-slate-200 overflow-hidden shadow-xs">
            <CardContent className="p-0">
              {renderMeetingTable(schedules.live_meetings || [], 'live')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming">
          <Card className="border-slate-200 overflow-hidden shadow-xs">
            <CardContent className="p-0">
              {renderMeetingTable(schedules.upcoming_meetings || [], 'upcoming')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past">
          <Card className="border-slate-200 overflow-hidden shadow-xs">
            <CardContent className="p-0">
              {renderMeetingTable(schedules.past_meetings || [], 'past')}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <Dialog open={!!editingMeeting} onOpenChange={(open) => !open && setEditingMeeting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Jadwal Meeting</DialogTitle>
            <DialogDescription>
              Perbarui topik dan durasi meeting yang sudah terjadwal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="schedule_topic" required>Topik Meeting</Label>
              <Input
                value={editTopic}
                id="schedule_topic"
                onChange={(e) => setEditTopic(e.target.value)}
                placeholder="Topik meeting..."
              />
            </div>

            <div>
              <Label htmlFor="schedule_duration" required>Durasi (Menit)</Label>
              <Input
                type="number"
                min={15}
                value={editDuration}
                id="schedule_duration"
                onChange={(e) => setEditDuration(Number(e.target.value))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMeeting(null)}>
              Batal
            </Button>
            <Button onClick={handleSaveEdit} isLoading={updateMutation.isPending}>
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meeting Details Modal (from Zoom API) */}
      <Dialog open={!!detailMeeting} onOpenChange={(open) => !open && setDetailMeeting(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Meeting Zoom Cloud</DialogTitle>
            <DialogDescription>
              Data tersinkronisasi langsung dari Zoom Cloud API
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="py-6 space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          ) : zoomDetail ? (
            <div className="space-y-3.5 py-2 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-slate-400 font-medium">Topik Agenda</span>
                <p className="text-sm font-bold text-slate-900">{zoomDetail.topic}</p>
                <div className="grid grid-cols-2 gap-2 pt-2 text-slate-600 border-t border-slate-200">
                  <p>ID: <span className="font-mono font-semibold text-slate-900">{zoomDetail.id}</span></p>
                  <p>Durasi: <span className="font-semibold text-slate-900">{zoomDetail.duration} menit</span></p>
                  <p>Waktu Mulai: <span className="font-semibold text-slate-900">{formatWIBDateTime(zoomDetail.start_time)}</span></p>
                  <p>Status: <span className="font-semibold text-slate-900 capitalize">{zoomDetail.status}</span></p>
                </div>
              </div>

              {zoomDetail.join_url && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-blue-900 block">Tautan Join</span>
                    <span className="font-mono text-blue-700 truncate block">{zoomDetail.join_url}</span>
                  </div>
                  <CopyButton text={zoomDetail.join_url} label="Tautan disalin" />
                </div>
              )}

              {zoomDetail.password && (
                <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block">Password Meeting</span>
                    <span className="font-mono font-bold text-slate-900">{zoomDetail.password}</span>
                  </div>
                  <CopyButton text={zoomDetail.password} label="Password disalin" />
                </div>
              )}
            </div>
          ) : (
            <p className="py-4 text-center text-slate-500 text-xs">Data detail meeting tidak ditemukan.</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailMeeting(null)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm End Live Meeting Dialog */}
      <ConfirmDialog
        open={!!endingMeeting}
        onOpenChange={(open) => !open && setEndingMeeting(null)}
        title="Akhiri Meeting Live Ini?"
        description={`Meeting "${endingMeeting?.topic}" akan dihentikan secara paksa untuk semua peserta di Zoom Cloud.`}
        confirmLabel="Ya, Akhiri Meeting"
        variant="destructive"
        isLoading={endMutation.isPending}
        onConfirm={() => endingMeeting && endMutation.mutate(endingMeeting)}
      />

      <Dialog open={!!deletingMeeting} onOpenChange={open => { if (!open && !deleteMutation.isPending) setDeletingMeeting(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus jadwal meeting?</DialogTitle>
            <DialogDescription>Meeting “{deletingMeeting?.topic}” pada akun {deletingMeeting?.account_name}. Tindakan ini tidak dapat dibatalkan.</DialogDescription>
          </DialogHeader>
          {deletingMeeting && isRecurringMeeting(deletingMeeting) && <div className="space-y-3">
            <Label htmlFor="delete_scope" required>Cakupan penghapusan</Label>
            <select id="delete_scope" className="w-full min-h-11 rounded-xl border border-slate-500 bg-white px-3 text-sm" value={deleteScope} disabled={deleteMutation.isPending} onChange={event => setDeleteScope(event.target.value as typeof deleteScope)}>
              <option value="" disabled>Pilih cakupan penghapusan</option>
              <option value="occurrence" disabled={!deletingMeeting.occurrence_id}>Hanya kejadian pada {formatWIBDateTime(deletingMeeting.start_time)}</option>
              <option value="all">Seluruh seri meeting berulang</option>
            </select>
            <p role="status" className={deleteScope === 'all' ? 'text-sm font-semibold text-rose-700' : 'text-sm text-slate-600'}>{deleteScope === 'all' ? 'Seluruh seri meeting ini akan dihapus, termasuk kejadian lainnya.' : deleteScope === 'occurrence' ? 'Hanya kejadian yang dipilih akan dihapus. Kejadian lain dalam seri tetap ada.' : 'Pilih cakupan sebelum melanjutkan.'}</p>
          </div>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={deleteMutation.isPending} onClick={() => setDeletingMeeting(null)}>Batal</Button>
            <Button type="button" variant="destructive" disabled={!deleteScope} isLoading={deleteMutation.isPending} onClick={() => { if (deletingMeeting && deleteScope) deleteMutation.mutate({ meeting: deletingMeeting, scope: deleteScope }); }}>{deletingMeeting && isRecurringMeeting(deletingMeeting) ? (deleteScope === 'all' ? 'Ya, hapus seluruh seri' : 'Ya, hapus kejadian ini') : 'Ya, Hapus Meeting'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
