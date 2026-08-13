# Prototype Booking Management Webapp

_Started 2026-08-13 08:30 UTC_

---

## User

aku ingin membuat prototype webapp booking management untuk mengelola booking dari beberapa homestay milik client, untuk layout dan tampilan selain mengikuti guidelines dari prd liat juga dari gambar referensi yang saya upload

## Assistant



## Assistant

I'll read the PRD first.

_[tool: read_file]_

_[tool: ask_user]_

Menunggu jawaban formnya — terutama layar mana saja yang perlu dibuat dan seberapa interaktif prototypenya.

## User

Answered — screens: Kalender terpadu (timeline per kamar), Detail booking, Form input booking cepat, Laporan okupansi/pendapatan, Manajemen properti & kamar; device: Keduanya; interactive: Interaksi penuh (isi form, ubah status); data: turtle homestay 10 kamar eddo homestay 2 kamar; calendar_style: Grid bulanan

## Assistant

_[tool: dc_write]_

_[tool: ready_for_verification]_

Prototype siap: kalender grid bulanan Agustus 2026 (Turtle 10 kamar + Eddo 2 kamar), panel detail booking, form input cepat dengan cek ketersediaan, laporan okupansi/pendapatan per saluran, dan halaman properti & kamar. Interaksi jalan: klik chip booking, ubah status check-in/out, catat pelunasan, filter properti/saluran, simpan booking baru sebagai Tentative atau Confirmed. Banner konflik iCal di kalender sengaja diisi satu kasus overlap sesuai F2.4.

Tweaks tersedia untuk mode Staf (sembunyikan angka keuangan), layar awal, dan jumlah chip per hari. Belum dibuat: halaman Hari Ini, pembayaran/piutang terpisah, dan pengaturan iCal — bilang kalau mau ditambah.

## User

Found issues — fixing…

## Assistant

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

Kolom kalender diperbaiki: kedua grid pakai `minmax(0, 1fr)` dan chip booking sekarang bisa menyusut, jadi 7 kolom sama lebar dan sejajar dengan header hari.

## User

Found issues — fixing…

## Assistant

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Now the template wiring:

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

Now the property table:

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

Responsif ditambahkan: di bawah 900px sidebar jadi baris nav horizontal, panel detail booking jadi overlay layar penuh, dan kalender bisa digeser horizontal dengan lebar kolom minimum. Tabel kamar sekarang punya scroll horizontal dengan min-width 560px jadi pill status tidak terpotong.

## User

Found issues — fixing…

## Assistant

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

Akar masalahnya: keputusan overlay hanya melihat lebar viewport, padahal sidebar 246px + drawer 352px menyisakan kolom konten di bawah 560px sampai sekitar 1160px. Sekarang drawer otomatis jadi overlay penuh setiap kali ada booking terpilih di viewport ≤1160px, jadi kalender/laporan tetap lega.

## User

bagian awalan ketika logout bagaimana. karena disitu ada owner dan bisa tambahkan pengelola

berarti harus buat cmsnya juga?

## Assistant

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Now the template: login overlay, profile menu with logout, and the Pengguna screen.

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

Now the login overlay and invite modal:

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Tidak perlu CMS terpisah — webapp ini sendiri sudah jadi panel adminnya. Yang ditambahkan:

**Halaman login** (muncul pertama kali, sesuai F7.1) dengan pilihan masuk sebagai Owner atau Staf, jadi bisa langsung lihat perbedaan aksesnya. Sebagai Staf, menu Laporan dan Pengguna hilang serta semua angka rupiah disembunyikan.

**Pengguna & Peran** (F7.2/F7.3): daftar akun dengan peran, akses properti, status, tombol nonaktifkan/aktifkan, dan modal "Undang pengelola" untuk menambah staf per properti.

**Logout** lewat menu di kanan atas kartu profil.

## User

Found issues — fixing…

## Assistant

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

Nama, inisial avatar, dan jejak audit sekarang ikut akun yang login — masuk sebagai Staf menampilkan Marthen Sauyai, bukan Yud.

## User

