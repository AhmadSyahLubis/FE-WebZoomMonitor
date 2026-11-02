import React, { useState } from 'react';
import { PageBanner } from '@/components/shared/PageBanner';
import { BrandIcon } from '@/components/shared/BrandIcon';
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
    isFetching,
    dataUpdatedAt,
    refetch,
    isError,
  } = useQuery({
    queryKey: queryKeys.schedules(appliedFilter),
    queryFn: ({ signal }) => bookingsApi.listSchedules(appliedFilter, signal),
    refetchInterval: 60_000,
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
      queryClient.invalidateQueries({ queryKey: ['availability'] });
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
      queryClient.invalidateQueries({ queryKey: ['availability'] });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      setEditingMeeting(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui meeting');
    },
  });

  const resolveHostKey = (accountId: number, fallback?: string | null) =>
    fallback || accounts.find((acc) => acc.id === accountId)?.host_key || '';
  const detailHostKey = detailMeeting
    ? resolveHostKey(
        detailMeeting.accountId,
        [...(schedules.live_meetings || []), ...(schedules.upcoming_meetings || []), ...(schedules.past_meetings || [])].find(
          (item) => item.account_id === detailMeeting.accountId && item.meeting_id === detailMeeting.meetingId
        )?.host_key
      )
    : '';

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
      <div className="meeting-list" data-meeting-state={type}>
        <div className="meeting-list-heading">
          <div><h2>{type === 'upcoming' ? 'Rapat mendatang' : type === 'live' ? 'Rapat berlangsung' : 'Riwayat rapat'}</h2>
            <p>{items.length} jadwal · Semua waktu dalam WIB</p></div>
          <span className="meeting-zone"><Clock size={14} aria-hidden="true" /> WIB</span>
        </div>
        <table className="meeting-table">
          <caption className="sr-only">Daftar meeting {type === 'upcoming' ? 'mendatang' : type === 'live' ? 'berlangsung' : 'selesai'}, waktu dalam WIB</caption>
          <thead><tr><th scope="col">Meeting</th><th scope="col">Jadwal · WIB</th><th scope="col">Akun & host</th><th scope="col" className="meeting-action-heading">Kelola</th></tr></thead>
          <tbody>
            {items.map((m) => (
              <tr key={meetingRowKey(m)}>
                <td className="meeting-subject">
                  <div className="meeting-symbol" aria-hidden="true">{type === 'live' ? <BrandIcon name="status_live" className="!w-[21px] !h-[21px]" /> : <Calendar size={21} />}</div>
                  <div className="meeting-subject-copy">
                    <span className="meeting-title">{m.topic}</span>
                    <div className="meeting-meta"><span>ID {m.meeting_id}</span><span className="meeting-kind">{isRecurringMeeting(m) && <Repeat size={12} aria-hidden="true" />}{isRecurringMeeting(m) ? 'Berulang' : 'Sekali'}</span></div>
                  </div>
                </td>
                <td data-label="Jadwal" className="meeting-time">
                  <strong>{formatWIBDateTime(m.start_time)}</strong>
                  <span>Sampai {formatWIBTime(m.end_time)} · {m.duration} menit</span>
                </td>
                <td data-label="Akun" className="meeting-account">
                  <strong>{m.account_name}</strong><span>{m.host || 'Host belum tersedia'}</span>
                </td>
                <td className="meeting-actions-cell">
                  <div className="meeting-actions">
                    {/* Details action */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetailMeeting({ accountId: m.account_id, meetingId: m.meeting_id })}
                      className="meeting-detail text-blue-600"
                      aria-label={`Detail meeting ${m.topic}`}
                      title="Lihat Detail"
                    >
                      <Info className="w-3.5 h-3.5" /><span>Detail</span>
                    </Button>
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
                          aria-label={`Edit meeting ${m.topic}`}
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
                          aria-label={`Hapus meeting ${m.topic}`}
                          title="Hapus meeting"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}


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
    <div className="schedule-page space-y-6">
      <PageBanner title="Jadwal rapat" description="Monitoring meeting yang berlangsung, agenda mendatang, dan riwayat rapat Pemerintah Provinsi Sumatera Utara." image="schedule_room.webp" />
      {schedules.upcoming_meetings?.some(isRecurringMeeting) && <p className="text-xs text-slate-500">Edit topik dan durasi untuk meeting berulang belum tersedia.</p>}

      <p className="min-h-10 sm:min-h-5 text-xs text-slate-500" role="status">
        {isError && dataUpdatedAt > 0 ? 'Pembaruan gagal. Jadwal terakhir tetap ditampilkan.' : isFetching && !isLoading ? 'Memperbarui jadwal…' : 'Diperbarui otomatis setiap 60 detik saat halaman aktif.'}
      </p>
      {isError && !dataUpdatedAt && <QueryError onRetry={() => refetch()} />}
      {/* Filter Bar Card */}
      <Card className="schedule-filters">
        <CardContent className="p-5">
          <form onSubmit={event => { event.preventDefault(); applyFilters(); }} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
            <div>
              <Label htmlFor="schedule_search" className="text-xs">Cari Topik Rapat</Label>
              <div className="relative">
                <Input
                  placeholder="Ketik topik rapat..."
                  id="schedule_search"
                  value={filter.search || ''}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  className="h-9 text-xs pl-8"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
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
      <Tabs defaultValue="upcoming" className="schedule-tabs space-y-5">
        <TabsList className="schedule-tab-list">
          <TabsTrigger value="live" className="schedule-tab-live text-xs font-semibold gap-2">
            <BrandIcon name="status_live" className="!w-3.5 !h-3.5 text-rose-700" />
            <span>Berlangsung <b>{schedules.live_meetings?.length || 0}</b></span>
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="schedule-tab-upcoming text-xs font-semibold gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>Mendatang <b>{schedules.upcoming_meetings?.length || 0}</b></span>
          </TabsTrigger>
          <TabsTrigger value="past" className="text-xs font-semibold gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Riwayat <b>{schedules.past_meetings?.length || 0}</b></span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <Card className="schedule-results">
            <CardContent className="p-0">
              {renderMeetingTable(schedules.live_meetings || [], 'live')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming">
          <Card className="schedule-results">
            <CardContent className="p-0">
              {renderMeetingTable(schedules.upcoming_meetings || [], 'upcoming')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past">
          <Card className="schedule-results">
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
              <Label htmlFor="schedule_topic" required>Topik Rapat</Label>
              <Input
                value={editTopic}
                id="schedule_topic"
                onChange={(e) => setEditTopic(e.target.value)}
                placeholder="Topik rapat..."
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
            <div className="min-w-0 space-y-3.5 py-2 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-slate-400 font-medium">Topik Agenda</span>
                <p className="text-sm font-bold text-slate-900 break-words">{zoomDetail.topic}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-slate-600 border-t border-slate-200">
                  <p>ID: <span className="font-mono font-semibold text-slate-900">{zoomDetail.id}</span></p>
                  <p>Durasi: <span className="font-semibold text-slate-900">{zoomDetail.duration} menit</span></p>
                  <p>Waktu Mulai: <span className="font-semibold text-slate-900">{formatWIBDateTime(zoomDetail.start_time)}</span></p>
                  <p>Status: <span className="font-semibold text-slate-900 capitalize">{zoomDetail.status}</span></p>
                </div>
              </div>

              {zoomDetail.join_url && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between gap-2 min-w-0">
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-blue-900 block">Tautan Join</span>
                    <span className="font-mono text-blue-700 break-all line-clamp-2 block">{zoomDetail.join_url}</span>
                  </div>
                  <CopyButton text={zoomDetail.join_url} label="Tautan disalin" className="shrink-0" />
                </div>
              )}

              {zoomDetail.password && (
                <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-between gap-2 min-w-0">
                  <div>
                    <span className="text-slate-500 block">Password Meeting</span>
                    <span className="font-mono font-bold text-slate-900">{zoomDetail.password}</span>
                  </div>
                  <CopyButton text={zoomDetail.password} label="Password disalin" className="shrink-0" />
                </div>
              )}

              {detailHostKey && (
                <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-between gap-2 min-w-0">
                  <div>
                    <span className="text-slate-500 block">Host Key Akun</span>
                    <span className="font-mono font-bold text-slate-900">{detailHostKey}</span>
                  </div>
                  <CopyButton text={detailHostKey} label="Host key disalin" className="shrink-0" />
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
