# PRD — Booking Manager Homestay Raja Ampat

**Versi:** 1.0 (Draft)
**Tanggal:** 13 Agustus 2026
**Pemilik dokumen:** Yud
**Status:** Menunggu review

---

## 1. Ringkasan

Webapp internal untuk mengelola seluruh bookingan dari beberapa homestay milik sendiri di Raja Ampat, yang datang dari berbagai saluran: **Booking.com, Traveloka, Agoda, dan WhatsApp** (booking langsung). Semua booking dikumpulkan ke dalam **satu kalender terpadu per properti dan per kamar**, sehingga tidak ada lagi double booking, dan pemilik bisa melihat okupansi serta pendapatan dari satu tempat.

Pendekatan integrasi MVP: **sinkronisasi iCal** (tarik kalender dari OTA yang mendukung) + **input manual/semi-otomatis** untuk booking WA dan OTA yang tidak menyediakan iCal. Webapp menjadi *single source of truth* internal.

---

## 2. Latar Belakang & Masalah

Homestay di Raja Ampat umumnya menerima booking dari banyak saluran sekaligus. Saat ini pengelolaannya tersebar:

1. **Double booking** — kamar yang sama bisa terjual di dua platform berbeda karena kalender tidak sinkron, dan booking WA hanya tercatat di chat/ingatan.
2. **Tidak ada gambaran okupansi** — sulit menjawab "kamar mana yang kosong tanggal sekian" tanpa membuka 3–4 aplikasi.
3. **Pembayaran booking WA tidak ter-track** — DP via transfer sering hanya dicek di mutasi rekening; ada risiko lupa menagih pelunasan.
4. **Tidak ada data untuk keputusan bisnis** — pendapatan per platform, per kamar, per musim tidak terekam rapi, padahal dibutuhkan untuk mengatur harga dan ekspansi.
5. **Konteks lapangan** — sinyal internet di pulau-pulau Raja Ampat tidak selalu stabil; aplikasi harus tetap berguna dengan koneksi lambat.

## 3. Tujuan & Metrik Keberhasilan

| Tujuan | Metrik | Target |
|---|---|---|
| Menghilangkan double booking | Insiden double booking per bulan | 0 |
| Semua booking tercatat | % booking (semua saluran) yang tercatat di sistem | 100% |
| Kontrol pembayaran WA | % booking WA dengan status bayar terupdate | 100% |
| Visibilitas bisnis | Laporan okupansi & pendapatan bulanan tersedia | ≤ 5 menit untuk melihat |
| Kecepatan operasional | Waktu input 1 booking WA manual | ≤ 2 menit |

## 4. Pengguna & Persona

**Persona utama — Pemilik/Operator (Yud):** mengelola beberapa homestay milik sendiri, mobile-first (sering akses dari HP), butuh gambaran cepat: siapa check-in hari ini, kamar mana kosong, siapa belum lunas.

**Persona sekunder — Staf/penjaga homestay:** akses terbatas per properti; melihat jadwal check-in/check-out, menandai tamu sudah tiba, mencatat booking walk-in/WA. Tidak perlu akses laporan keuangan.

> Catatan: MVP cukup 2 peran (Admin/Owner dan Staf). Multi-tenant SaaS untuk homestay lain **di luar scope** versi ini, tapi arsitektur data sebaiknya tidak menutup kemungkinan itu di masa depan.

## 5. Scope

### 5.1 In Scope (MVP)

1. Manajemen properti, kamar, dan harga
2. Kalender booking terpadu (per properti & per kamar)
3. Sinkronisasi iCal dua arah dengan OTA yang mendukung
4. Input booking manual (WA, walk-in, telepon)
5. Pencatatan pembayaran & DP
6. Laporan & dashboard okupansi/pendapatan
7. Autentikasi & peran (Owner, Staf)

### 5.2 Out of Scope (MVP)

- Integrasi API resmi OTA / channel manager berbayar (SiteMinder, dsb.)
- Push harga & ketersediaan otomatis ke OTA (di iCal hanya blok tanggal yang tersinkron, bukan harga)
- Integrasi WhatsApp Business API otomatis (pembacaan chat otomatis)
- Payment gateway online (pembayaran tetap via transfer bank manual)
- Multi-tenant untuk homestay pihak lain
- Aplikasi mobile native (cukup web responsif / PWA)
- Housekeeping, inventori amenities, POS