buat desain loginnya lebih profesional seperti contoh gambar yang saya upload

## Assistant

_[tool: copy_starter_component]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

Login jadi dua panel seperti referensi: kiri form (logo, judul, input garis bawah, pilihan peran Owner/Staf), kanan panel foto dengan overlay gelap dan headline + tiga angka ringkas. Panel kanan pakai slot foto yang bisa kamu isi sendiri — tarik saja foto aerial homestay ke area itu, gambarnya tersimpan. Di layar sempit panel foto disembunyikan dan form jadi satu kolom.

## User

Found issues — fixing…

## Assistant

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

Overlay login sekarang `align-items:flex-start` + kartu `margin:auto`, jadi di viewport pendek bagian atas kartu tetap bisa di-scroll dan logo tidak terpotong.

## User

cara demo loginnya bagaimana?

## Assistant

Di halaman login yang muncul pertama kali:

1. Pilih peran di bagian **Masuk sebagai** — Owner atau Staf. Email otomatis terisi (`yud@rumahpapua.id` untuk Owner, `marthen@rumahpapua.id` untuk Staf).
2. Isi kolom kata sandi dengan apa saja, misal `demo123` (prototype tidak memvalidasi kata sandi, hanya menolak kalau kosong).
3. Klik **Masuk ke dashboard**.

Bedanya setelah masuk: Owner dapat menu Kalender, Laporan, Properti & Kamar, Pengguna & Peran plus semua angka rupiah. Staf hanya Kalender dan Properti & Kamar, tanpa nominal uang sama sekali.

Untuk keluar dan mencoba peran lain, klik kartu profil di kanan atas lalu **Keluar dari akun**.

## User

terus teknologi yang saya harus pake bagaimana? jika ingin live dan benar benar menjadi webbapp yang profesionall?

## Assistant

Rekomendasi paling aman untuk kasus ini, sejalan dengan PRD (biaya di bawah Rp 150rb/bulan, butuh cron iCal, PWA):

**Stack**
- **Next.js (App Router) + TypeScript + Tailwind** — satu repo untuk UI dan API, gampang dijadikan PWA, dan prototype ini bisa dipindahkan hampir apa adanya.
- **PostgreSQL + Prisma** — model datanya sudah ada di PRD bagian 9. Pakai Neon atau Supabase (free tier cukup untuk 12 kamar).
- **Auth.js (NextAuth) credentials provider** untuk login email/password + peran Owner/Staf.
- **ical.js** untuk parsing feed impor, dan route `/api/ical/[roomToken]` yang men-generate feed ekspor.
- **Vercel Hobby + Vercel Cron** (gratis, cron 1×/hari) atau **VPS kecil Rp 40–80rb/bulan** + `node-cron` kalau mau tarik iCal tiap 15 menit. Untuk anti-double-booking, frekuensi tinggi itu penting, jadi VPS lebih cocok. Alternatif: Vercel + cron eksternal (cron-job.org, gratis, bisa tiap menit).
- **Cloudflare R2 atau Supabase Storage** untuk bukti transfer.

**Alternatif kalau kamu atau developermu lebih kuat PHP:** Laravel + Livewire + Postgres di satu VPS. Scheduler dan queue-nya bawaan, jadi sinkron iCal justru lebih mudah dari Next.js di serverless.

**Hal teknis yang menentukan "profesional" di kasus ini**
- Constraint unik di database untuk mencegah overlap booking per kamar (Postgres `daterange` + `EXCLUDE USING gist`) — jangan hanya validasi di aplikasi.
- Simpan `external_uid` dari iCal supaya sinkron ulang tidak menduplikasi booking.
- Semua tanggal disimpan sebagai date polos (bukan timestamp), timezone Asia/Jayapura untuk tampilan.
- Backup Postgres harian otomatis.

Kalau mau, saya bisa siapkan paket handoff untuk developer: skema database, daftar endpoint, dan alur sinkron iCal, dari prototype ini.

## User

aku mau pake hostinger biar all in one, harus pilih paket yang mana?

## Assistant

_[tool: web_search]_

