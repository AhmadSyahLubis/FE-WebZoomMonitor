# Undangan rapat PDF di web

Tombol **Undangan PDF** tersedia di baris Jadwal rapat dan dialog booking berhasil. Tombol membuka pratinjau, lalu **Unduh PDF** menyimpan undangan A4 satu halaman. Fitur ini hanya diterapkan di web.

Isi undangan berasal dari pembacaan detail meeting terbaru melalui API terautentikasi yang sudah ada: topik, jadwal WIB, Meeting ID, passcode, serta tautan peserta. Untuk rapat berulang, tanggal dipilih berdasarkan `occurrence_id` pada baris jadwal. Undangan dari hasil booking memakai tanggal permintaan yang cocok dengan occurrence terbaru. Occurrence yang hilang atau dihapus menghasilkan pesan gagal, tanpa mengambil tanggal lain. Rapat tanpa waktu tetap belum dapat dibuatkan undangan.

QR dibuat lokal dengan `qrcode`, berisi tautan peserta asli termasuk parameter kode akses. Domain Zoom, HTTPS, jalur peserta, dan kesesuaian Meeting ID diperiksa. Tautan host dan parameter `zak` ditolak. PDF memiliki tautan peserta yang dapat diklik. Tidak ada layanan QR, gambar, atau font pihak ketiga saat pembuatan undangan. Header memakai lambang Pemprov Sumut dan logo Kolaborasi Sumut Berkah dari PNG transparan yang sudah ada di aplikasi, dengan proporsi asli. Font Inter lokal disertakan agar teks tetap dapat dipilih.

Model undangan memiliki daftar field eksplisit. Host key, start URL, token, dan informasi internal lain tidak diteruskan ke pembuat PDF. Data undangan hanya berada dalam memori komponen. URL unduhan sementara dibersihkan saat dialog ditutup atau komponen dilepas. Respons yang datang setelah penutupan diabaikan. Pembuatan PDF tidak mengubah meeting di Zoom dan tidak menambahkan endpoint backend.

## Desain dan verifikasi

Mengikuti `DESIGN.md`, ENERGY 1 / RHYTHM 2 / MOTION 1. Header biru tua memuat kedua logo. Bidang biru dengan judul putih menjadi fokus utama, lalu kalender tanggal dan kartu waktu diikuti akses Zoom. Aksen sian menandai label dokumen dan PIC. Pola garis yang saling terhubung mengikuti motif kolaborasi dan permintaan pengguna untuk memperkaya latar putih. Pola tidak memasuki bidang putih QR. Inter mengikuti aplikasi. Ikon unduh dokumen menunjukkan fungsi ekspor. Tidak ada ilustrasi, partner, nomor surat, atau klaim tambahan yang dibuat-buat.

Footer menampilkan PIC yang diberikan pengguna: **Sdr. Julfan Torang Pandopotan Malau, SAP**, nomor **087768670770**. Nomor menjadi tautan `tel:` pada PDF dan pratinjau, tanpa melakukan panggilan otomatis. Identitas PIC disimpan sekali di `invitationBrand.ts` dan dipakai oleh kedua tampilan agar isinya selalu sama.

- `npm run lint` dan `npm run build` lulus. `npm test`: 29 lulus, tidak ada yang dilewati pada lingkungan pengujian ini. Pengujian melarang jaringan.
- Pesan membedakan detail rapat, akses, batas permintaan, pemuatan modul, aset, QR, pembuatan PDF, dan penyiapan unduhan. Pesan mentah dari respons API atau exception tidak ditampilkan karena bisa memuat informasi sensitif. Kesalahan validasi yang ditulis aplikasi tetap ditampilkan secara spesifik.
- Tes mencakup pembacaan data terbaru, batas hari WIB, pilihan occurrence, jadwal tidak lengkap, domain palsu, URL host, serta pemindaian QR dari PNG hasil render PDF. Pemeriksaan teks memastikan ID, passcode, dan tanggal tampil, tanpa field host. Metadata dan URI PDF juga diperiksa dengan pypdf.
- PDF dirender dengan Poppler dan diperiksa secara visual untuk topik normal maupun panjang, passcode kosong, dan jadwal lintas tengah malam. Contoh fiktif tersimpan di `output/pdf/contoh-undangan-simulasi.pdf`. Desain terbaru diperiksa memiliki satu halaman, dua logo asli, tautan peserta asli, teks PIC sesuai permintaan, dan URI `tel:087768670770`. QR hasil render tetap berhasil dibaca.
- Browser diuji melalui `tests/invitation-preview.html`, termasuk tombol dari halaman jadwal asli dengan API tiruan, unduhan PDF, pesan gagal, coba lagi, Tutup, Escape, dan pengembalian fokus ke tombol pemicu. Pada viewport 360 x 800, lebar isi dialog sama dengan lebar gulirnya (311 px), tanpa luapan horizontal. Dialog dapat digulir.
- `docs/invitation-preview.png` adalah bukti tampilan web memakai data simulasi. Tidak ada meeting Zoom nyata yang dibuat, diubah, dihapus, atau diakhiri.
- Gate antislop untuk perubahan ini lulus: isi punya sumber, kontras teks utama/navy dan putih terjaga, kontrol punya keadaan muat/gagal/berhasil, fokus keyboard kembali ke pemicu, tampilan sempit diperiksa, dan tombol unduh diuji sampai file tersimpan.

## Dependensi

Jalankan `npm ci` sebelum build pada lingkungan lain. `jspdf` dan `qrcode` dimuat saat undangan diminta. Aset font yang baru dimuat bersama pembuat PDF berasal dari Inter berlisensi OFL yang sudah ada di proyek. `follow-redirects` juga diperbarui melalui lockfile untuk menutup temuan audit. Audit dependensi produksi menunjukkan 0 kerentanan yang diketahui pada saat pemeriksaan.

`npm test` menggunakan `jsqr` dan `pngjs` untuk membaca QR dari hasil render. Pemeriksaan render PDF memerlukan `pdfinfo`, `pdftoppm`, dan `pdftotext` (Poppler) pada PATH. Jika alat tersebut tidak tersedia, hanya pemeriksaan render yang dilewati dengan pesan yang jelas. Pemeriksaan data dan URL tetap berjalan.

Untuk uji browser tanpa Zoom, jalankan server Vite lalu buka `/tests/invitation-preview.html`. Fixture menolak seluruh permintaan API dan hanya mengizinkan pembacaan aset undangan lokal. Data simulasi tidak dapat dipakai sebagai undangan rapat nyata.
