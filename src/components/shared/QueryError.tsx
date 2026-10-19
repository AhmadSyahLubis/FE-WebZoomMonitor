import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QueryError({ onRetry }: { onRetry: () => void }) {
  return <div role="alert" className="flex flex-wrap items-center justify-between gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700"><div className="flex items-center gap-3"><AlertCircle size={20} className="shrink-0" /><div><p className="text-sm font-semibold">Data belum dapat dimuat</p><p className="text-xs mt-1">Periksa koneksi Anda, lalu coba lagi.</p></div></div><Button variant="outline" size="sm" onClick={onRetry}>Coba lagi</Button></div>;
}