Untuk kebutuhan kamu (Node/Laravel + database sendiri + cron iCal tiap 15 menit), **paket shared hosting tidak cukup andal**. Ambil **VPS**.

**Rekomendasi: Hostinger VPS KVM 2.** KVM 1 bisa jalan, tapi build Next.js dan Postgres di satu server pada RAM terkecil sering kehabisan memori saat deploy. KVM 2 memberi ruang untuk app + database + cron tanpa perlu upgrade lagi.

Satu catatan penting soal lokasi server: paket VPS Hostinger tidak tersedia di data center Netherlands, UK, Indonesia, dan Singapura — jadi verifikasi dulu saat checkout. Kalau memang Singapura tidak bisa untuk VPS, latensi dari Raja Ampat akan lebih tinggi; ini alasan kuat untuk memilih paket yang datacenternya paling dekat, atau pertimbangkan penyedia VPS lokal (Biznet Gio, IDCloudHost) yang punya server Jakarta.

Harga bisa berubah, jadi cek langsung di situs Hostinger — kisarannya sekitar Rp 100–200rb/bulan untuk kontrak panjang, sedikit di atas target Rp 150rb di PRD, dan harga perpanjangan biasanya lebih tinggi dari harga promo awal.

**Yang perlu kamu siapkan di VPS itu:** Ubuntu, Node 20, PostgreSQL, Nginx sebagai reverse proxy, PM2 untuk menjaga proses tetap hidup, Certbot untuk SSL gratis, dan crontab untuk sinkron iCal. Semua ini muat di satu server.

**Kalau mau lebih murah dan tetap all-in-one:** pakai paket **Business Web Hosting** Hostinger dengan **Laravel + MySQL** (bukan Next.js + Postgres). Shared hosting Hostinger nyaman untuk PHP dan sudah ada cron job di hPanel. Konsekuensinya: kamu kehilangan proteksi anti-overlap level database milik Postgres, jadi pencegahan double booking sepenuhnya bergantung pada validasi di kode plus transaksi terkunci. Untuk 12 kamar risikonya masih bisa dikelola.

## User

aku ga mau yang paling murah, tapi paling bagus dan pas untuk webapp ini

## Assistant

Kalau prioritasnya kualitas dan kecocokan, bukan harga terendah: **Hostinger VPS KVM 4** (sekitar 4 vCPU, 16 GB RAM, 200 GB NVMe — verifikasi angkanya di halaman paketnya saat beli).

Alasannya untuk webapp ini spesifik, bukan sekadar "lebih besar lebih baik":

Postgres bekerja jauh lebih baik ketika seluruh indeks booking muat di RAM, dan kalender terpadu adalah query rentang tanggal yang dijalankan berulang — ini yang membuat halaman kalender terasa instan meski koneksi di pulau lambat. Build Next.js juga memakan RAM besar saat deploy; dengan 16 GB kamu bisa build langsung di server tanpa server sempat down. Lalu cron iCal 4 kamar × 12 kamar tiap 15 menit berjalan berbarengan dengan traffic normal tanpa saling mengganggu. KVM 4 memberi ruang tumbuh sampai 10 properti seperti di PRD tanpa migrasi server lagi.

KVM 8 tidak perlu. Untuk 12 kamar dan ribuan booking per tahun itu kapasitas terbuang.

**Yang wajib kamu tambahkan supaya benar-benar layak produksi:**

Daily backup berbayar — backup mingguan gratisnya tidak cukup untuk data booking, kehilangan enam hari transaksi tidak bisa dipulihkan dari ingatan. Ini add-on paling berharga di paket ini.

Pilih data center terdekat yang tersedia untuk VPS, dan pasang Cloudflare di depannya (plan gratis sudah cukup) untuk caching aset dan TLS. Ini yang paling terasa dampaknya pada koneksi 3G di lapangan, lebih besar daripada spesifikasi server.

Domain sendiri plus email bisnis, supaya undangan akun staf dan notifikasi tidak masuk spam.

