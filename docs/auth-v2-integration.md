# Integrasi autentikasi API v2

Web memakai login password ke API yang membatasi akun di backend. Tidak ada kredensial, secret JWT, atau keputusan role yang ditanamkan di frontend. Nilai pada localStorage, payload, dan header buatan pengguna tidak menjadi bukti izin API.

Access dan refresh token disimpan hanya dalam memori tab. Token/profile lama di localStorage dibuang, dan reload halaman meminta login kembali. Tab mempunyai ID sesi web yang berbeda agar dua tab tidak merotasi refresh token perangkat yang sama. Penyimpanan memori mengurangi persistensi token di browser; ini bukan perlindungan penuh terhadap skrip berbahaya yang sudah berjalan dalam halaman.

Hanya error `TOKEN_EXPIRED` memicu refresh. Permintaan bersamaan berbagi satu refresh, dan respons 401 lama memakai token baru yang sudah tersedia tanpa merotasi ulang. Retry dibatasi satu kali. Sesi dicabut/invalid, refresh gagal, atau sesi berubah mengakhiri akses lokal. Respons dari sebelum logout/login lain dibuang sebelum masuk ke cache UI. Tidak ada retry otomatis untuk permintaan yang sudah berhasil dijalankan server.

Logout membersihkan token dan seluruh query cache. Informasi user di UI hanya untuk tampilan; middleware backend memverifikasi JWT, sesi, dan akun pada setiap akses. Web tidak mengirim role atau identitas lewat header tambahan.

API production menggunakan `VITE_API_URL` HTTPS atau default same-origin `/api/v1`. Sediakan reverse proxy HTTPS ke API baru, serta origin dan CIDR proxy yang benar pada environment backend. Jangan menaruh password, JWT secret, atau kunci enkripsi di variabel `VITE_*`: semuanya akan tersedia di bundle browser.

Biometrik pada kontrak ini khusus aplikasi mobile dengan kunci platform. Web tetap memakai password; tidak ada simulasi biometrik berupa flag atau token statis.

Verifikasi offline: `npm test`, `npm run lint`, dan `npm run build`. Pengujian menghalangi HTTP eksternal dan memakai adapter lokal; tidak ada meeting Zoom yang diakses atau diubah. Penerapan backend/migrasi/secret masih perlu diselesaikan terpisah sebelum uji integrasi pada server.

## Gate UI perubahan ini

- Hard Gate PASS: preview login lokal diuji tanpa mengirim login ke API. Form kosong menampilkan kedua pesan wajib isi dan memfokuskan username. Tombol tampil/sembunyi password diuji dengan teks tiruan, lalu dibersihkan.
- Purpose Gate PASS: satu pesan tentang masa sesi ditambahkan pada form yang sudah ada. Struktur, palet, logo, dan kontrol yang sebelumnya dikerjakan dipertahankan.
- Liveliness PASS: desain existing ENERGY 1 / RHYTHM 2 / MOTION 1 dipertahankan; tidak ada elemen atau motion dekoratif baru.
- Quality PASS untuk perubahan web ini: 18 tes offline, lint, dan build production lulus. Preview desktop menunjukkan form, pesan validasi, dan tombol yang tetap terbaca. Pengujian API dengan adapter membuktikan single refresh, penolakan token localStorage buatan, penolakan URL luar, serta perlindungan dari respons sesudah logout.
