import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format ISO datetime string to Indonesian WIB date-time format
 */
export function formatWIBDateTime(dateString?: string | null): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date) + ' WIB';
  } catch {
    return dateString;
  }
}

/**
 * Format ISO datetime string to WIB Time only (HH:mm WIB)
 */
export function formatWIBTime(dateString?: string | null): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date) + ' WIB';
  } catch {
    return dateString;
  }
}

/**
 * Format bytes to readable size (KB, MB, GB)
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format seconds into HH:mm:ss or mm:ss
 */
export function formatDuration(seconds?: number): string {
  if (!seconds) return '0 mnt';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} mnt`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}j ${remainingMins}m`;
}
