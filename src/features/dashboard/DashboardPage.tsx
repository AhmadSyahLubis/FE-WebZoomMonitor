import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { RotateCcw, AlertTriangle, KeyRound, Users, Clock, ChevronRight } from 'lucide-react';
import { dashboardApi } from './dashboard.api';
import { queryKeys } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CopyButton } from '@/components/shared/CopyButton';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { PageBanner } from '@/components/shared/PageBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

export function DashboardPage() {
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const { data: accounts = [], isLoading, isRefetching, refetch, isError, dataUpdatedAt } = useQuery({ queryKey: queryKeys.dashboard, queryFn: ({ signal }) => dashboardApi.getSummary(signal), refetchInterval: 30000 });
  const statusQuery = useQuery({ queryKey: selectedAccountId ? queryKeys.dashboardStatus(selectedAccountId) : ['dashboardStatus', 0], queryFn: () => dashboardApi.getStatus(selectedAccountId!), enabled: selectedAccountId !== null });
  const specsQuery = useQuery({ queryKey: selectedAccountId ? queryKeys.dashboardSpecs(selectedAccountId) : ['dashboardSpecs', 0], queryFn: () => dashboardApi.getSpecs(selectedAccountId!), enabled: selectedAccountId !== null });
  const selectedAccount = accounts.find(account => account.id === selectedAccountId);
  const stats = [
    { label: 'Total akun', value: accounts.length, icon: 'nav_accounts', status: '' },
    { label: 'Tersedia', value: accounts.filter(account => account.status === 'available').length, icon: 'status_available', status: 'available' },
    { label: 'Sedang meeting', value: accounts.filter(account => account.status === 'meeting').length, icon: 'status_busy', status: 'meeting' },
    { label: 'Terjadwal', value: accounts.filter(account => account.status === 'scheduled').length, icon: 'nav_calendar', status: 'scheduled' },
    { label: 'Perlu diperiksa', value: accounts.filter(account => account.status === 'error').length, icon: 'status_secure', status: 'error' },
  ];
  const handleRefresh = async () => {
    setManualRefreshing(true);
    try {
      const result = await refetch({ cancelRefetch: false });
      if (result.isError) toast.error('Status belum dapat diperbarui. Coba lagi.');
      else toast.success('Status akun berhasil diperbarui');
    } finally {
      setManualRefreshing(false);
    }
  };
  return (
    <div className="space-y-6">
      <PageBanner title="Monitoring virtual meeting" description="Monitoring akun Zoom dan agenda meeting untuk kebutuhan Pemerintah Provinsi Sumatera Utara." image="meeting_console_hero.webp"><Link className="banner-action" to="/bookings/search"><BrandIcon name="nav_search" className="!w-4 !h-4" />Cari akun tersedia</Link></PageBanner>
      <div className="dashboard-toolbar"><div><h2>Ringkasan akun</h2><p role="status">{isError && dataUpdatedAt > 0 ? 'Pembaruan gagal. Status terakhir tetap ditampilkan' : 'Diperbarui otomatis setiap 30 detik'}{dataUpdatedAt > 0 && <> · Terakhir {new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }).format(dataUpdatedAt)} WIB</>}</p></div><Button variant="outline" size="sm" onClick={handleRefresh} isLoading={manualRefreshing} disabled={isRefetching}><RotateCcw size={14} />Perbarui status</Button></div>
      <div className="stats-grid" aria-label="Ringkasan status akun">
        {stats.map(stat => <div className={`stat-item stat-${stat.status}`} key={stat.label}><div><span>{stat.label}</span><BrandIcon name={stat.icon} /></div>{isLoading ? <Skeleton className="h-8 w-12" /> : <strong>{isError && !dataUpdatedAt ? '–' : stat.value}</strong>}</div>)}
      </div>
      {isError && !dataUpdatedAt && <div role="alert" className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-rose-200 bg-rose-50"><div className="flex items-center gap-3"><AlertTriangle size={20} className="text-rose-700 shrink-0" /><div><p className="font-semibold text-sm text-rose-700">Status akun belum dapat dimuat</p><p className="text-xs text-rose-700 mt-1">Periksa koneksi, lalu coba perbarui status.</p></div></div><Button variant="outline" size="sm" isLoading={isRefetching} onClick={() => refetch()}>Coba lagi</Button></div>}
      <section aria-labelledby="account-status-title" className="space-y-4">
        <div className="flex items-center justify-between gap-3"><h2 id="account-status-title" className="text-base font-semibold">Status akun Zoom</h2><Link to="/accounts" className="text-xs font-medium text-blue-600 inline-flex items-center gap-1 min-h-11">Kelola akun<ChevronRight size={14} /></Link></div>
        {isLoading ? <div role="status" aria-label="Memuat status akun" className="grid grid-cols-1 xl:grid-cols-3 sm:grid-cols-2 gap-4">{[1, 2, 3].map(i => <Card key={i} className="p-5 space-y-4"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-16 w-full" /><Skeleton className="h-8 w-full" /></Card>)}</div> : accounts.length === 0 ? !isError && <Card className="p-8 text-center"><img src="/icons/state_accounts.svg" alt="" className="w-44 h-28 object-contain mx-auto mb-4" /><h3 className="text-sm font-semibold">Belum ada akun Zoom</h3><p className="mt-2 text-xs text-slate-500">Tambahkan akun instansi untuk mulai memantau meeting.</p><Link to="/accounts" className="inline-flex min-h-11 items-center mt-4 px-4 rounded-xl bg-blue-600 text-white text-xs font-medium">Kelola akun Zoom</Link></Card> : <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map(account => <Card key={account.id} className="account-card p-5">
            <div className="flex items-start justify-between gap-2"><div className="w-10 h-10 flex items-center justify-center bg-blue-50 rounded-xl text-blue-600"><BrandIcon name="nav_accounts" /></div><StatusBadge status={account.status} /></div>
            <h3 className="mt-4 text-base font-semibold break-words">{account.account_name}</h3><p className="text-xs text-slate-500 mt-1 break-all">{account.email || 'Email belum diatur'}</p>
            <div className={`account-activity status-${account.status} mt-4 p-3 rounded-xl min-h-20`}><p className="text-[11px]">{account.status === 'meeting' ? 'Rapat berlangsung' : account.status === 'scheduled' ? 'Agenda berikutnya' : 'Aktivitas akun'}</p><p className="text-xs font-medium mt-1.5 break-words">{account.current_topic || (account.status === 'available' ? 'Siap untuk meeting berikutnya' : account.status === 'error' ? 'Koneksi akun perlu diperiksa' : 'Belum ada informasi topik')}</p></div>
            <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 mt-4"><span className="flex items-center gap-1.5"><Users size={13} />{account.meeting_capacity || '–'} peserta</span><span>{account.plan_type || 'Lisensi belum diketahui'}</span></div>
            {account.host_key && <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500"><span className="flex items-center gap-1.5"><KeyRound size={13} />Host key: <span className="font-mono text-slate-900">{account.host_key}</span></span><CopyButton text={account.host_key} label="Host key disalin" /></div>}
            <button className="account-card-trigger border-t border-slate-200 mt-3" onClick={() => setSelectedAccountId(account.id)} aria-label={`Lihat detail ${account.account_name}`}>Lihat detail akun<ChevronRight size={15} className="ml-auto" /></button>
          </Card>)}
        </div>}
      </section>
      <Dialog open={selectedAccountId !== null} onOpenChange={open => { if (!open) setSelectedAccountId(null); }}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{selectedAccount?.account_name || 'Detail akun'}</DialogTitle><DialogDescription>{selectedAccount?.email || 'Status dan kapasitas akun Zoom'}</DialogDescription></DialogHeader>
          {statusQuery.isLoading || specsQuery.isLoading ? <div role="status" aria-label="Memuat detail akun" className="space-y-3 py-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-20 w-full" /></div> : <div className="space-y-4 mt-2">
            {(statusQuery.isError || specsQuery.isError) && <div role="alert" className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs"><p>Detail terbaru belum dapat dimuat.</p><Button variant="outline" size="sm" className="mt-2" onClick={() => { statusQuery.refetch(); specsQuery.refetch(); }}>Coba lagi</Button></div>}
            <div className="flex justify-between gap-3"><span className="text-sm text-slate-500">Status akun</span>{selectedAccount && <StatusBadge status={statusQuery.data?.status || selectedAccount.status} />}</div>
            <div className="p-4 rounded-xl bg-slate-50"><p className="text-xs text-slate-500">Topik rapat</p><p className="mt-2 text-sm font-medium break-words">{statusQuery.data?.topic || selectedAccount?.current_topic || 'Tidak ada topik meeting aktif'}</p>{statusQuery.data?.host_name && <p className="mt-2 text-xs text-slate-500">Host: {statusQuery.data.host_name}</p>}{(statusQuery.data?.start_time || statusQuery.data?.end_time) && <p className="mt-3 flex items-center gap-2 text-xs"><Clock size={14} />{statusQuery.data.start_time || '–'} – {statusQuery.data.end_time || '–'} WIB</p>}</div>
            <div className="grid grid-cols-2 gap-3 p-4 bg-blue-50 rounded-xl text-xs"><div><p className="text-slate-500">Kapasitas</p><p className="mt-1 font-semibold">{specsQuery.data?.meeting_capacity ?? selectedAccount?.meeting_capacity ?? '–'} peserta</p></div><div><p className="text-slate-500">Lisensi</p><p className="mt-1 font-semibold">{specsQuery.data?.plan_type || selectedAccount?.plan_type || 'Belum diketahui'}</p></div></div>
            {selectedAccount?.host_key && <div className="flex items-center justify-between text-sm"><span>Host key: <span className="font-mono">{selectedAccount.host_key}</span></span><CopyButton text={selectedAccount.host_key} /></div>}
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
