import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { invitationCalendar, invitationSchedule, participantUrl, readableMeetingId, InvitationDataError, type InvitationData } from './invitationData';
import { invitationContact } from './invitationBrand';

export interface InvitationAssets { regular: string; bold: string; logo: Uint8Array; collaborationLogo: Uint8Array }
const base64 = (buffer: ArrayBuffer) => {
  let binary = '';
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
  return btoa(binary);
};
let assetsPromise: Promise<InvitationAssets> | undefined;
export function loadInvitationAssets(): Promise<InvitationAssets> {
  assetsPromise ??= Promise.all(['fonts/InterInvitation-Regular.ttf', 'fonts/InterInvitation-Bold.ttf', 'brand/sumatera-utara.png', 'brand/kolaborasi-sumut-berkah.png'].map(async path => {
    const response = await fetch(`${import.meta.env.BASE_URL}${path}`, { credentials: 'same-origin' });
    if (!response.ok) throw new Error('Aset undangan gagal dimuat. Silakan coba lagi.');
    return response.arrayBuffer();
  })).then(([regular, bold, logo, collaborationLogo]) => ({ regular: base64(regular), bold: base64(bold), logo: new Uint8Array(logo), collaborationLogo: new Uint8Array(collaborationLogo) })).catch(error => { assetsPromise = undefined; throw error; });
  return assetsPromise;
}