## 6. Kebutuhan Fungsional

### F1 — Manajemen Properti, Kamar & Harga

- **F1.1** CRUD properti (nama, lokasi/pulau, kontak, catatan).
- **F1.2** CRUD tipe kamar & unit kamar per properti: nama, kapasitas (dewasa/anak), fasilitas, foto opsional.
- **F1.3** Harga dasar per kamar per malam, dengan dukungan **harga musiman**: rentang tanggal → harga khusus (high season, libur nasional, low season).
- **F1.4** Harga bisa dibedakan per saluran (harga WA/langsung vs harga acuan OTA) — minimal sebagai catatan referensi.
- **F1.5** Kamar bisa dinonaktifkan sementara (renovasi/blokir) dan muncul sebagai blocked di kalender.

### F2 — Kalender Booking Terpadu

- **F2.1** Tampilan kalender bulanan/mingguan per properti, baris per kamar (timeline/Gantt-style), dengan warna berbeda per saluran (Booking.com, Traveloka, Agoda, WA/langsung, blokir).
- **F2.2** Tampilan gabungan semua properti (ringkasan okupansi per hari).
- **F2.3** Klik booking → detail lengkap (tamu, tanggal, saluran, status bayar, catatan).
- **F2.4** Deteksi konflik: jika dua booking overlap pada kamar yang sama, sistem menandai **konflik** secara mencolok dan mengirim notifikasi — tidak menghapus otomatis.
- **F2.5** Daftar "hari ini": check-in hari ini, check-out hari ini, tamu in-house.

### F3 — Sinkronisasi iCal

- **F3.1** **Impor**: setiap kamar bisa menyimpan ≥ 1 URL iCal dari OTA; sistem menarik data berkala (target tiap 15–30 menit) dan mengubah event menjadi booking/blok di kalender.
- **F3.2** **Ekspor**: setiap kamar punya URL iCal keluar (dengan token rahasia) yang memuat semua booking dari sistem, untuk dipasang di OTA agar tanggal terisi otomatis terblokir di platform lain.
- **F3.3** Booking hasil impor iCal menyimpan data sebatas yang tersedia di feed (umumnya rentang tanggal + ringkasan); operator bisa **melengkapi manual** (nama tamu, nilai booking) tanpa merusak sinkronisasi.
- **F3.4** Jika event iCal hilang dari feed (dibatalkan di OTA), sistem menandai booking sebagai *cancelled (perlu konfirmasi)* — bukan hapus permanen.
- **F3.5** Status sinkron per feed: kapan terakhir berhasil, gagal berapa kali, tombol "sync sekarang".
- **F3.6** Keterbatasan diketahui: iCal tidak real-time (jeda menit-jam) dan tidak membawa harga/identitas tamu lengkap. Risiko double booking di jeda sinkron dimitigasi dengan frekuensi tarik tinggi + notifikasi konflik (F2.4).
- **F3.7** Untuk OTA tanpa iCal (mis. jika Traveloka tidak menyediakan): booking diinput manual (F4) dengan saluran = Traveloka; sistem tetap memblokir tanggal di ekspor iCal ke OTA lain.

### F4 — Input Booking Manual (WA / Walk-in / OTA tanpa iCal)

- **F4.1** Form cepat: pilih properti → kamar → tanggal (dengan cek ketersediaan real-time di form) → data tamu (nama, no. WA, jumlah tamu, asal) → harga total → saluran → catatan.
- **F4.2** Status booking: *Inquiry / Tentative* (tanya-tanya, hold sementara dengan masa berlaku), *Confirmed* (DP masuk), *Checked-in*, *Checked-out*, *Cancelled*, *No-show*.
- **F4.3** Hold *tentative* punya tanggal kedaluwarsa; jika lewat tanpa DP, sistem menandai dan mengingatkan operator untuk melepas tanggal.
- **F4.4** Duplikasi cegah: peringatan jika nama/no. WA + tanggal mirip dengan booking yang sudah ada.
- **F4.5** Edit dan pembatalan booking dengan jejak audit sederhana (siapa mengubah, kapan).

