import React, { useState } from 'react';
import { PageBanner } from '@/components/shared/PageBanner';
import { QueryError } from '@/components/shared/QueryError';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { bookingsApi } from './bookings.api';
import { bookingSchema } from './bookingSchema';
import { recurringEndUTC, todayWIB } from './meetingSafety';
import { queryKeys } from '@/lib/queryClient';
import type {
  AvailabilityResult,
  BookMeetingRequest,
  BookingCreatedResponse,
} from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/StatusBadge';
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
  Search,
  CheckCircle2,
  CalendarPlus,
  AlertOctagon,
  ExternalLink,
  Repeat,
} from 'lucide-react';
import { toast } from 'sonner';

// Search Form Schema
const searchSchema = z.object({
  date: z.string().min(1, 'Pilih tanggal meeting'),
  start_time: z.string().min(1, 'Pilih waktu mulai'),
  duration: z.coerce.number().min(15, 'Durasi minimal 15 menit'),
});

type SearchFormData = z.infer<typeof searchSchema>;

type BookingFormData = z.infer<typeof bookingSchema>;

export const SearchBookingPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Search parameters state
  const [searchParams, setSearchParams] = useState<{
    date: string;
    start_time: string;
    duration: number;
  }>({
    date: todayWIB(),
    start_time: '10:00',
    duration: 60,
  });

  // Booking modal state
  const [selectedRoom, setSelectedRoom] = useState<AvailabilityResult | null>(null);
  const [successBooking, setSuccessBooking] = useState<BookingCreatedResponse | null>(null);

  // Search form
  const {
    register: registerSearch,
    handleSubmit: handleSearchSubmit,
    formState: { errors: searchErrors },
  } = useForm<z.input<typeof searchSchema>, unknown, SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: searchParams,
  });

  // Availability Query
  const {
    data: availability = [],
    isLoading,
    isFetching,
    refetch,
    isError,
  } = useQuery({
    queryKey: queryKeys.availability(searchParams),
    queryFn: () => bookingsApi.searchAvailability(searchParams),
  });

  // Booking form
  const {
    register: registerBook,
    handleSubmit: handleBookSubmit,
    control: bookingControl,
    reset: resetBook,
    formState: { errors: bookingErrors },
  } = useForm<z.input<typeof bookingSchema>, unknown, BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      topic: '',
      is_recurring: false,
      recurrence_type: 1,
      repeat_interval: 1,
      weekly_days: '2,3,4,5,6',
      ignore_conflict: false,
    },
  });

  const isRecurring = useWatch({ control: bookingControl, name: 'is_recurring' });

  // Book mutation
  const bookMutation = useMutation({
    mutationFn: bookingsApi.bookMeeting,
    onSuccess: (data) => {
      toast.success('Meeting berhasil di-booking via Zoom API!');
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      refetch();
      setSelectedRoom(null);
      setSuccessBooking(data);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal mem-booking meeting';
      toast.error(msg);
    },
  });

  const onSearch = (data: SearchFormData) => {
    setSearchParams(data);
  };

  const handleOpenBookModal = (room: AvailabilityResult) => {
    setSelectedRoom(room);
    resetBook({
      topic: '',
      is_recurring: false,
      recurrence_type: 1,
      repeat_interval: 1,
      weekly_days: '2,3,4,5,6',
      ignore_conflict: false,
    });
  };

  const onConfirmBooking = (formData: BookingFormData) => {
    if (!selectedRoom) return;

    const payload: BookMeetingRequest = {
      account_id: selectedRoom.account.id,
      booking_user_id: selectedRoom.booking_user_id,
      topic: formData.topic,
      date: searchParams.date,
      time: searchParams.start_time,
      duration: searchParams.duration,
      is_recurring: formData.is_recurring,
      recurrence_type: formData.is_recurring ? formData.recurrence_type : undefined,
      repeat_interval: formData.is_recurring ? formData.repeat_interval : undefined,
      weekly_days: formData.is_recurring ? formData.weekly_days : undefined,
      end_date_time: formData.is_recurring && formData.end_date_time ? recurringEndUTC(formData.end_date_time) : undefined,
      ignore_conflict: formData.ignore_conflict,
    };

    bookMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <PageBanner title="Rencanakan meeting Anda" description="Pilih waktu, temukan akun yang tersedia, lalu buat booking meeting." image="search_availability.webp" />

      {/* Search Parameters Card */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardContent className="p-5">
          <form onSubmit={handleSearchSubmit(onSearch)} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="booking_date" required>Tanggal Meeting</Label>
              <div className="relative">
                <Input
                  {...registerSearch('date')}
                  id="booking_date"
                  type="date"
                  error={searchErrors.date?.message}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="booking_time" required>Waktu Mulai (WIB)</Label>
              <Input
                {...registerSearch('start_time')}
                id="booking_time"
                type="time"
                error={searchErrors.start_time?.message}
              />
            </div>

            <div>
              <Label htmlFor="booking_duration" required>Durasi Meeting</Label>
              <select
                {...registerSearch('duration')}
                id="booking_duration"
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <option value={15}>15 Menit</option>
                <option value={30}>30 Menit</option>
                <option value={45}>45 Menit</option>
                <option value={60}>60 Menit (1 Jam)</option>
                <option value={90}>90 Menit (1.5 Jam)</option>
                <option value={120}>120 Menit (2 Jam)</option>
                <option value={180}>180 Menit (3 Jam)</option>
              </select>
            </div>

            <Button type="submit" isLoading={isFetching} className="h-10 bg-blue-600 hover:bg-blue-700">
              <Search className="w-4 h-4 mr-1.5" />
              <span>Cari Ketersediaan</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Availability Results Section */}
      {isError && <QueryError onRetry={() => refetch()} />}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <BrandIcon name="nav_search" className="!w-4 !h-4 text-blue-600" />
            <span>Hasil Pencarian ({availability.length} Akun Terdaftar)</span>
          </h2>
          <span className="text-xs text-slate-500">
            {searchParams.date} pukul {searchParams.start_time} WIB ({searchParams.duration} mnt)
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-5 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-10 w-full" />
              </Card>
            ))}
          </div>
        ) : availability.length === 0 && !isError ? (
          <Card className="p-12 text-center border-dashed">
            <img src="/icons/state_search.svg" alt="" className="w-40 h-24 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">Tidak ada akun Zoom yang ditemukan.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availability.map((item) => {
              const isAvail = item.status === 'AVAILABLE';
              const isBusy = item.status === 'BUSY';

              return (
                <Card
                  key={item.id}
                  className={`border transition-all shadow-xs ${
                    isAvail
                      ? 'border-emerald-200 bg-white hover:border-emerald-300'
                      : isBusy
                      ? 'border-rose-200 bg-white'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <CardContent className="p-5 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-base text-slate-900">
                            {item.account.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.email || item.user_name || 'Ruang Rapat'}
                          </p>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>

                      <div className="mt-4 p-3 rounded-lg text-xs min-h-[50px] flex items-center">
                        {isAvail ? (
                          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50/80 p-2.5 rounded-md w-full border border-emerald-200">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium">Ruang siap digunakan pada jam ini</span>
                          </div>
                        ) : isBusy ? (
                          <div className="text-rose-700 bg-rose-50/80 p-2.5 rounded-md w-full border border-rose-200">
                            <p className="font-semibold flex items-center gap-1.5">
                              <AlertOctagon className="w-3.5 h-3.5" />
                              <span>Bentrok dengan meeting lain:</span>
                            </p>
                            <p className="mt-1 font-medium text-rose-900">
                              "{item.conflicting_meeting?.topic || item.details}"
                            </p>
                            {item.conflicting_meeting && (
                              <p className="text-[11px] text-rose-600 mt-0.5">
                                Jam: {item.conflicting_meeting.start_time} - {item.conflicting_meeting.end_time} WIB
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-600 bg-slate-100 p-2.5 rounded-md w-full">
                            <p className="font-medium">{item.details}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100">
                      {isAvail ? (
                        <Button
                          onClick={() => handleOpenBookModal(item)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                          <CalendarPlus className="w-4 h-4 mr-1.5" />
                          <span>Pesan Ruang Ini</span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => handleOpenBookModal(item)}
                          className="w-full text-xs text-rose-700 hover:bg-rose-50 border-rose-200"
                        >
                          <span>Pesan Tetap (Force Booking)</span>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Form Modal */}
      <Dialog open={!!selectedRoom} onOpenChange={(open) => !open && setSelectedRoom(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reservasi Ruang Rapat</DialogTitle>
            <DialogDescription>
              {selectedRoom?.account.name} · {searchParams.date} pukul {searchParams.start_time} WIB ({searchParams.duration} menit)
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBookSubmit(onConfirmBooking)} className="space-y-4 py-2">
            <div>
              <Label htmlFor="booking_topic" required>Topik / Nama Agenda Rapat</Label>
              <Input
                {...registerBook('topic')}
                id="booking_topic"
                error={bookingErrors.topic?.message}
                aria-invalid={!!bookingErrors.topic}
                aria-describedby={bookingErrors.topic ? 'booking_topic-error' : undefined}
                placeholder="Contoh: Rapat Koordinasi Anggaran Q4"
                autoFocus
              />
            </div>

            {/* Recurring toggle */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-800">
                <input
                  type="checkbox"
                  {...registerBook('is_recurring')}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <Repeat className="w-4 h-4 text-blue-600" />
                <span>Jadikan Rapat Berulang (Recurring)</span>
              </label>

              {isRecurring && (
                <div className="space-y-3 pt-2 border-t border-slate-200 text-xs">
                  <div>
                    <Label htmlFor="recurrence_type">Tipe Pengulangan</Label>
                    <select
                      {...registerBook('recurrence_type')}
                      id="recurrence_type"
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900"
                    >
                      <option value={1}>Harian (Daily)</option>
                      <option value={2}>Mingguan (Weekly)</option>
                      <option value={3}>Bulanan (Monthly)</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="weekly_days">Hari Dalam Seminggu (Contoh: 2,3,4,5,6)</Label>
                    <Input
                      {...registerBook('weekly_days')}
                      id="weekly_days"
                      placeholder="2,3,4,5,6 (Senin-Jumat)"
                      className="h-8 text-xs"
                    />
                  </div>

                  <div>
                    <Label htmlFor="recurrence_end">Tanggal Selesai Berulang</Label>
                    <Input
                      {...registerBook('end_date_time')}
                      id="recurrence_end"
                      type="date"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Ignore conflict option */}
            <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600 p-2.5 rounded-lg bg-amber-50/60 border border-amber-200">
              <input
                type="checkbox"
                {...registerBook('ignore_conflict')}
                className="rounded border-amber-400 text-amber-600 focus:ring-amber-500 w-4 h-4 mt-0.5"
              />
              <span>
                <strong className="text-amber-900 block">Abaikan Konflik Jadwal (Force)</strong>
                Centang ini jika Anda ingin tetap mem-booking meskipun Zoom mendeteksi jadwal bentrok.
              </span>
            </label>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedRoom(null)}
              >
                Batal
              </Button>
              <Button type="submit" isLoading={bookMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                Konfirmasi Booking
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Booking Dialog */}
      <Dialog open={!!successBooking} onOpenChange={(open) => !open && setSuccessBooking(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-emerald-900">Reservasi Berhasil Dibuat!</DialogTitle>
                <DialogDescription className="text-emerald-700">
                  Meeting Zoom telah aktif dan terdaftar di server Zoom Cloud.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {successBooking && (
            <div className="space-y-3.5 py-2">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-xs text-slate-500">Topik Rapat</p>
                <p className="text-base font-bold text-slate-900">{successBooking.topic}</p>
                <p className="text-xs text-slate-600">
                  ID Rapat: <span className="font-mono font-semibold">{successBooking.id}</span>
                </p>
              </div>

              {/* Join URL */}
              <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-blue-900">Tautan Undangan (Join URL)</span>
                  <CopyButton text={successBooking.join_url} label="Tautan meeting disalin" />
                </div>
                <p className="text-xs text-blue-700 font-mono break-all line-clamp-2">
                  {successBooking.join_url}
                </p>
              </div>

              {/* Password & Host Key */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Password Rapat</span>
                    <span className="text-sm font-mono font-bold text-slate-900">
                      {successBooking.password}
                    </span>
                  </div>
                  <CopyButton text={successBooking.password} label="Password disalin" />
                </div>

                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Host Key</span>
                    <span className="text-sm font-mono font-bold text-slate-900">
                      {successBooking.host_key || '-'}
                    </span>
                  </div>
                  {successBooking.host_key && (
                    <CopyButton text={successBooking.host_key} label="Host Key disalin" />
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSuccessBooking(null)}
            >
              Tutup
            </Button>
            {successBooking?.join_url && (
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => window.open(successBooking.join_url, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-1.5" />
                <span>Buka Ruang Zoom</span>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