export function createInvitationPdf(data: InvitationData, assets: InvitationAssets): Uint8Array {
  participantUrl(data.joinUrl, data.meetingId);
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  doc.addFileToVFS('Invitation-Regular.ttf', assets.regular);
  doc.addFont('Invitation-Regular.ttf', 'InterInvitation', 'normal');
  doc.addFileToVFS('Invitation-Bold.ttf', assets.bold);
  doc.addFont('Invitation-Bold.ttf', 'InterInvitation', 'bold');
  doc.setProperties({ title: `Undangan rapat - ${data.topic}`, author: 'Pemerintah Provinsi Sumatera Utara', subject: 'Undangan rapat daring', creator: 'Sistem Informasi Pengelolaan Virtual Meeting' });
  const navy = '#102e59', blue = '#173d72', cyan = '#69d6e8', ink = '#142e4e', muted = '#465b73';
  const text = (value: string | string[], x: number, y: number, size: number, bold = false, color = ink) => {
    doc.setFont('InterInvitation', bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(color); doc.text(value, x, y);
  };
  doc.setFillColor('#fafcfe'); doc.rect(0, 0, 210, 297, 'F');
  const loops = (x: number, y: number, size: number, color: string) => {
    doc.setDrawColor(color); doc.setLineWidth(0.6);
    doc.roundedRect(x, y, size, size, size / 3, size / 3, 'S');
    doc.roundedRect(x + size * 0.48, y + size * 0.48, size, size, size / 3, size / 3, 'S');
  };
  loops(-35, 179, 58, '#e7eef6'); loops(186, 135, 46, '#e7eef6');
  doc.setFillColor(navy); doc.rect(0, 0, 210, 36, 'F');
  doc.addImage(assets.logo, 'PNG', 16, 7, 17.6, 22);
  text('PEMERINTAH PROVINSI', 39, 16, 9, false, '#ffffff');
  text('SUMATERA UTARA', 39, 24, 13, true, '#ffffff');
  doc.addImage(assets.collaborationLogo, 'PNG', 144, 13, 50, 50 * 108 / 496);
  let fontSize = 26;
  doc.setFont('InterInvitation', 'bold');
  const wrap = () => { doc.setFontSize(fontSize); return doc.splitTextToSize(data.topic, 178) as string[]; };
  let title = wrap();
  while (title.length * fontSize * 0.405 > 42 && fontSize > 13) { fontSize--; title = wrap(); }
  if (title.length * fontSize * 0.405 > 42) throw new InvitationDataError('Topik terlalu panjang untuk satu halaman undangan.');
  const heroEnd = Math.max(93, 66 + title.length * fontSize * 0.405);
  doc.setFillColor(blue); doc.rect(0, 36, 210, heroEnd - 36, 'F');
  loops(170, 43, 28, '#31588b');
  text('UNDANGAN RAPAT DARING', 16, 49, 9, true, cyan);
  text(title, 16, 64, fontSize, true, '#ffffff');
  doc.setFillColor(cyan); doc.rect(16, heroEnd, 30, 1.2, 'F');
  const y = heroEnd + 11;
  const schedule = invitationSchedule(data);
  const calendar = invitationCalendar(data);
  doc.setFillColor(navy); doc.roundedRect(16, y, 44, 44, 3, 3, 'F');
  text(calendar.weekday.toUpperCase(), 22, y + 9, 9, true, cyan);
  text(calendar.day, 22, y + 28, 36, true, '#ffffff');
  text(calendar.monthYear, 22, y + 38, 10, true, '#ffffff');
  doc.setFillColor('#edf3fa'); doc.roundedRect(65, y, 129, 44, 3, 3, 'F');
  text('WAKTU RAPAT', 72, y + 9, 9, true, muted);
  text(schedule.date, 72, y + 18, 11, true);
  text(schedule.time, 72, y + 29, 17, true);
  if (schedule.endDate) text(`Berakhir pada ${schedule.endDate}`, 72, y + 38, 9);
  const jy = y + 54;
  doc.setFillColor('#edf3fa'); doc.roundedRect(16, jy, 178, 76, 3, 3, 'F');
  text('Zoom Meeting', 23, jy + 12, 15, true);
  text('MEETING ID', 23, jy + 23, 8, true, muted);
  text(readableMeetingId(data.meetingId), 23, jy + 32, 20, true);
  text('PASSCODE', 23, jy + 43, 8, true, muted);
  doc.setFont('InterInvitation', 'bold'); doc.setFontSize(15);
  const passwordLines = doc.splitTextToSize(data.passcode || 'Tidak tersedia', 100) as string[];
  if (passwordLines.length > 2) throw new InvitationDataError('Passcode terlalu panjang untuk undangan.');
  text(passwordLines, 23, jy + 51, 14, true);
  doc.setFillColor(navy); doc.roundedRect(23, jy + 60, 83, 10, 2, 2, 'F');
  text('Buka Zoom Meeting', 31, jy + 66.7, 11, true, '#ffffff');
  doc.link(23, jy + 60, 83, 10, { url: data.joinUrl });
  // Draw modules directly so the QR remains sharp when printed or enlarged.
  const qr = QRCode.create(data.joinUrl, { errorCorrectionLevel: 'M' });
  const size = 58, qx = 131, qy = jy + 5, count = qr.modules.size, moduleSize = size / (count + 8);
  doc.setFillColor('#ffffff'); doc.rect(qx, qy, size, size, 'F');
  doc.setFillColor('#000000');
  for (let row = 0; row < count; row++) for (let col = 0; col < count; col++) {
    if (qr.modules.get(row, col)) doc.rect(qx + (col + 4) * moduleSize, qy + (row + 4) * moduleSize, moduleSize, moduleSize, 'F');
  }
  text('Pindai untuk bergabung', qx + 4, qy + 64, 8.5, false, muted);
  doc.setFillColor(navy); doc.rect(0, 258, 210, 39, 'F');
  text('PIC ZOOM MEETING', 16, 268, 9, true, cyan);
  text(invitationContact.phone, 16, 279, 20, true, '#ffffff');
  doc.link(16, 271, 65, 10, { url: `tel:${invitationContact.phone}` });
  text(invitationContact.name, 16, 289, 10, false, '#ffffff');
  return new Uint8Array(doc.output('arraybuffer'));
}

export const invitationQrPreview = (data: InvitationData) => QRCode.toString(data.joinUrl, { type: 'svg', margin: 4, errorCorrectionLevel: 'M' }).then(svg => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