**Satu peringatan:** VPS Hostinger itu unmanaged. Kamu atau developermu yang bertanggung jawab atas patch OS, konfigurasi firewall, dan pemulihan saat server bermasalah. Kalau tidak ada yang mengurus itu secara rutin, "paling bagus" untuk kamu justru bukan VPS besar, melainkan Vercel Pro plus Neon untuk database — lebih mahal per bulan tapi tanpa pekerjaan sysadmin sama sekali. Bilang saja kalau mau saya bandingkan dua jalur ini secara berdampingan.

## User

coba bandingkan

## Assistant

**Jalur A — Hostinger VPS KVM 4** (satu server, unmanaged)

Biaya sekitar Rp 200–300rb/bulan untuk server plus daily backup, ditambah domain. Semua di satu tempat: app, Postgres, cron, file bukti transfer.

Kelebihannya: cron iCal bisa tiap 5 menit tanpa batasan atau biaya tambahan — ini keunggulan nyata untuk anti-double-booking. Biaya tetap dan bisa diprediksi, tidak ada tagihan mengejut. Postgres lokal berarti query kalender tanpa latensi jaringan ke database. Kamu punya kendali penuh, termasuk `EXCLUDE USING gist` untuk proteksi overlap.

Kekurangannya: kamu yang urus patch keamanan, firewall, dan pemulihan saat server mati. Deploy perlu kamu setel sendiri (Git + PM2 + Nginx). Kalau server down jam 2 pagi, tidak ada yang membenahi selain kamu. Satu titik kegagalan tunggal untuk app dan database sekaligus.

**Jalur B — Vercel + Neon** (managed, tanpa server)

Vercel Pro sekitar $20/bulan, Neon Launch sekitar $19/bulan, total sekitar Rp 600–650rb/bulan. Lebih mahal dua kali lipat.

Kelebihannya: nol pekerjaan sysadmin. Deploy otomatis setiap push ke Git, dengan preview per perubahan dan rollback satu klik. CDN global bawaan, jadi halaman ringan tiba cepat dari mana pun. Neon punya point-in-time recovery — bisa memulihkan database ke menit tertentu, jauh lebih baik daripada backup harian. Uptime dan keamanan jadi tanggung jawab mereka.

Kekurangannya: cron di Vercel dibatasi frekuensinya, jadi untuk sinkron iCal tiap 15 menit kamu perlu pemicu eksternal seperti cron-job.org. Database terpisah dari app berarti tiap query menyeberang jaringan; solusinya pilih region Singapura di keduanya. Biaya bisa naik kalau pemakaian melonjak. Vendor lock-in lebih terasa.

**Penilaian saya**

Untuk kasus kamu, Jalur B lebih tepat, dan alasannya bukan teknis melainkan operasional. Kamu mengelola homestay di Raja Ampat, bukan menjaga server. Selisih sekitar Rp 350rb/bulan itu kira-kira setara satu malam kamar Turtle — murah untuk menghilangkan seluruh beban sysadmin, dan point-in-time recovery Neon adalah jaring keamanan yang tepat untuk data booking dan pembayaran.

Ambil Jalur A hanya jika ada developer yang memang akan merawat server itu jangka panjang, atau kalau kamu memang ingin frekuensi sinkron iCal setinggi mungkin dengan biaya tetap.

Perlu diingat, dua-duanya tidak menghilangkan risiko celah sinkron iCal. Yang menyelamatkan kamu dari double booking adalah deteksi konflik dan frekuensi tarik, bukan pilihan hosting.

## User

tapi kalo dibedah perlu tekonlogi apa saja sih?

## Assistant

Kalau dibedah per lapisan, ini yang benar-benar dibutuhkan:

**Frontend**
Next.js dengan React sebagai kerangka, TypeScript untuk mencegah salah tipe data tanggal dan uang, Tailwind untuk styling. Tambah TanStack Query untuk caching data kalender, dan `next-pwa` untuk PWA plus service worker — inilah yang membuat kalender terakhir tetap terbaca saat sinyal hilang (NF1). Untuk tanggal pakai `date-fns` dengan timezone Asia/Jayapura, jangan pakai `Date` mentah.