### F5 — Pembayaran & DP

- **F5.1** Per booking: harga total, rincian pembayaran (DP, pelunasan, tambahan), metode (transfer bank, tunai, e-wallet), tanggal, dan bukti transfer (upload gambar opsional).
- **F5.2** Status bayar otomatis dihitung: *Belum bayar / DP masuk / Lunas / Kelebihan-refund*.
- **F5.3** Daftar piutang: semua booking Confirmed yang belum lunas, diurutkan berdasarkan tanggal check-in terdekat.
- **F5.4** Pengingat internal: tandai booking yang mendekati check-in (H-7 / H-3) tapi belum lunas.
- **F5.5** Untuk booking OTA prabayar (dibayar via platform), status bayar cukup ditandai *Dibayar via OTA* dengan estimasi nilai payout dan komisi (input manual).
- **F5.6** Pencatatan refund saat pembatalan.

### F6 — Laporan & Dashboard

- **F6.1** Dashboard ringkas: okupansi bulan berjalan (%), pendapatan bulan berjalan, booking baru minggu ini, piutang berjalan, check-in 7 hari ke depan.
- **F6.2** Laporan okupansi: per properti, per kamar, per bulan; perbandingan antar bulan.
- **F6.3** Laporan pendapatan: per saluran (berapa dari Booking.com vs Traveloka vs Agoda vs WA), per properti, per kamar. Termasuk estimasi komisi OTA agar terlihat pendapatan bersih vs kotor.
- **F6.4** ADR (harga rata-rata per malam terjual) dan lama menginap rata-rata.
- **F6.5** Ekspor CSV/Excel untuk semua laporan.

### F7 — Autentikasi & Peran

- **F7.1** Login email + password; sesi aman.
- **F7.2** Peran **Owner** (akses penuh semua properti + laporan keuangan) dan **Staf** (dibatasi per properti: kalender, input booking, tandai check-in/out, catat pembayaran; tanpa laporan keuangan agregat).
- **F7.3** Owner bisa mengundang/menonaktifkan akun staf.

## 7. Kebutuhan Non-Fungsional

- **NF1 — Koneksi lambat:** aplikasi ringan, target muat halaman utama < 3 detik pada koneksi 3G; PWA dengan cache agar kalender terakhir tetap terbaca saat offline (read-only offline; input butuh koneksi).
- **NF2 — Mobile-first:** seluruh alur utama (lihat kalender, input booking, catat pembayaran) nyaman dipakai di layar HP.
- **NF3 — Bahasa:** antarmuka Bahasa Indonesia.
- **NF4 — Keamanan data:** data tamu (nama, no. WA) tersimpan aman; URL iCal ekspor memakai token yang bisa di-reset; backup database otomatis harian.
- **NF5 — Keandalan sinkron:** kegagalan tarik iCal di-retry otomatis dan terlihat statusnya (F3.5); tidak boleh gagal diam-diam.
- **NF6 — Skalabilitas wajar:** cukup untuk ±10 properti, ±100 kamar, ribuan booking/tahun — tidak perlu arsitektur besar.
- **NF7 — Biaya operasional rendah:** target hosting + domain < Rp 150rb/bulan (VPS kecil atau platform serverless hobby-tier).

## 8. Alur Utama (User Flows)

**Alur A — Booking WA masuk:** Tamu chat WA → operator buka form input cepat → pilih kamar & tanggal (sistem menunjukkan ketersediaan) → simpan sebagai *Tentative* dengan masa hold 1×24 jam → kirim info rekening ke tamu → DP masuk → operator catat pembayaran + upload bukti → status otomatis *Confirmed* → tanggal terblokir di ekspor iCal ke semua OTA.

**Alur B — Booking OTA masuk:** Tamu booking di Booking.com → feed iCal tertarik pada siklus sinkron berikutnya → booking muncul di kalender dengan label Booking.com → operator melengkapi nama tamu & estimasi nilai → tanggal otomatis terblokir di OTA lain via ekspor iCal.

**Alur C — Konflik terdeteksi:** Dua booking overlap di kamar sama → banner konflik di dashboard + penanda merah di kalender → operator memutuskan: pindahkan salah satu ke kamar lain, atau hubungi tamu/OTA untuk pembatalan → operator menandai konflik selesai.

