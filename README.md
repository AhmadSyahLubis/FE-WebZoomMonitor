<img src="public/brand/sumatera-utara.png" alt="Lambang Pemerintah Provinsi Sumatera Utara" width="72" height="90" />

# Sistem Informasi Pengelolaan Virtual Meeting — Diskominfo Provinsi Sumatera Utara

Frontend web Dinas Komunikasi dan Informatika Provinsi Sumatera Utara untuk memantau akun Zoom instansi, mencari ketersediaan akun, memesan rapat daring, mengelola jadwal, dan mengakses rekaman. Identitas menggunakan lambang resmi Pemerintah Provinsi Sumatera Utara dengan warna antarmuka biru yang dipertahankan dari desain sebelumnya.

## Fitur

- **Dashboard:** ringkasan status akun, kapasitas, lisensi, detail aktivitas, serta pembaruan otomatis setiap 30 detik.
- **Akun Zoom:** pengelolaan akun Server-to-Server OAuth dan pemeriksaan koneksi melalui backend.
- **Pencarian dan booking:** tanggal dan jam WIB, durasi meeting, informasi bentrok jadwal, serta meeting tunggal atau berulang.
- **Jadwal:** filter akun, topik, dan tanggal; tab meeting berlangsung, mendatang, serta riwayat. Filter dijalankan saat tombol **Terapkan** ditekan.
- **Penghapusan recurring:** pilihan menghapus satu kejadian atau seluruh seri, dengan cakupan yang ditampilkan sebelum konfirmasi.
- **Rekaman:** pencarian sesi, daftar file, tautan berbagi, pemutaran, dan unduhan sesuai data serta izin dari backend dan Zoom.
- **Autentikasi:** login, pembaruan token, profil pengguna, dan pembersihan cache saat pergantian sesi.
- **Tampilan responsif:** sidebar pada desktop dan navigasi bawah pada perangkat mobile. Font dan gambar disimpan lokal.

**Batasan saat ini:** edit topik dan durasi meeting berulang dinonaktifkan sementara. Kontrak backend yang tersedia belum mendukung pengubahan satu kejadian atau pelestarian pola seri secara aman. Edit meeting tunggal tetap tersedia.

## Teknologi

React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router, TanStack Query, Zustand, Axios, React Hook Form, Zod, dan Radix UI. Tanggal dan waktu operasional menggunakan zona `Asia/Jakarta`.

Frontend ini membutuhkan backend API pengelolaan rapat daring yang menyediakan autentikasi dan integrasi Zoom. Kredensial Zoom dikelola melalui backend; aplikasi web tidak memanggil Zoom API langsung.

## Persiapan

- Node.js **24** dan npm. Pengujian proyek dilakukan dengan Node.js 24.18.0.
- Backend API pengelolaan rapat daring yang dapat diakses browser.
- Akun pengguna aplikasi yang sudah dibuat pada backend.

## Menjalankan secara lokal

```sh
git clone https://github.com/AhmadSyahLubis/FE-WebZoomMonitor.git
cd FE-WebZoomMonitor
npm ci
```

Salin konfigurasi contoh. Pada PowerShell:

```powershell
Copy-Item .env.example .env
```

Pada macOS atau Linux:

```sh
cp .env.example .env
```

Atur alamat backend di `.env`:

```dotenv
VITE_API_URL=http://localhost:8080/api/v1
```

Kemudian jalankan:

```sh
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000), lalu masuk dengan akun pengguna backend. Jika port 3000 sedang digunakan, ikuti alamat yang ditampilkan Vite.

## Konfigurasi API

| Variabel | Fungsi | Nilai default |
| --- | --- | --- |
| `VITE_API_URL` | Alamat dasar API, termasuk `/api/v1` | `http://localhost:8080/api/v1` |

`VITE_API_URL` merupakan konfigurasi lingkungan yang dibaca aplikasi saat ini. Variabel berawalan `VITE_` masuk ke bundle browser saat build, sehingga jangan digunakan untuk menyimpan Client Secret, token, atau kredensial lainnya. File `.env` lokal dikecualikan dari Git.

Backend perlu mengizinkan origin frontend pada konfigurasi CORS. Perubahan `.env` memerlukan restart server pengembangan atau build ulang. Untuk hosting HTTPS, gunakan alamat API HTTPS yang dapat dijangkau pengguna.

## Perintah

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Menjalankan server pengembangan |
| `npm run build` | Memeriksa TypeScript dan membuat bundle produksi di `dist/` |
| `npm run preview` | Memeriksa hasil build secara lokal |
| `npm run lint` | Memeriksa kode dengan Oxlint |
| `npm test` | Menjalankan tes regresi offline |

## Pengujian

```sh
npm test
npm run lint
npm run build
```

