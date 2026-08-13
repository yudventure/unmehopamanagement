# HANDOFF — Unmehopa Management

Catatan serah terima antar sesi Claude Code. Dokumen ini merekam **apa yang
sudah jadi, bagaimana menjalankannya, dan apa yang tersisa**.

Repo GitHub: `yudventure/unmehopamanagement` (private).

---

## 1. Apa itu proyek ini

**Unmehopa Management** adalah nama repo untuk **Rumah Papua Booking Manager** —
webapp internal pengelolaan booking homestay di Raja Ampat, Papua Barat Daya.

Konteks bisnisnya: pemilik (Yud) mengelola dua homestay sendiri —
**Turtle Homestay** (10 kamar, Yenbuba, Pulau Mansuar) dan **Eddo Homestay**
(2 kamar, Sawinggrai, Pulau Gam). Booking masuk dari empat saluran sekaligus:
Booking.com, Traveloka, Agoda, dan WhatsApp/walk-in.

Masalah yang dipecahkan (dari PRD di `project/uploads/PRD-booking-manager-homestay.md`):

1. **Double booking** — kamar yang sama terjual di dua platform karena kalender
   tidak sinkron; booking WhatsApp hanya tercatat di chat.
2. **Tidak ada gambaran okupansi** — harus buka 3–4 aplikasi untuk tahu kamar
   mana yang kosong.
3. **Pembayaran WA tidak ter-track** — DP transfer hanya dicek di mutasi rekening.
4. **Tidak ada data untuk keputusan bisnis** — pendapatan per platform/kamar/musim
   tidak terekam.
5. **Sinyal internet pulau tidak stabil** — aplikasi harus ringan.

Solusinya: satu kalender terpadu sebagai *single source of truth* internal,
dengan sinkronisasi iCal dari OTA plus input manual untuk WhatsApp.

Antarmuka sepenuhnya **Bahasa Indonesia** (NF3 di PRD). Dua peran: **Owner**
(akses penuh + laporan keuangan) dan **Staf** (tanpa angka rupiah sama sekali).

### Asal-usul kode

Repo ini berawal dari **handoff bundle Claude Design** (commit `ab69939`):
prototype HTML/CSS/JS yang dibuat pemilik di claude.ai/design, lengkap dengan
transkrip percakapan desainnya. Commit berikutnya adalah **port prototype itu
ke Next.js**.

Sumber desain — jangan dihapus, masih jadi acuan:

| File | Isi |
|---|---|
| `project/Booking Manager Homestay.dc.html` | Prototype yang diimplementasikan (spec visual) |
| `project/Handoff Teknis Booking Manager.dc.html` | Skema DB, daftar endpoint, alur iCal, urutan 10 minggu |
| `project/uploads/PRD-booking-manager-homestay.md` | PRD lengkap (F1–F7, NF1–NF7) |
| `chats/chat1.md` | Transkrip sesi desain — di sini letak *intent*-nya |
| `project/README-handoff.md` | Instruksi bundle handoff aslinya |

---

## 2. Apa yang sudah dibangun

**Status: UI lengkap, data seed di memori.** Semua layar dan interaksi jalan.
Belum ada database, autentikasi asli, maupun sinkronisasi iCal — ini keputusan
scope yang disepakati, bukan pekerjaan yang terlewat.

### Fitur yang sudah berfungsi

- **Halaman login dua panel** — pilih peran Owner/Staf (email terisi otomatis),
  panel foto kanan dengan overlay gradient dan tiga angka ringkas.
- **Kalender bulanan** (Agustus 2026) — grid 6×7, penghitung okupansi per hari
  (`terisi/kapasitas`), chip booking berwarna per saluran, collapse "+N lagi",
  banner konflik iCal, kartu "Check-in hari ini" dan "Belum lunas".
- **Drawer detail booking** — transisi status (Tentative → Confirmed →
  Checked-in → Checked-out, atau Cancelled), rincian bayar, tombol catat
  pelunasan, jejak audit.
- **Form booking cepat** — pilih properti/kamar/tanggal dengan **cek
  ketersediaan langsung** (banner merah kalau bentrok), simpan sebagai
  Tentative atau Confirmed + DP.
- **Laporan** — KPI (okupansi, pendapatan kotor, ADR, lama menginap), bar
  pendapatan per saluran, okupansi per kamar, estimasi komisi OTA.
- **Properti & Kamar** — kartu per properti, tabel kamar dengan kapasitas,
  harga, jumlah feed iCal, status Aktif/Renovasi.
- **Pengguna & Peran** — daftar akun, nonaktifkan/aktifkan, modal undang
  pengelola per properti.
- **Filter & pencarian** — filter properti dan saluran di sidebar, pencarian
  nama tamu / kamar / kode booking di header.
- **Pembatasan peran** — Staf hanya melihat Kalender dan Properti & Kamar,
  semua nominal rupiah disembunyikan.
- **Responsif** — di bawah 900px sidebar jadi baris nav horizontal dan kalender
  bisa digeser; drawer jadi overlay penuh di viewport ≤1160px saat ada booking
  terpilih.

### Struktur file penting