**Backend**
Next.js API Routes sudah cukup, tidak perlu server terpisah. Zod untuk validasi input form booking. Untuk logika inti anti-double-booking, tulis sebagai transaksi database, bukan sekadar pengecekan di kode.

**Database**
PostgreSQL, dengan Prisma sebagai ORM untuk skema dan migrasi. Fitur Postgres yang wajib dipakai: tipe `daterange` dan `EXCLUDE USING gist` untuk mencegah overlap booking per kamar di level database. Ini satu baris SQL yang menghilangkan seluruh kelas bug double booking.

**Autentikasi**
Auth.js (NextAuth) dengan credentials provider, `bcrypt` untuk hash password, dan session berbasis cookie httpOnly. Peran Owner dan Staf disimpan di tabel User, lalu dicek di setiap API route — jangan hanya menyembunyikan menu di UI seperti di prototype ini.

**Sinkronisasi iCal**
`ical.js` atau `node-ical` untuk parsing feed impor, dan `ics` untuk men-generate feed ekspor. Ditambah tabel log sinkron supaya status per feed terlihat (F3.5), dan penyimpanan `external_uid` supaya sinkron ulang tidak menduplikasi booking.

**Cron / penjadwalan**
Kalau di VPS: `crontab` biasa memanggil endpoint internal. Kalau di Vercel: Vercel Cron atau cron-job.org sebagai pemicu. Endpoint sinkron harus dilindungi secret header supaya tidak bisa dipanggil orang lain.

**Penyimpanan file**
Cloudflare R2 atau Supabase Storage untuk bukti transfer, dengan kompresi gambar di sisi browser sebelum upload — penting karena upload dari HP dengan sinyal lemah.

**Notifikasi**
Resend atau Brevo untuk email undangan staf dan pengingat pelunasan. Kalau mau notifikasi konflik masuk ke WhatsApp, pakai Fonnte atau Wablas (penyedia lokal, jauh lebih murah daripada WhatsApp Business API resmi).

**Laporan dan ekspor**
`exceljs` atau `papaparse` untuk ekspor CSV/Excel (F6.5). Perhitungan okupansi, ADR, dan komisi cukup dilakukan lewat query SQL agregat, tidak perlu library BI.

**Operasional**
GitHub untuk repo dan deploy otomatis, Sentry untuk pelacakan error (free tier cukup), Cloudflare di depan domain, dan Uptime Robot untuk memantau server hidup.

**Yang tidak kamu butuhkan:** Redis, Docker, microservice, GraphQL, state management seperti Redux, dan channel manager berbayar. Untuk 12 kamar semuanya menambah kerumitan tanpa manfaat.

Kalau mau, saya bisa susun ini jadi dokumen handoff untuk developer: skema database lengkap dengan constraint anti-overlap, daftar endpoint API, dan alur sinkron iCal beserta penanganan kasus tepinya.

## User

tolong susunkan

## Assistant

_[tool: read_skill_prompt]_

_[tool: copy_starter_component]_

_[tool: dc_write]_

_[tool: ready_for_verification]_

Dokumen handoff siap, 10 bagian: keputusan teknologi dengan alasannya, arsitektur, skema database lengkap dengan `EXCLUDE USING gist` anti-overlap, daftar endpoint beserta level akses, alur sinkron iCal impor/ekspor termasuk kasus tepi jendela feed, aturan bisnis (transisi status, perhitungan bayar, harga musiman), otorisasi peran, perbandingan hosting, urutan pengerjaan 10 minggu, dan daftar hal yang perlu diverifikasi.

Dokumen ini siap diprint atau diekspor PDF apa adanya. Bilang saja kalau mau saya buatkan PDF-nya.

## User

pilih ubuntu?

## Assistant

Ya, **Ubuntu** di tab Plain OS. Setelah diklik akan muncul pilihan versi — ambil **Ubuntu 24.04 LTS**, jangan versi non-LTS. LTS didukung sampai 2029, dan hampir semua panduan Node, Postgres, dan Nginx ditulis untuk Ubuntu LTS, jadi kalau nanti ada masalah lebih mudah cari solusinya.

