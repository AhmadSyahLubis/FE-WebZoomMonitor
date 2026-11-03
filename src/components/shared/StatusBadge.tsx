import { cn } from '@/lib/utils';
import type { AccountStatus } from '@/types/api';
import { AlertTriangle } from 'lucide-react';
import { BrandIcon } from './BrandIcon';

interface StatusBadgeProps {
  status: AccountStatus | 'AVAILABLE' | 'BUSY' | 'ERROR';
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const normalized = status.toLowerCase();
  const kind = normalized === 'busy' ? 'meeting' : normalized;
  const details = {
    available: { label: 'Tersedia', icon: 'status_available' },
    meeting: { label: 'Sedang meeting', icon: 'status_busy' },
    scheduled: { label: 'Terjadwal', icon: 'nav_calendar' },
    error: { label: 'Belum terverifikasi', icon: '' },
  }[kind] || { label: 'Tidak terhubung', icon: '' };
  return <span className={cn(`status-${kind} inline-flex shrink-0 items-center gap-1.5 border px-2.5 py-1 rounded-lg text-[11px] font-semibold`, className)}>{showIcon && (details.icon ? <BrandIcon name={details.icon} className="!w-3.5 !h-3.5" /> : <AlertTriangle size={13} aria-hidden="true" />)}<span>{details.label}</span></span>;
}
