import { useEffect, useRef, useState } from 'react';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { invitationCalendar, invitationFilename, invitationSchedule, readableMeetingId, type InvitationData } from './invitationData';
import { invitationFailure, type InvitationStage } from './invitationErrors';
import { invitationContact } from './invitationBrand';

export function MeetingInvitationButton({ loadInvitation }: { loadInvitation: () => Promise<InvitationData> }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ data: InvitationData; url: string; qr: string } | null>(null);
  const epoch = useRef(0);
  const activeUrl = useRef('');
  const clear = () => {
    epoch.current++;
    if (activeUrl.current) URL.revokeObjectURL(activeUrl.current);
    activeUrl.current = '';
  };
  useEffect(() => () => { clear(); }, []);
  const changeOpen = (value: boolean) => {
    setOpen(value);
    if (!value) { clear(); setResult(null); setError(''); setBusy(false); }
  };
  const prepare = async () => {
    clear(); const current = epoch.current;
    setOpen(true); setBusy(true); setError(''); setResult(null);
    let stage: InvitationStage = 'meeting';
    try {
      const data = await loadInvitation();
      stage = 'module';
      const renderer = await import('./invitationPdf');
      stage = 'assets';
      const assets = await renderer.loadInvitationAssets();
      stage = 'qr';
      const qr = await renderer.invitationQrPreview(data);
      if (current !== epoch.current) return;
      stage = 'pdf';
      const bytes = renderer.createInvitationPdf(data, assets);
      stage = 'download';
      const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }));
      activeUrl.current = url; setResult({ data, url, qr });
    } catch (error) {
      if (current === epoch.current) setError(invitationFailure(error, stage));
    } finally { if (current === epoch.current) setBusy(false); }
  };
  const schedule = result && invitationSchedule(result.data);
  const calendar = result && invitationCalendar(result.data);
  return <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm" onClick={prepare}><FileDown className="h-4 w-4" aria-hidden="true" />Undangan PDF</Button></DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>Undangan rapat</DialogTitle><DialogDescription>Pratinjau informasi peserta yang disertakan dalam PDF.</DialogDescription></DialogHeader>
        {busy && <p role="status" className="py-8 text-center text-slate-700">Menyiapkan undangan dari data meeting terbaru...</p>}
        {error && <div role="alert" className="space-y-3 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900"><p>{error}</p><Button variant="outline" onClick={prepare}>Coba lagi</Button></div>}
        {result && schedule && calendar && <article className="overflow-hidden rounded-lg border border-slate-300 bg-[#fafcfe] text-slate-900">
          <header className="flex flex-wrap items-center justify-between gap-4 bg-[#102e59] p-5 text-white"><div className="flex items-center gap-3"><img src={`${import.meta.env.BASE_URL}brand/sumatera-utara.png`} alt="Lambang Provinsi Sumatera Utara" className="h-14 w-auto" /><p className="text-xs leading-relaxed">Pemerintah Provinsi<br /><strong className="text-sm">Sumatera Utara</strong></p></div><img src={`${import.meta.env.BASE_URL}brand/kolaborasi-sumut-berkah.png`} alt="Kolaborasi Sumut Berkah" className="h-auto w-28 object-contain" /></header>
          <div className="relative isolate overflow-hidden bg-[#173d72] px-5 py-7 text-white">
            <InvitationPattern className="absolute -right-8 -top-5 -z-10 h-44 w-44 text-[#31588b]" />
            <p className="mb-3 text-xs font-bold text-[#69d6e8]">UNDANGAN RAPAT DARING</p><h3 className="break-words text-2xl font-bold leading-tight">{result.data.topic}</h3>
          </div>
          <div className="relative isolate space-y-5 overflow-hidden p-5">
            <InvitationPattern className="absolute -bottom-16 -left-20 -z-10 h-72 w-72 text-[#e7eef6]" />
            <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3">
              <div aria-hidden="true" className="flex flex-col justify-center rounded-lg bg-[#102e59] px-2 py-3 text-white"><p className="text-[10px] font-bold uppercase text-[#69d6e8]">{calendar.weekday}</p><p className="my-1 text-4xl font-bold leading-none">{calendar.day}</p><p className="text-[10px] font-semibold">{calendar.monthYear}</p></div>
              <div className="flex flex-col justify-center gap-1 rounded-lg bg-[#edf3fa] p-3"><p className="text-[10px] font-bold text-slate-600">WAKTU RAPAT</p><p className="text-xs font-semibold">{schedule.date}</p><p className="text-sm font-bold sm:text-lg">{schedule.time}</p>{schedule.endDate && <p className="text-xs">Berakhir pada {schedule.endDate}</p>}</div>
            </div>
            <div className="grid items-center gap-4 rounded-lg bg-[#edf3fa] p-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
              <div className="space-y-3"><h4 className="text-lg font-bold">Zoom Meeting</h4><dl className="space-y-3"><div><dt className="text-[10px] font-bold text-slate-600">MEETING ID</dt><dd className="text-xl font-bold">{readableMeetingId(result.data.meetingId)}</dd></div><div><dt className="text-[10px] font-bold text-slate-600">PASSCODE</dt><dd className="break-all text-base font-bold">{result.data.passcode || 'Tidak tersedia'}</dd></div></dl><p className="text-xs leading-relaxed text-slate-600">Pindai QR atau gunakan tombol di PDF untuk bergabung.</p></div>
              <figure className="w-40 max-w-full justify-self-center"><img src={result.qr} alt="QR tautan peserta Zoom" className="h-auto w-full bg-white" /><figcaption className="mt-1 text-center text-[10px] text-slate-600">Pindai untuk bergabung</figcaption></figure>
            </div>
          </div>
          <footer className="space-y-1 bg-[#102e59] p-5 text-white"><p className="text-[10px] font-bold text-[#69d6e8]">PIC ZOOM MEETING</p><a href={`tel:${invitationContact.phone}`} className="inline-flex min-h-11 items-center rounded-sm text-2xl font-bold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">{invitationContact.phone}</a><p className="break-words text-sm">{invitationContact.name}</p></footer>
        </article>}
        <DialogFooter className="gap-2"><Button variant="outline" onClick={() => changeOpen(false)}>Tutup</Button>{result && <a href={result.url} download={invitationFilename(result.data)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#102e59] px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><FileDown className="h-4 w-4" aria-hidden="true" />Unduh PDF</a>}</DialogFooter>
      </DialogContent>
    </Dialog>;
}

function InvitationPattern({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 150 150" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="10" y="10" width="85" height="85" rx="28" /><rect x="50" y="50" width="85" height="85" rx="28" /></svg>;
}