```
src/
  app/
    globals.css               token desain (palet lengkap dari prototype)
    layout.tsx                font DM Sans + JetBrains Mono, metadata
    page.tsx                  render <BookingManager />
  components/
    booking-manager.tsx       ★ SELURUH state aplikasi + view model ada di sini
    top-bar.tsx               logo, pencarian, tombol booking baru, menu profil
    sidebar.tsx               nav, filter properti, filter saluran, status iCal
    booking-drawer.tsx        panel detail booking
    booking-form-modal.tsx    form input booking cepat
    invite-modal.tsx          modal undang pengelola
    login-screen.tsx          login dua panel + panel foto
    screens/
      calendar-screen.tsx     kalender + kartu check-in/belum lunas
      report-screen.tsx       KPI, pendapatan per saluran, okupansi per kamar
      property-screen.tsx     kartu properti + tabel kamar
      users-screen.tsx        tabel pengguna & peran
    ui/
      modal.tsx               shell modal + class field form
      pill.tsx                badge status
  hooks/
    use-viewport-width.ts     lebar viewport terukur (bukan media query)
  lib/
    data.ts                   ★ seed kamar/booking/pengguna (LCG deterministik)
    derive.ts                 sel kalender, statistik bulan, deteksi bentrok
    format.ts                 tanggal & rupiah (id-ID)
    pills.ts                  warna badge per status
    types.ts                  tipe domain
```

Dua file bertanda ★ adalah tempat memulai kalau mau paham cepat.

### Dua hal yang perlu diketahui sebelum mengubah kode

**Data seed bersifat deterministik dan sudah diverifikasi.** `lib/data.ts`
memakai LCG ber-seed tetap (`seed = 7`), hasilnya sudah **dibandingkan
field-per-field dengan generator prototype aslinya**: 12 kamar dan 61 booking
identik. Artinya semua angka okupansi dan pendapatan di layar sama persis
dengan yang dilihat pemilik di Claude Design. **Kalau mengubah `seed`, urutan
`rnd()`, atau urutan field, semua angka akan bergeser** dan verifikasi itu
batal. Termasuk satu bentrok iCal yang disengaja di Turtle 03 pada 19–23
Agustus, untuk menguji banner konflik (PRD F2.4).

**Pergantian layout dipicu lebar terukur, bukan media query.** Drawer harus
jadi overlay setiap kali sidebar (246px) + drawer (352px) menyisakan kolom
konten di bawah ~560px — keputusan yang bergantung pada viewport *dan* apakah
ada booking terpilih, jadi CSS saja tidak cukup. Logikanya di
`use-viewport-width.ts` dan konstanta `NARROW_MAX` / `DRAWER_OVERLAY_MAX` di
`booking-manager.tsx`. Ini perbaikan yang memang diminta di akhir sesi desain —
jangan diganti jadi media query tanpa menguji kasus drawer terbuka di ~1000px.

### Penyimpangan yang disengaja dari prototype

Enam hal berikut sengaja berbeda dari prototype. Masing-masing satu baris
kalau mau dikembalikan:

1. `iso()` memformat tanggal kalender lokal, bukan `toISOString().slice(0,10)`.
   Versi prototype menggeser semua tanggal mundur satu hari di Asia/Jayapura —
   kelihatan benar hanya karena design tool berjalan di UTC.
2. Garis bawah header sekarang tampil. Prototype menulis `borderBottom`
   (camelCase) di dalam string CSS, jadi tidak pernah ter-render.
3. ADR ikut disembunyikan bersama angka rupiah lain di mode Staf; prototype
   membocorkannya.
4. `layarAwal` sekarang berlaku setelah login (sebelumnya kode mati, karena
   login selalu memaksa ke Kalender).
5. Modal tertutup dengan Escape / klik backdrop; login submit dengan Enter.
6. Tombol Ekspor CSV dan Bandingkan bulan memberi tahu bahwa fiturnya belum
   ada, bukan diam saja saat diklik.

---

## 3. Stack & cara menjalankan

| Lapisan | Pilihan |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Bahasa | TypeScript (strict) |
| Styling | Tailwind CSS v4 — palet sebagai token `@theme` di `globals.css` |
| Font | DM Sans + JetBrains Mono via `next/font/google` |
| State | React `useState`/`useMemo` di satu komponen root |
| Data | Seed di memori — belum ada database |

Stack ini sesuai keputusan di transkrip desain (`chats/chat1.md`): Next.js +
TypeScript + Tailwind, nanti dilanjut PostgreSQL + Prisma + Auth.js.

```bash
npm install
npm run dev          # http://localhost:3000

npm run build        # build produksi
npm run start        # jalankan hasil build
npm run typecheck    # tsc --noEmit
```

**Belum ada test runner.** `npm run typecheck` dan `npm run build` adalah satu-
satunya gerbang mutu saat ini; keduanya lolos bersih per commit terakhir.
Menambahkan Vitest + Testing Library adalah pekerjaan yang masuk akal
berikutnya (lihat TODO).

### Demo login

Kata sandi tidak divalidasi — isi apa saja, asal tidak kosong.