Jangan pilih apa pun di tab **Control panel** atau **Aplikasi**. Panel seperti CyberPanel atau cPanel dirancang untuk hosting PHP dan justru mengambil alih port 80/443 serta konfigurasi Nginx yang kamu butuhkan untuk Next.js. Server bersih lebih mudah diatur.

Setelah OS terpasang, langkah berikutnya: buat user non-root, aktifkan firewall (izinkan hanya 22, 80, 443), pasang Node 20, PostgreSQL 16, Nginx, dan Certbot. Kalau mau, saya bisa tuliskan urutan perintah setup-nya jadi satu dokumen.

## User



## User

<attached_files>
- uploads/Screenshot 2026-08-13 at 19.31.26.png
</attached_files>

## User

<attached_files>
- uploads/Screenshot 2026-08-13 at 19.33.17.png
</attached_files>

## Assistant

**KVM 2** — Rp 151.900/bln. Sekaligus koreksi rekomendasi saya sebelumnya: saya menyebut KVM 4 tanpa melihat spesifikasi aslinya, dan ternyata KVM 2 sudah memberi 8 GB RAM.

8 GB itu lapang untuk kebutuhanmu. Build Next.js memakan sekitar 2 GB, Postgres dengan ribuan booking per tahun nyaman di 1–2 GB, sisanya untuk OS dan cron. KVM 4 memberi 16 GB yang tidak akan pernah terpakai, dan yang lebih penting: harga perpanjangannya Rp 465.900/bln versus Rp 232.900 untuk KVM 2. Selisih Rp 233rb/bln selamanya untuk RAM yang menganggur.

KVM 1 sebaiknya dilewati. 4 GB cukup untuk menjalankan aplikasi, tapi build Next.js di server dengan RAM sebesar itu sering kehabisan memori dan proses build terbunuh di tengah jalan. Bisa diakali dengan swap, tapi itu kerepotan yang tidak sebanding dengan selisih Rp 35rb.

Dua hal yang perlu kamu perhatikan sebelum bayar: harga perpanjangan naik jadi Rp 232.900, jadi ambil kontrak terpanjang yang kamu nyaman untuk menunda kenaikan itu. Dan **Backup Mingguan** yang tertera di daftar adalah yang bawaan — auto-backup harian yang kamu centang di langkah sebelumnya itu yang menggantikannya, pastikan tetap aktif.

## User

kalo untuk uji coba pake shared hosting bisa?

## Assistant

Bisa, tapi hasil uji cobanya tidak akan mewakili aplikasi yang sebenarnya — dan itu justru membuat uji cobanya kurang berguna.

Masalahnya bukan kapasitas, melainkan ketidaksesuaian. Shared hosting Hostinger tidak menyediakan PostgreSQL, hanya MySQL. Begitu kamu pindah ke MySQL, kamu kehilangan `EXCLUDE USING gist` yang menjadi fondasi anti-double-booking di dokumen handoff. Artinya kamu menguji aplikasi yang berbeda dari yang akan dibangun, lalu harus menulis ulang lapisan datanya saat naik ke produksi. Selain itu Node.js di shared hosting berjalan sebagai proses yang bisa dimatikan sewaktu-waktu, dan cron di sana biasanya minimum 15 menit sekali.

**Untuk uji coba, pakai ini saja — gratis dan persis sama dengan produksi:** Vercel Hobby plus Neon free tier. Nol rupiah, Postgres asli lengkap dengan exclusion constraint, deploy otomatis dari GitHub, dan URL yang bisa kamu buka dari HP di lapangan untuk mencoba input booking sungguhan. Sinkron iCal-nya dipicu cron-job.org yang juga gratis.

Kalau ternyata cocok, kamu bisa tetap di sana dan naik ke paket berbayar, atau pindah ke VPS Hostinger tanpa mengubah satu baris kode aplikasi — hanya connection string database yang berganti.

Jadi urutan yang saya sarankan: uji coba gratis di Vercel plus Neon dulu sampai alur booking terasa benar, baru putuskan hosting produksinya. Jangan beli VPS sekarang kalau belum ada aplikasi yang jalan di atasnya.