**Alur D — Hari operasional:** Staf buka halaman "Hari Ini" → lihat daftar check-in/check-out → tamu tiba → tandai *Checked-in* → saat pulang tandai *Checked-out* → jika ada pembayaran sisa tunai, catat di booking.

## 9. Model Data (Ringkas)

- **Property** (id, nama, lokasi, catatan)
- **Room** (id, property_id, nama, tipe, kapasitas, status aktif)
- **RatePlan / SeasonalRate** (room_id, rentang tanggal, harga)
- **Booking** (id, room_id, tanggal masuk/keluar, saluran, status, tamu_id, harga total, sumber [manual/ical], external_uid iCal, catatan)
- **Guest** (id, nama, no. WA, asal, catatan)
- **Payment** (id, booking_id, jumlah, jenis [DP/pelunasan/refund], metode, tanggal, bukti_url)
- **IcalFeed** (id, room_id, arah [import/export], url/token, status sinkron terakhir)
- **User** (id, nama, email, peran, properti yang diizinkan)

## 10. Rekomendasi Teknologi (Non-mengikat)

Web app monolitik sederhana: **Next.js/React (PWA)** atau **Laravel + Livewire**, database **PostgreSQL**, cron job untuk tarik iCal tiap 15–30 menit, deploy di VPS kecil (mis. tier ± $5/bulan) atau platform PaaS. Library iCal siap pakai tersedia di semua ekosistem (mis. `ical.js`, `ics`, `sabre/vobject`). Tidak perlu microservice.

## 11. Rilis & Prioritas

| Fase | Isi | Perkiraan |
|---|---|---|
| **MVP v0.1** | Properti/kamar/harga dasar, kalender terpadu, input booking manual, status bayar sederhana, login Owner | 4–6 minggu |
| **v0.2** | Sinkron iCal impor + ekspor, deteksi konflik, notifikasi | +2–3 minggu |
| **v0.3** | Laporan lengkap (okupansi, pendapatan per saluran, ADR), ekspor CSV, peran Staf, halaman "Hari Ini" | +2–3 minggu |
| **v1.0** | PWA offline read-only, harga musiman penuh, piutang & pengingat pelunasan, polish | +2 minggu |

**Prioritas jika harus memangkas:** kalender terpadu + input manual + iCal ekspor adalah inti anti-double-booking; laporan bisa menyusul.

## 12. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Jeda sinkron iCal → double booking di celah waktu | Sedang | Frekuensi sinkron tinggi, buffer ketersediaan di OTA saat high season, deteksi konflik cepat |
| OTA tertentu tidak menyediakan iCal (perlu verifikasi per platform, per akun extranet) | Sedang | Fallback input manual (F3.7); cek fitur "calendar sync/export" di masing-masing extranet saat implementasi |
| Operator lupa input booking WA | Tinggi | Form input ≤ 2 menit, akses cepat dari HP, kebiasaan operasional |
| Koneksi internet di pulau tidak stabil | Sedang | PWA + cache read-only, halaman ringan |
| Data pembayaran salah catat | Sedang | Upload bukti transfer, jejak audit, laporan piutang untuk cross-check |

## 13. Pertanyaan Terbuka

1. Berapa jumlah properti dan kamar saat ini (untuk kalibrasi UI kalender)?
2. Apakah semua properti sudah aktif di ketiga OTA, dan apakah akun extranet masing-masing menyediakan ekspor/impor iCal? (Perlu dicek langsung di dashboard Booking.com, Traveloka, Agoda.)
3. Siapa yang akan input booking WA sehari-hari — hanya Owner, atau staf di lokasi?
4. Apakah dibutuhkan pencatatan biaya operasional (pengeluaran) di aplikasi yang sama, atau cukup pendapatan?
5. Webapp mau dibangun sendiri (dibantu AI/developer) atau di-outsource? Ini memengaruhi pilihan teknologi.

---

*Dokumen ini bagian dari Homestay Project (Raja Ampat). Versi berikutnya akan diperbarui setelah jawaban pertanyaan terbuka dan verifikasi fitur iCal per OTA.*