Tes regresi mencakup pergantian tanggal WIB, batas akhir recurring, format payload edit, validasi input, cakupan hapus, identitas sesi, isolasi cache antarlogin, penggunaan ulang cache, penggabungan permintaan yang sama, pembaruan latar belakang, pembatalan permintaan, dan sesi kedaluwarsa tanpa reload dokumen. Test runner memblokir permintaan `fetch`, HTTP, dan HTTPS. Tes ini tidak membuat, mengubah, atau menghapus meeting Zoom nyata.

Pengujian integrasi nyata harus menggunakan akun Zoom khusus pengujian dan meeting baru yang diberi penanda QA. Hapus hanya data uji yang dibuat selama pengujian. Lihat [catatan verifikasi](UI_VERIFICATION.md) untuk cakupan dan hasil pengujian terakhir.

## Cache dan pembaruan otomatis

- Dashboard diperbarui setiap 30 detik; jadwal setiap 60 detik, selama halaman terkait terbuka dan tab terlihat. Pembaruan mengambil data melalui API tanpa reload dokumen. Data lama tetap tampil selama pembaruan; skeleton hanya untuk pemuatan awal tanpa cache.
- Data akun dan profil dianggap segar selama 5 menit, rekaman 2 menit, dashboard 30 detik, dan jadwal 60 detik. Cache tersimpan di memori dan dibuang setelah tidak digunakan selama 15 menit. Reload browser memulai cache baru; logout atau login membersihkan cache sesi sebelumnya.
- Kembali ke tab tidak otomatis mengambil ulang data. Ketersediaan booking hanya diperiksa setelah menekan Cari, Coba lagi, atau setelah booking berhasil. Membuka halaman, kembali ke tab, koneksi pulih, dan invalidasi cache tidak memicu pencarian. Setiap pencarian manual mengambil hasil baru, termasuk untuk parameter yang sama. Form booking tetap mengandalkan validasi konflik dari backend.
- Perubahan meeting membatalkan kesegaran cache jadwal, dashboard, dan ketersediaan. Filter jadwal serta rekaman memakai cache terpisah berdasarkan parameter. Memuat filter baru yang belum memiliki cache tetap menampilkan pemuatan awal.
- Permintaan jadwal, ringkasan dashboard, dan rekaman menerima sinyal pembatalan agar permintaan yang tidak lagi dipakai dapat dihentikan. Refresh yang gagal mempertahankan data terakhir dan menampilkan keterangan kegagalan. Sesi kedaluwarsa menuju login melalui router tanpa reload penuh.

## Struktur proyek

```text
public/
  brand/                 Logo dan favicon
  fonts/                 Inter beserta lisensinya
  icons/                 Ikon dan ilustrasi keadaan kosong
  images/                Gambar halaman berformat WebP
src/
  components/
    layout/              Kerangka aplikasi dan navigasi
    shared/              Komponen bersama
    ui/                  Komponen antarmuka dasar
  features/
    accounts/            Pengelolaan akun Zoom
    auth/                Login, profil, dan sesi
    bookings/            Pencarian, booking, dan aturan keamanan meeting
    dashboard/           Monitoring akun
    recordings/          Arsip rekaman dan identitas sesi
    schedules/           Jadwal dan tindakan meeting
  lib/                   Klien API, query cache, dan utilitas
  router/                Rute publik dan rute terproteksi
  types/                 Tipe kontrak API
tests/                   Tes regresi offline dan pemblokir jaringan
```

## Rute aplikasi

| Rute | Halaman |
| --- | --- |
| `/login` | Login pengguna |
| `/dashboard` | Monitoring akun |
| `/accounts` | Pengelolaan akun Zoom |
| `/bookings/search` | Pencarian ketersediaan dan booking |
| `/schedules` | Jadwal meeting |
| `/recordings` | Rekaman meeting |
| `/profile` | Profil pengguna |

Semua halaman selain login memerlukan sesi pengguna. Backend tetap bertanggung jawab atas validasi token, izin, bentrok jadwal, serta komunikasi dengan Zoom.

## Build dan hosting

```sh
npm ci
npm run build
```

Publikasikan isi folder `dist/` ke hosting statis. Konfigurasikan fallback SPA ke `index.html` agar membuka langsung rute seperti `/schedules` tetap berfungsi. Build saat ini memakai jalur dasar `/` dan ditujukan untuk hosting pada root domain. `npm run preview` digunakan untuk pemeriksaan lokal hasil build.

## Dokumentasi desain dan aset

- [Arah desain](DESIGN.md)
- [Hasil QA dan batasan pengujian](UI_VERIFICATION.md)
- [Asal aset dan lisensi font](public/ASSET_SOURCES.md)

## Pembaruan autentikasi API

Web menggunakan token dalam memori tab dan kontrak sesi API yang baru. Reload meminta login kembali. Lihat [panduan integrasi autentikasi](docs/auth-v2-integration.md) untuk penyimpanan token, pembatasan refresh, HTTPS, dan urutan penerapan backend/frontend. Jangan menyimpan password atau secret backend pada variabel VITE.