| Peran | Email (terisi otomatis) | Akses |
|---|---|---|
| Owner | `yud@rumahpapua.id` | Kalender, Laporan, Properti & Kamar, Pengguna & Peran + semua rupiah |
| Staf | `marthen@rumahpapua.id` | Kalender, Properti & Kamar; tanpa nominal uang |

Keluar lewat kartu profil kanan atas → **Keluar dari akun**.

### Foto panel login

Panel kanan halaman login adalah slot foto kosong. Taruh gambar di `public/`,
lalu set di `.env.local`:

```
NEXT_PUBLIC_LOGIN_HERO=/login-hero.jpg
```

Tanpa variabel itu, panel menampilkan bingkai kosong sesuai desain (tidak ada
request 404).

---

## 4. Pertanyaan terakhir: "Mau saya coba jalankan itu?"

Konteksnya: **push ke GitHub gagal dari sesi ini.**

Yang terjadi — sesi ini dimulai dari *bundle handoff lokal* (folder git tanpa
remote sama sekali), bukan dari clone GitHub. Akibatnya git proxy sesi tidak
pernah memasang kredensial GitHub. Hasil diagnosisnya:

| Uji | Hasil |
|---|---|
| `add_repo` attach repo | berhasil |
| `git push` / `git ls-remote` / `git clone` | gagal — `could not read Username` |
| `curl https://github.com` | 200 — jaringan sampai |
| `curl .../info/refs?service=git-upload-pack` | **401** — request keluar tanpa autentikasi |
| Dicoba sebagai user `claude`, bukan `root` | gagal sama |
| Cari token / credential helper / proxy listener | tidak ada |

Jadi jaringannya jalan, hanya kredensialnya yang tidak pernah tersuntik.

**"Itu" = membuka sesi Claude Code baru yang dimulai langsung dari repo GitHub
`yudventure/unmehopamanagement`,** bukan dari bundle lokal. Sesi yang lahir
dari clone GitHub biasanya sudah membawa kredensial git yang berfungsi, jadi
sesi itu bisa push. Tawaran saya waktu itu adalah menjalankan sesi tersebut.

**Cara lain yang tidak bergantung pada kredensial sesi:** git bundle berisi
histori lengkap sudah dikirim ke pemilik sebagai file
(`unmehopamanagement.bundle`, ~1,7 MB, berisi branch `main` dan
`implement-booking-manager`). Dari komputer sendiri:

```bash
git clone unmehopamanagement.bundle unmehopamanagement
cd unmehopamanagement
git remote set-url origin https://github.com/yudventure/unmehopamanagement
git push -u origin main
git push -u origin implement-booking-manager
```

---

## 5. TODO / langkah selanjutnya

### Mendesak — pekerjaan ini belum aman

1. **Push repo ke GitHub.** Selama belum ter-push, seluruh pekerjaan hanya ada
   di container sementara ini dan hilang saat container berakhir. Pakai salah
   satu dari dua cara di bagian 4.

### Sesuai roadmap di dokumen handoff teknis

2. **Database.** PostgreSQL + Prisma. Yang paling penting: constraint anti-overlap
   di level database (`daterange` + `EXCLUDE USING gist` per kamar) — jangan
   hanya validasi di aplikasi. Skema lengkap ada di
   `project/Handoff Teknis Booking Manager.dc.html`.
3. **Autentikasi asli.** Auth.js (NextAuth) credentials provider + `bcrypt` +
   session cookie httpOnly. **Peran harus dicek di setiap API route** — saat ini
   pembatasan Owner/Staf hanya menyembunyikan menu di UI, itu tidak aman.
4. **Sinkronisasi iCal.** Impor (`node-ical`) dan ekspor (`ics`) per kamar
   dengan token rahasia, simpan `external_uid` supaya sinkron ulang tidak
   menduplikasi booking, plus tabel log sinkron (PRD F3.5). Panel "12 menit
   lalu / 5 feed aktif" dan jumlah feed per kamar sekarang masih statis.
5. **Cron penarik iCal** tiap 15–30 menit, endpoint dilindungi secret header.

### Fitur yang belum ada

6. Ekspor CSV/Excel laporan (F6.5) — tombolnya sudah ada, aksinya belum.
7. Perbandingan antar bulan di laporan (F6.2).
8. Upload bukti transfer (F5.1) + kompresi gambar di browser.
9. Harga musiman (F1.3) — sekarang baru harga dasar per kamar.
10. Halaman "Hari Ini" khusus staf (F2.5 / Alur D).
11. Pengingat pelunasan H-7 / H-3 (F5.4).
12. PWA + cache read-only supaya kalender terakhir terbaca saat offline (NF1).

### Kualitas

13. **Tambahkan test.** Vitest + Testing Library. Prioritas: `lib/derive.ts`
    (perhitungan okupansi/pendapatan dan deteksi bentrok) dan alur simpan
    booking — di situ letak logika bisnis yang paling mudah rusak diam-diam.
14. Tambahkan ESLint (`eslint-config-next`) — sengaja belum dipasang untuk
    memperkecil permukaan instalasi awal.
