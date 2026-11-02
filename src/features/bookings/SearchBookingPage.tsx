import React, { useState, useMemo } from 'react';
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
  Calendar,
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

const availabilityOptions = (params: SearchFormData) => ({
  queryKey: queryKeys.availability(params),
  queryFn: ({ signal }: { signal: AbortSignal }) => bookingsApi.searchAvailability(params, signal),
});

export const SearchBookingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [hasSearched, setHasSearched] = useState(false);

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
    data: availabilityData = [],
    isLoading,
    isFetching,
    refetch,
    isError,
  } = useQuery({
    ...availabilityOptions(searchParams),
  });
  const availability = hasSearched ? availabilityData : [];

  // Booking form
  const {
    register: registerBook,
    handleSubmit: handleBookSubmit,
    control: bookingControl,
    reset: resetBook,
    setValue: setBookValue,
    formState: { errors: bookingErrors },
  } = useForm<z.input<typeof bookingSchema>, unknown, BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      topic: '',
      is_recurring: false,
      recurrence_type: 1,
      repeat_interval: 1,
      weekly_days: '',
      end_date_time: '',
      ignore_conflict: false,
    },
  });

  const [recurrencePattern, setRecurrencePattern] = useState<'daily' | 'workday' | 'weekly' | 'monthly'>('daily');

  const isRecurring = useWatch({ control: bookingControl, name: 'is_recurring' });
  const weeklyDays = useWatch({ control: bookingControl, name: 'weekly_days' });
  const endDateTime = useWatch({ control: bookingControl, name: 'end_date_time' });

  const handlePatternChange = (pattern: 'daily' | 'workday' | 'weekly' | 'monthly') => {
    setRecurrencePattern(pattern);
    if (pattern === 'daily') {
      setBookValue('recurrence_type', 1, { shouldValidate: true });
      setBookValue('weekly_days', '', { shouldValidate: true });
    } else if (pattern === 'workday') {
      setBookValue('recurrence_type', 2, { shouldValidate: true });
      setBookValue('weekly_days', '2,3,4,5,6', { shouldValidate: true });
    } else if (pattern === 'weekly') {
      setBookValue('recurrence_type', 2, { shouldValidate: true });
      const jsDay = new Date(`${searchParams.date}T00:00:00`).getDay();
      const zoomDay = jsDay === 0 ? '1' : String(jsDay + 1);
      setBookValue('weekly_days', zoomDay, { shouldValidate: true });
    } else if (pattern === 'monthly') {
      setBookValue('recurrence_type', 3, { shouldValidate: true });
      setBookValue('weekly_days', '', { shouldValidate: true });
    }
  };

  const toggleWeeklyDay = (dayId: string) => {
    const current = (weeklyDays || '').split(',').filter(Boolean);
    const next = current.includes(dayId)
      ? current.filter((d) => d !== dayId)
      : [...current, dayId];
    const sorted = ['2', '3', '4', '5', '6', '7', '1'].filter((d) => next.includes(d));
    setBookValue('weekly_days', sorted.join(','), { shouldValidate: true });
  };

  const estimatedSessions = useMemo(() => {
    if (!isRecurring || !endDateTime) return null;
    const start = new Date(`${searchParams.date}T00:00:00`);
    const end = new Date(`${endDateTime}T00:00:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;

    if (recurrencePattern === 'daily') {
      const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return diff + 1;
    }

    if (recurrencePattern === 'workday') {
      let count = 0;
      const cur = new Date(start);
      while (cur <= end) {
        const day = cur.getDay();
        if (day >= 1 && day <= 5) count++;
        cur.setDate(cur.getDate() + 1);
      }
      return count;
    }

    if (recurrencePattern === 'weekly') {
      const selected = (weeklyDays || '').split(',').filter(Boolean);
      if (selected.length === 0) return 0;
      let count = 0;
      const cur = new Date(start);
      while (cur <= end) {
        const jsDay = cur.getDay();
        const zoomDay = jsDay === 0 ? '1' : String(jsDay + 1);
        if (selected.includes(zoomDay)) count++;
        cur.setDate(cur.getDate() + 1);
      }
      return count;
    }

    if (recurrencePattern === 'monthly') {
      let count = 0;
      const cur = new Date(start);
      while (cur <= end) {
        count++;
        cur.setMonth(cur.getMonth() + 1);
      }
      return count;
    }

    return null;
  }, [isRecurring, endDateTime, recurrencePattern, weeklyDays, searchParams.date]);

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
    setHasSearched(true);
    setSearchParams(data);
    void queryClient.fetchQuery(availabilityOptions(data)).catch(() => undefined);
  };

  const handleOpenBookModal = (room: AvailabilityResult) => {
    setSelectedRoom(room);
    setRecurrencePattern('daily');
    resetBook({
      topic: '',
      is_recurring: false,
      recurrence_type: 1,
      repeat_interval: 1,
      weekly_days: '',
      end_date_time: '',
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
      weekly_days: formData.is_recurring && formData.recurrence_type === 2 ? (formData.weekly_days || undefined) : undefined,
      end_date_time: formData.is_recurring && formData.end_date_time ? recurringEndUTC(formData.end_date_time) : undefined,
      ignore_conflict: formData.ignore_conflict,
    };

    bookMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <PageBanner title="Booking virtual meeting" description="Pilih jadwal dan akun Zoom untuk kebutuhan meeting Pemerintah Provinsi Sumatera Utara." image="search_availability.webp" />

      {/* Search Parameters Card */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardContent className="p-5">
          <form onSubmit={handleSearchSubmit(onSearch)} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="booking_date" required>Tanggal Rapat</Label>
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
              <Label htmlFor="booking_duration" required>Durasi Rapat</Label>
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
      {hasSearched && isError && <QueryError onRetry={() => refetch()} />}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <BrandIcon name="nav_search" className="!w-4 !h-4 text-blue-600" />
            <span>Hasil pencarian{hasSearched && ` (${availability.length} akun)`}</span>
          </h2>
          <span className="text-xs text-slate-500">
            {hasSearched && <>{searchParams.date} pukul {searchParams.start_time} WIB ({searchParams.duration} mnt)</>}
          </span>
        </div>

        {!hasSearched ? (
          <Card className="p-10 text-center">
            <img src="/icons/state_search.svg" alt="" className="w-40 h-24 mx-auto mb-3" />
            <p className="text-slate-800 font-semibold">Cari akun untuk jadwal meeting Anda</p>
            <p className="text-xs text-slate-500 mt-2">Pilih tanggal, waktu, dan durasi, lalu tekan Cari Ketersediaan.</p>
          </Card>
        ) : isLoading ? (
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
              const isLive = isBusy && !!item.live_meeting;
              const conflict = item.conflicting_meeting || item.live_meeting || item.scheduled_now;

              return (
                <Card
                  key={item.id}
                  className={`border transition-all shadow-xs ${
                    isAvail
                      ? 'border-emerald-200 bg-white hover:border-emerald-300'
                      : isLive
                      ? 'border-rose-200 bg-white'
                      : isBusy
                      ? 'border-amber-200 bg-white'
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
                        <StatusBadge status={isBusy ? (isLive ? 'meeting' : 'scheduled') : item.status} />
                      </div>

                      <div className="mt-4 p-3 rounded-lg text-xs min-h-[50px] flex items-center">
                        {isAvail ? (
                          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50/80 p-2.5 rounded-md w-full border border-emerald-200">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium">Ruang siap digunakan pada jam ini</span>
                          </div>
                        ) : isBusy ? (
                          <div className={`p-2.5 rounded-md w-full border ${isLive ? 'status-meeting' : 'status-scheduled'}`}>
                            <p className="font-semibold flex items-center gap-1.5">
                              <AlertOctagon className="w-3.5 h-3.5" />
                              <span>{isLive ? 'Akun sedang live meeting:' : 'Bentrok dengan jadwal meeting:'}</span>
                            </p>
                            <p className="mt-1 font-medium">
                              "{conflict?.topic || item.details}"
                            </p>
                            {conflict && (
                              <p className="text-[11px] mt-0.5">
                                Jam: {conflict.start_time} - {conflict.end_time} WIB
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
                          disabled={isFetching || isError}
                          onClick={() => handleOpenBookModal(item)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                          <CalendarPlus className="w-4 h-4 mr-1.5" />
                          <span>Booking Akun Ini</span>
                        </Button>
                      ) : (
                        <Button
                          variant={isLive ? 'destructive' : isBusy ? 'warning' : 'outline'}
                          disabled={isFetching || isError}
                          onClick={() => handleOpenBookModal(item)}
                          className={`w-full text-xs font-semibold ${!isBusy ? 'text-slate-600 hover:bg-slate-100 border-slate-500' : ''}`}
                        >
                          <span>Tetap Booking (Force Booking)</span>
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
                    <Label htmlFor="recurrence_pattern">Pola Pengulangan</Label>
                    <select
                      id="recurrence_pattern"
                      value={recurrencePattern}
                      onChange={(e) => handlePatternChange(e.target.value as any)}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900"
                    >
                      <option value="daily">Setiap Hari (Senin – Minggu)</option>
                      <option value="workday">Hari Kerja (Senin – Jumat)</option>
                      <option value="weekly">Hari Tertentu dalam Seminggu</option>
                      <option value="monthly">Bulanan</option>
                    </select>
                  </div>

                  {recurrencePattern === 'workday' && (
                    <div className="p-2.5 rounded-md bg-blue-50/70 border border-blue-100 text-[11px] text-blue-800">
                      Rapat otomatis dijadwalkan setiap <strong>Senin sampai Jumat</strong> hingga tanggal selesai.
                    </div>
                  )}

                  {recurrencePattern === 'weekly' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Pilih Hari Rapat</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: '2', label: 'Sen' },
                          { id: '3', label: 'Sel' },
                          { id: '4', label: 'Rab' },
                          { id: '5', label: 'Kam' },
                          { id: '6', label: 'Jum' },
                          { id: '7', label: 'Sab' },
                          { id: '1', label: 'Min' },
                        ].map((day) => {
                          const active = (weeklyDays || '').split(',').includes(day.id);
                          return (
                            <button
                              key={day.id}
                              type="button"
                              onClick={() => toggleWeeklyDay(day.id)}
                              className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                                active
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                      {bookingErrors.weekly_days && (
                        <p className="text-[11px] text-rose-600 mt-1">{bookingErrors.weekly_days.message}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="recurrence_end" required>Tanggal Selesai Berulang</Label>
                    <Input
                      {...registerBook('end_date_time')}
                      id="recurrence_end"
                      min={searchParams.date}
                      error={bookingErrors.end_date_time?.message}
                      aria-invalid={!!bookingErrors.end_date_time}
                      type="date"
                      className="h-8 text-xs"
                    />
                  </div>

                  {estimatedSessions !== null && (
                    <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        {estimatedSessions === 0 ? (
                          <span className="text-rose-600 font-medium">
                            Tanggal selesai harus sama atau setelah tanggal mulai ({searchParams.date}).
                          </span>
                        ) : (
                          <span>
                            Estimasi: <strong>{estimatedSessions} sesi rapat</strong> akan dijadwalkan pukul{' '}
                            <strong>{searchParams.start_time} WIB</strong>.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Ignore conflict option */}
            <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600 p-2.5 rounded-lg bg-amber-50/60 border border-amber-200">
              <input
                type="checkbox"
                {...registerBook('ignore_conflict')}
                className="rounded border-amber-200 text-amber-600 focus:ring-amber-500 w-4 h-4 mt-0.5"
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
