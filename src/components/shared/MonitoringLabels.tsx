import type { MeetingMonitoring } from '@/types/api';

export function MonitoringLabels({ monitoring, stale = false }: { monitoring?: MeetingMonitoring; stale?: boolean }) {
  if (stale) return <p className="mt-2 text-xs font-medium text-amber-800" role="status">Status belum terverifikasi; menunggu pembaruan</p>;
  if (!monitoring) return null;
  return <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Kondisi meeting">
    {monitoring.labels.map(label => <span key={label.code} className={`rounded-md border px-2 py-1 text-xs leading-relaxed ${['overtime', 'next_meeting_risk', 'schedule_overlap', 'ended_reserved', 'previously_live_reserved'].includes(label.code) ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>{label.text}</span>)}
  </div>;
}
