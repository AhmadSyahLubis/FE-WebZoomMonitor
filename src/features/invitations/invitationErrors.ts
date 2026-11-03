import { isAxiosError } from 'axios';
import { InvitationDataError } from './invitationData';

export type InvitationStage = 'meeting' | 'module' | 'assets' | 'qr' | 'pdf' | 'download';

export function invitationFailure(error: unknown, stage: InvitationStage): string {
  if (error instanceof InvitationDataError) return error.message;
  if (stage === 'meeting') {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 404) return 'Detail rapat tidak tersedia dari Zoom. Muat ulang Jadwal rapat dan pilih rapat yang masih tersedia. (UNDANGAN_DETAIL)';
      if (status === 401 || status === 403) return 'Akses detail rapat tidak diizinkan. Masuk kembali, lalu coba lagi. (UNDANGAN_AKSES)';
      if (status === 429) return 'Layanan sedang membatasi permintaan. Tunggu sebentar, lalu coba lagi. (UNDANGAN_BATAS)';
    }
    return 'Detail rapat gagal dimuat. Periksa koneksi ke aplikasi, lalu coba lagi. (UNDANGAN_DATA)';
  }
  const messages: Record<Exclude<InvitationStage, 'meeting'>, string> = {
    module: 'Pembuat PDF gagal dimuat. Muat ulang halaman, lalu buka undangan kembali. (UNDANGAN_MODUL)',
    assets: 'Logo atau font undangan gagal dimuat. Periksa koneksi, lalu coba lagi. (UNDANGAN_ASET)',
    qr: 'QR undangan gagal dibuat. Coba lagi atau muat ulang halaman. (UNDANGAN_QR)',
    pdf: 'PDF gagal dibuat di browser ini. Muat ulang halaman, lalu coba lagi. (UNDANGAN_PDF)',
    download: 'File undangan belum bisa disiapkan untuk diunduh. Coba lagi atau gunakan browser terbaru. (UNDANGAN_UNDUH)',
  };
  return messages[stage];
}
